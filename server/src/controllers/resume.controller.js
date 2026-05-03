const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const resumeService = require('../services/resume.service');
const { processResumePipeline } = require('../services/pipeline.service');
const matchService = require('../services/match.service');

exports.uploadResume = async (req, res) => {
  try {
    const { fileName, fileUrl, jobId } = req.body;
    const userId = req.user.uid; // Assumes auth middleware sets req.user

    const { resume, isNew } = await resumeService.createOrGetResumeRecord(userId, fileName, fileUrl);
    
    if (jobId) {
      // Explicitly link the resume to the job description that requested it
      await prisma.matchResult.upsert({
        where: {
          resumeId_jobDescriptionId: {
            resumeId: resume.id,
            jobDescriptionId: jobId
          }
        },
        update: { status: 'PENDING' },
        create: {
          resumeId: resume.id,
          jobDescriptionId: jobId,
          score: 0,
          status: 'PENDING'
        }
      });
    }

    // Determine if the resume needs (re)processing
    // A resume needs processing if it's new OR if it exists but has empty/insufficient data
    // (e.g., scanned PDFs that failed text extraction before OCR was available)
    const needsProcessing = isNew || !resume.fullText || resume.fullText.length < 50;

    if (needsProcessing) {
      // Trigger the full AI processing pipeline (text extraction → parsing → embeddings)
      processResumePipeline(resume.id, jobId).catch(err => {
        console.error(`Background pipeline error for ${resume.id}:`, err);
      });
    } else if (jobId) {
      // Resume has good data already — just trigger matching against the new JD
      matchService.matchPipeline(jobId).catch(err => {
        console.error(`Match error for resume ${resume.id}:`, err);
      });
    }

    return res.status(201).json({ success: true, data: resume, isNew });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getResumes = async (req, res) => {
  try {
    const userId = req.user.uid;
    const resumes = await resumeService.getAllUserResumes(userId);
    return res.status(200).json({ success: true, data: resumes });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
