const { PrismaClient } = require('@prisma/client');
const pLimit = require('p-limit');
const { extractTextFromPdfUrl } = require('../utils/pdfExtractor');
const { parseResume } = require('../ai/parseResume');
const { parseJD } = require('../ai/parseJD');
const { generateEmbeddingsBatched } = require('../ai/generateEmbeddings');
const matchService = require('./match.service');
const { optimizeText } = require('../utils/textOptimizer');

const prisma = new PrismaClient();

// Limit concurrent resume processing to 5 (safe for OpenAI tier-1 rate limits)
const resumeLimit = pLimit(5);
// Limit concurrent JD processing to 5
const jdLimit = pLimit(5);

/**
 * Core pipeline for processing a Resume
 * @param {string} resumeId
 * @param {string} jobId
 */
const processResumePipeline = async (resumeId, jobId) => {
  return resumeLimit(async () => {
    try {
      // 1. Fetch Resume
      const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!resume) throw new Error(`Resume ${resumeId} not found`);

      // 1. Mark resume as PROCESSING
      await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'PROCESSING' }
      });

      // 2. Extract text from PDF
      const rawText = await extractTextFromPdfUrl(resume.fileUrl);

      // 3. Parse resume using OpenAI -> structured JSON
      const parsedData = await parseResume(rawText);

      // 4. Create string segments for embedding
      const skillsText = parsedData.skills ? parsedData.skills.join(', ') : '';
      const experienceText = parsedData.experiencesummary || '';
      const fullText = `Skills: ${skillsText}\nExperience: ${experienceText}\nEducation: ${parsedData.education || ''}\nSummary: ${parsedData.summary || ''}`;

      // 5. Generate embeddings (batched)
      const textsToEmbed = [skillsText, experienceText, fullText];
      const embeddings = await generateEmbeddingsBatched(textsToEmbed);
      
      const skillsEmbedding = embeddings[0];
      const experienceEmbedding = embeddings[1];
      const fullEmbedding = embeddings[2];

      // 6. Store all processed data in DB
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          parsedData,
          skillsText,
          experienceText,
          fullText,
          skillsEmbedding: skillsEmbedding || null,
          experienceEmbedding: experienceEmbedding || null,
          fullEmbedding: fullEmbedding || null,
          status: 'COMPLETED'
        }
      });

      console.log(`Successfully processed resume ${resumeId}`);

      // Trigger matching against the specific JD
      if (jobId) {
        matchService.matchPipeline(jobId).catch(err => {
          console.error(`Matching error for JD ${jobId}:`, err);
        });
      }
    } catch (error) {
      console.error(`Pipeline failed for resume ${resumeId}:`, error);
      
      // Update status to FAILED
      await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'FAILED' }
      });
    }
  });
};

/**
 * Core pipeline for processing a Job Description
 * @param {string} jdId
 */
const processJDPipeline = async (jdId) => {
  return jdLimit(async () => {
    try {
      // 1. Fetch JD
      const jd = await prisma.jobDescription.findUnique({ where: { id: jdId } });
      if (!jd) throw new Error(`Job Description ${jdId} not found`);

      if (jd.parsedData && jd.requirementsEmbedding) {
        console.log(`JD ${jdId} is already processed. Skipping.`);
        return;
      }

      // 2. Parse JD using OpenAI
      const parsedData = await parseJD(jd.title, jd.description, jd.requirements);

      // 3. Prepare requirements text for embedding
      const requiredSkills = parsedData.required_skills ? parsedData.required_skills.join(', ') : '';
      const optionalSkills = parsedData.optional_skills ? parsedData.optional_skills.join(', ') : '';
      const experienceRequired = parsedData.experience_required || '';
      const requirementsText = `Job Title: ${jd.title}\nJob Description: ${jd.description}\nRequired Skills: ${requiredSkills}\nOptional Skills: ${optionalSkills}\nExperience: ${experienceRequired}`;

      // 4. Generate embeddings
      const embeddings = await generateEmbeddingsBatched([requirementsText]);
      const requirementsEmbedding = embeddings[0];

      // 5. Store structured data and embeddings
      await prisma.jobDescription.update({
        where: { id: jdId },
        data: {
          parsedData,
          requirementsEmbedding: requirementsEmbedding || null,
        }
      });

      console.log(`Successfully processed Job Description ${jdId}`);

      // Trigger matching pipeline
      matchService.matchPipeline(jdId).catch(err => {
        console.error(`Matching error for JD ${jdId}:`, err);
      });
    } catch (error) {
      console.error(`Pipeline failed for JD ${jdId}:`, error);
    }
  });
};

module.exports = {
  processResumePipeline,
  processJDPipeline
};
