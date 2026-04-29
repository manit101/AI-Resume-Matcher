const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cosineSimilarityScaled } = require('../utils/math');
const { extractYearsOfExperience, scoreExperience, parseRequiredYears } = require('../utils/experienceParser');
const { generateExplanationsBatch } = require('../ai/generateExplanation');

/**
 * Normalizes a skill string for comparison
 * lowercase, remove common prefixes, remove punctuation, trim
 */
const normalizeSkill = (skill) => {
  if (!skill) return '';
  return skill.toLowerCase()
    .replace(/^(knowledge of|experience with|familiarity with|understanding of|ability to|proficient in|proficiency in|strong|basic|working knowledge of)\s+/i, '')
    .replace(/[^\w\s+#.-]/g, '')
    .trim();
};

/**
 * Computes skill match score and categorizes matched/missing
 * @param {Array<string>} resumeSkills 
 * @param {Array<string>} requiredSkills 
 * @param {string} fullText
 */
const computeSkillMatch = (resumeSkills = [], requiredSkills = [], fullText = "") => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 100, matchedSkills: [], missingSkills: [] };
  }
  
  const safeResumeSkills = Array.isArray(resumeSkills) ? resumeSkills : [];
  const normalizedResume = new Set(safeResumeSkills.map(normalizeSkill));
  const lowerFullText = fullText ? fullText.toLowerCase() : "";
  
  const matchedSkills = [];
  const missingSkills = [];

  for (const reqSkill of requiredSkills) {
    const normReq = normalizeSkill(reqSkill);
    let found = false;

    // 1. Check extracted skills array
    for (const resSkill of normalizedResume) {
      if (resSkill === normReq) {
        found = true;
        break;
      }
      
      // If either string is very short (like "c" or "r"), require exact match
      if (resSkill.length <= 2 || normReq.length <= 2) {
        continue;
      }
      
      if (resSkill.includes(normReq) || normReq.includes(resSkill)) {
        found = true;
        break;
      }
    }

    // 2. Fallback: Check raw text if not found in skills array
    if (!found && lowerFullText) {
      let searchStr = normReq;
      if (searchStr.endsWith('s') && searchStr.length > 3) {
        searchStr = searchStr.slice(0, -1);
      }
      
      // Use whole-word boundary regex to prevent false positives like "c" in "react"
      try {
        // Escape special regex chars like +, ., # for the search string
        const escapedSearchStr = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedSearchStr}\\b`, 'i');
        if (regex.test(lowerFullText)) {
          found = true;
        }
      } catch (e) {
        // Fallback to strict includes if regex fails
        if (searchStr.length > 3 && lowerFullText.includes(searchStr)) {
          found = true;
        }
      }
    }

    if (found) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const score = (matchedSkills.length / requiredSkills.length) * 100;
  return { score, matchedSkills, missingSkills };
};

const formatYears = (years) => {
  if (years > 0 && years < 1) {
    return `${Math.round(years * 12)} months`;
  }
  return `${Number.isInteger(years) ? years : years.toFixed(1)} years`;
};

exports.matchPipeline = async (jobId) => {
  try {
    const jd = await prisma.jobDescription.findUnique({ where: { id: jobId } });
    if (!jd || !jd.requirementsEmbedding || !jd.parsedData) {
      console.log(`Cannot run match for JD ${jobId}: Missing embeddings or parsed data.`);
      return;
    }

    // ONLY process resumes that have explicitly requested a match for this JD (PENDING status)
    const linkedMatches = await prisma.matchResult.findMany({
      where: { 
        jobDescriptionId: jobId,
        status: 'PENDING'
      },
      select: { resumeId: true }
    });
    
    if (linkedMatches.length === 0) {
      console.log(`No pending matches to process for JD ${jobId}.`);
      return;
    }

    const pendingResumeIds = linkedMatches.map(m => m.resumeId);

    const resumesToProcess = await prisma.resume.findMany({
      where: { 
        id: { in: pendingResumeIds },
        status: 'COMPLETED'
      }
    });

    if (resumesToProcess.length === 0) {
      console.log(`Waiting for resumes to finish processing for JD ${jobId}.`);
      return;
    }

    const jdRequiredSkills = jd.parsedData.required_skills || [];
    const jdExpRequired = jd.parsedData.experience_required || "";
    
    const intermediateMatches = [];

    for (const resume of resumesToProcess) {
      // 1. Semantic Score (50%)
      const semanticScore = cosineSimilarityScaled(resume.fullEmbedding || [], jd.requirementsEmbedding || []);

      // 2. Skill Score (30%)
      const resumeSkills = resume.parsedData?.skills || [];
      const skillMatch = computeSkillMatch(resumeSkills, jdRequiredSkills, resume.fullText || "");

      // 3. Experience Score (20%)
      let resumeYears = 0;
      if (resume.parsedData && typeof resume.parsedData.total_years_experience === 'number') {
        resumeYears = resume.parsedData.total_years_experience;
      } else {
        resumeYears = await extractYearsOfExperience(resume.experienceText || "");
      }
      
      const experienceScore = scoreExperience(resumeYears, jdExpRequired);
      
      const requiredYearsNum = parseRequiredYears(jdExpRequired);
      let experienceGap;
      if (requiredYearsNum === 0) {
        experienceGap = "No specific experience requirement";
      } else if (resumeYears > requiredYearsNum) {
        experienceGap = `Over by ${formatYears(resumeYears - requiredYearsNum)}`;
      } else if (resumeYears === requiredYearsNum) {
        experienceGap = "Perfect experience match";
      } else {
        experienceGap = `Short by ${formatYears(requiredYearsNum - resumeYears)}`;
      }

      // 4. Final Score
      const finalScore = (0.5 * semanticScore) + (0.3 * skillMatch.score) + (0.2 * experienceScore);

      intermediateMatches.push({
        id: `${resume.id}_${jd.id}`, // temp id for batching
        resumeId: resume.id,
        jobDescriptionId: jd.id,
        score: finalScore,
        matchedSkills: skillMatch.matchedSkills,
        missingSkills: skillMatch.missingSkills,
        experienceGap,
        status: 'COMPLETED'
      });
    }

    // Generate explanations in batch
    const explanationInput = intermediateMatches.map(m => ({
      id: m.id,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills,
      experienceGap: m.experienceGap
    }));

    const explanations = await generateExplanationsBatch(explanationInput);
    const expMap = explanations.reduce((acc, curr) => {
      acc[curr.id] = curr.explanation;
      return acc;
    }, {});

    // Save all to database (Upsert)
    for (const match of intermediateMatches) {
      const explanation = expMap[match.id] || "Good fit based on overall profile.";
      
      await prisma.matchResult.upsert({
        where: {
          resumeId_jobDescriptionId: {
            resumeId: match.resumeId,
            jobDescriptionId: match.jobDescriptionId
          }
        },
        update: {
          score: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          experienceGap: match.experienceGap,
          explanation: explanation,
          status: 'COMPLETED'
        },
        create: {
          resumeId: match.resumeId,
          jobDescriptionId: match.jobDescriptionId,
          score: match.score,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          experienceGap: match.experienceGap,
          explanation: explanation,
          status: 'COMPLETED'
        }
      });
    }

    console.log(`Successfully completed matching pipeline for JD ${jobId}`);

  } catch (error) {
    console.error(`Failed matching pipeline for JD ${jobId}:`, error);
  }
};

// ... keep existing basic CRUD exports if any exist below ...

