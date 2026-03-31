// Purpose: Resume-focused REST routes.
const express = require('express');

const upload = require('../middleware/upload.middleware');
const {
  analyzeResumeController,
  generateAtsController,
  getHistoryController,
} = require('../controllers/resume.controller');

const router = express.Router();

router.post('/analyze', upload.single('file'), analyzeResumeController);
router.post('/generate-ats', generateAtsController);
router.get('/history', getHistoryController);

module.exports = router;
