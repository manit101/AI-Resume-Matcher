const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getMatchesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const matches = await prisma.matchResult.findMany({
      where: { jobDescriptionId: jobId },
      include: {
        resume: true
      },
      orderBy: { score: 'desc' }
    });

    return res.status(200).json({ success: true, data: matches });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateRecruiterAction = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { action } = req.body; // e.g., "SHORTLISTED", "REJECTED", "HOLD"
    const userId = req.user.uid;

    const recruiterAction = await prisma.recruiterAction.create({
      data: {
        userId,
        action,
        targetId: matchId
      }
    });

    return res.status(201).json({ success: true, data: recruiterAction });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
