const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getHistory, deleteHistory } = require('../controllers/historyController');

const router = express.Router();

router.use(requireAuth);
router.get('/', getHistory);
router.delete('/:id', deleteHistory);

module.exports = router;
