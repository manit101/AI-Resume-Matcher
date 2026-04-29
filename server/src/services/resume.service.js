// Resume Service - handles business logic and db interactions
// Note: AI parsing logic is delegated to the ai/ folder

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrGetResumeRecord = async (userId, fileName, fileUrl) => {
  // Check if a resume with the same name already exists for this user
  const existing = await prisma.resume.findFirst({
    where: { userId, fileName }
  });

  if (existing) {
    return { resume: existing, isNew: false };
  }

  const newResume = await prisma.resume.create({
    data: {
      userId,
      fileName,
      fileUrl,
      status: 'PENDING'
    }
  });

  return { resume: newResume, isNew: true };
};

exports.updateResumeStatus = async (resumeId, status, parsedData = null) => {
  const data = { status };
  if (parsedData) data.parsedData = parsedData;
  
  return await prisma.resume.update({
    where: { id: resumeId },
    data
  });
};

exports.getResumeById = async (resumeId) => {
  return await prisma.resume.findUnique({
    where: { id: resumeId }
  });
};

exports.getAllUserResumes = async (userId) => {
  return await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};
