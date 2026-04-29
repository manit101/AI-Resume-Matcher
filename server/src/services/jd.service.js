const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createJobDescription = async (userId, title, description, requirements) => {
  return await prisma.jobDescription.create({
    data: {
      userId,
      title,
      description,
      requirements
    }
  });
};

exports.getJobDescriptionById = async (jdId) => {
  return await prisma.jobDescription.findUnique({
    where: { id: jdId }
  });
};

exports.updateJobDescriptionParsedData = async (jdId, parsedData) => {
  return await prisma.jobDescription.update({
    where: { id: jdId },
    data: { parsedData }
  });
};

exports.getAllUserJobDescriptions = async (userId) => {
  const jobsRaw = await prisma.jobDescription.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      matchResults: {
        select: { score: true }
      }
    }
  });

  return jobsRaw.map(job => {
    const matchCount = job.matchResults.length;
    const maxScore = matchCount > 0 
      ? Math.max(...job.matchResults.map(m => m.score)) 
      : 0;
      
    // Exclude parsedData and embeddings for lighter payload if desired,
    // but we can just return what is needed
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      createdAt: job.createdAt,
      resumeCount: matchCount,
      topScore: Math.round(maxScore)
    };
  });
};
