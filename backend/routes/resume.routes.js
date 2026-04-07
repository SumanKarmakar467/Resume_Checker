// Purpose: Resume-focused REST routes.
const express = require('express');

const upload = require('../middleware/upload.middleware');
const {
  analyzeResumeController,
  parseBuilderResumeController,
  generateAtsController,
  markBuildDownloadController,
  getHistoryController,
} = require('../controllers/resume.controller');

const router = express.Router();

router.post('/analyze', upload.single('file'), analyzeResumeController);
router.post('/parse-builder', upload.single('file'), parseBuilderResumeController);
router.post('/generate-ats', generateAtsController);
router.post('/builds/:buildId/download', markBuildDownloadController);
router.get('/history', getHistoryController);

module.exports = router;
