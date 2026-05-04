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

    // Fetch the latest recruiter actions for these matches
    const matchIds = matches.map(m => m.id);
    const actions = await prisma.recruiterAction.findMany({
      where: { 
        targetId: { in: matchIds },
        userId: req.user.uid 
      },
      orderBy: { createdAt: 'desc' } // Descending so the first one we find is the latest
    });

    // Map the latest action to each match
    const actionMap = {};
    for (const action of actions) {
      if (!actionMap[action.targetId]) {
        actionMap[action.targetId] = action.action; // Store the most recent action
      }
    }

    const matchesWithActions = matches.map(m => ({
      ...m,
      action: actionMap[m.id] || null
    }));

    return res.status(200).json({ success: true, data: matchesWithActions });
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
