const jdService = require('../services/jd.service');
const { processJDPipeline } = require('../services/pipeline.service');

exports.createJD = async (req, res) => {
  try {
    const { title, description, requirements } = req.body;
    const userId = req.user.uid;

    const jd = await jdService.createJobDescription(userId, title, description, requirements);
    
    // Asynchronously trigger the AI processing pipeline
    processJDPipeline(jd.id).catch(err => {
      console.error(`Background pipeline error for JD ${jd.id}:`, err);
    });

    return res.status(201).json({ success: true, data: jd });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.getJDs = async (req, res) => {
  try {
    const userId = req.user.uid;
    const jds = await jdService.getAllUserJobDescriptions(userId);
    return res.status(200).json({ success: true, data: jds });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
