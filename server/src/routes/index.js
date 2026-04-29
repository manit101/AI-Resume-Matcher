const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const resumeController = require('../controllers/resume.controller');
const jdController = require('../controllers/jd.controller');
const matchController = require('../controllers/match.controller');
const dashboardRoutes = require('./dashboard.routes');

// Protect all API routes
router.use(verifyToken);

// Resume Routes
router.post('/resumes', resumeController.uploadResume);
router.get('/resumes', resumeController.getResumes);

// Job Description Routes
router.post('/jds', jdController.createJD);
router.get('/jds', jdController.getJDs);

// Match Routes
router.get('/matches/:jobId', matchController.getMatchesForJob);
router.post('/matches/:matchId/action', matchController.updateRecruiterAction);

// Dashboard Routes
router.use('/dashboard', dashboardRoutes);

module.exports = router;
