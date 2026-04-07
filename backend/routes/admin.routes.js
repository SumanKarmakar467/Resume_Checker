const express = require('express');
const {
  adminLoginController,
  getUsersController,
  getAnalysesController,
  getBuildsController,
} = require('../controllers/admin.controller');
const { requireAdminAuth } = require('../middleware/adminAuth.middleware');

const router = express.Router();

router.post('/login', adminLoginController);
router.use(requireAdminAuth);
router.get('/users', getUsersController);
router.get('/analyses', getAnalysesController);
router.get('/builds', getBuildsController);

module.exports = router;
