const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cosineSimilarityScaled } = require('../utils/math');
const { extractYearsOfExperience, scoreExperience, parseRequiredYears } = require('../utils/experienceParser');
const { generateExplanationsBatch } = require('../ai/generateExplanation');
const { matchSkillsWithAIBatch } = require('../ai/matchSkills');

/** Chunk an array into smaller arrays of given size */
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Max resumes per AI skill-matching call (prevents exceeding context/output limits)
const SKILL_MATCH_CHUNK_SIZE = 10;
// Max matches per explanation generation call
const EXPLANATION_CHUNK_SIZE = 20;

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

    // Prepare data for batch AI matching
    const matchDataForAI = resumesToProcess.map(resume => ({
      resumeId: resume.id,
      resumeSkills: resume.parsedData?.skills || [],
      resumeFullText: resume.fullText || ""
    }));

    // Use AI to match skills in chunked batches (prevents exceeding context window for large resume sets)
    const matchChunks = chunk(matchDataForAI, SKILL_MATCH_CHUNK_SIZE);
    const allSkillMatches = [];
    for (const matchChunk of matchChunks) {
      const chunkResults = await matchSkillsWithAIBatch(matchChunk, jdRequiredSkills);
      allSkillMatches.push(...chunkResults);
    }
    const aiMatchMap = allSkillMatches.reduce((acc, m) => {
      acc[m.resumeId] = m;
      return acc;
    }, {});

    for (const resume of resumesToProcess) {
      // Get AI-powered skill matching
      const aiMatch = aiMatchMap[resume.id] || { 
        matchedSkills: [], 
        missingSkills: jdRequiredSkills, 
        skillScore: 0 
      };

      // 1. Semantic Score
      const semanticScore = cosineSimilarityScaled(resume.fullEmbedding || [], jd.requirementsEmbedding || []);

      // 2. Skill Score - AI-powered matching
      const skillScore = aiMatch.skillScore || 0;

      // 3. Experience Score
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

      // 4. Dynamic Weights — adapt based on JD context
      // Skills are the most reliable signal (AI-powered). Semantic embeddings are noisy tie-breakers.
      let wSemantic, wSkill, wExperience;
      
      if (requiredYearsNum === 0) {
        // No experience specified (intern/entry-level/unspecified):
        // Skills dominate; experience is irrelevant; semantic is a minor tie-breaker
        wSemantic = 0.10;
        wSkill = 0.90;
        wExperience = 0.00;
      } else {
        // Experience is specified: skills still lead, experience matters, semantic is a tie-breaker
        wSemantic = 0.10;
        wSkill = 0.55;
        wExperience = 0.35;
      }

      let finalScore = (wSemantic * semanticScore) + (wSkill * skillScore) + (wExperience * experienceScore);

      // 5. Relevance Gate — if skill match is extremely low, cap the total score
      // A candidate with near-zero skill overlap should not score high regardless of experience/semantics
      if (skillScore < 10) {
        finalScore = Math.min(finalScore, Math.max(skillScore, 5));
      }

      intermediateMatches.push({
        id: `${resume.id}_${jd.id}`, // temp id for batching
        resumeId: resume.id,
        jobDescriptionId: jd.id,
        score: finalScore,
        matchedSkills: aiMatch.matchedSkills,
        missingSkills: aiMatch.missingSkills,
        experienceGap,
        status: 'COMPLETED'
      });
    }

    // Generate explanations in chunked batches (prevents exceeding context window)
    const explanationInput = intermediateMatches.map(m => ({
      id: m.id,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills,
      experienceGap: m.experienceGap
    }));

    const expChunks = chunk(explanationInput, EXPLANATION_CHUNK_SIZE);
    const allExplanations = [];
    for (const expChunk of expChunks) {
      const chunkResults = await generateExplanationsBatch(expChunk);
      allExplanations.push(...chunkResults);
    }
    const expMap = allExplanations.reduce((acc, curr) => {
      acc[curr.id] = curr.explanation;
      return acc;
    }, {});

    // Save all to database (parallel upserts for speed)
    await Promise.all(intermediateMatches.map(match => {
      const explanation = expMap[match.id] || "Good fit based on overall profile.";
      
      return prisma.matchResult.upsert({
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
    }));

    console.log(`Successfully completed matching pipeline for JD ${jobId}`);

  } catch (error) {
    console.error(`Failed matching pipeline for JD ${jobId}:`, error);
  }
};

// ... keep existing basic CRUD exports if any exist below ...

