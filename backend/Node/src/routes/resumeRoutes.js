const express = require('express');
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');
const { analyze, generateAts, suggestions, extractProfile } = require('../controllers/resumeController');

const router = express.Router();

router.post('/analyze', optionalAuth, upload.single('file'), analyze);
router.post('/extract-profile', optionalAuth, upload.single('file'), extractProfile);
router.post('/generate-ats', generateAts);
router.post('/suggestions', suggestions);

module.exports = router;
