// Purpose: Resume-focused REST routes.
const express = require('express');

const upload = require('../middleware/upload.middleware');
const { requireProFeature, enforceFreeAnalyzeLimit } = require('../middleware/proPlan.middleware');
const {
  analyzeResumeController,
  parseBuilderResumeController,
  generateAtsController,
  markBuildDownloadController,
  getHistoryController,
  deleteHistoryItemController,
  bulkAnalyzeResumeController,
} = require('../controllers/resume.controller');

const router = express.Router();

router.post('/analyze', enforceFreeAnalyzeLimit, upload.single('file'), analyzeResumeController);
router.post('/bulk-analyze', requireProFeature, upload.array('files', 20), bulkAnalyzeResumeController);
router.post('/parse-builder', upload.single('file'), parseBuilderResumeController);
router.post('/generate-ats', generateAtsController);
router.post('/builds/:buildId/download', markBuildDownloadController);
router.get('/history', requireProFeature, getHistoryController);
router.delete('/history/:id', requireProFeature, deleteHistoryItemController);

module.exports = router;
