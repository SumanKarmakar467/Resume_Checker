const express = require('express');
const {
  getUsersController,
  getAnalysesController,
  getBuildsController,
} = require('../controllers/admin.controller');

const router = express.Router();

router.get('/users', getUsersController);
router.get('/analyses', getAnalysesController);
router.get('/builds', getBuildsController);

module.exports = router;
