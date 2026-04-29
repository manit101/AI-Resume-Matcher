const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    // 1. Total Matchings
    const totalMatchings = await prisma.matchResult.count({
      where: {
        jobDescription: {
          userId: userId
        }
      }
    });

    // 2. Total Resumes Processed
    const totalResumes = await prisma.resume.count({
      where: {
        userId: userId
      }
    });

    // 3. Shortlisted Candidates
    const shortlistedCount = await prisma.recruiterAction.count({
      where: {
        userId: userId,
        action: 'SHORTLISTED'
      }
    });

    // 4. Rejected Candidates
    const rejectedCount = await prisma.recruiterAction.count({
      where: {
        userId: userId,
        action: 'REJECTED'
      }
    });

    // 5. Recent Job Matchings (up to 5)
    // We fetch the latest 5 JDs and aggregate their match stats
    const recentJobsRaw = await prisma.jobDescription.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        matchResults: {
          select: { score: true }
        }
      }
    });

    const recentJobs = recentJobsRaw.map(job => {
      const matchCount = job.matchResults.length;
      const maxScore = matchCount > 0 
        ? Math.max(...job.matchResults.map(m => m.score)) 
        : 0;
        
      return {
        id: job.id,
        title: job.title,
        createdAt: job.createdAt,
        resumeCount: matchCount,
        topScore: Math.round(maxScore)
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalMatchings,
          totalResumes,
          shortlistedCount,
          rejectedCount
        },
        recentJobs
      }
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
