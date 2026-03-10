const express = require('express');
const upload = require('../middleware/upload');
const { analyze, generateAts } = require('../controllers/resumeController');

const router = express.Router();

router.post('/analyze', upload.single('file'), analyze);
router.post('/generate-ats', generateAts);

module.exports = router;
