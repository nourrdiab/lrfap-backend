const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getLGCDashboard, getApplicantDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/lgc', protect, authorize('lgc'), getLGCDashboard);
router.get('/applicant', protect, authorize('applicant'), getApplicantDashboard);

module.exports = router;