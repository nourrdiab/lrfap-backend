const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getMyProfile, updateMyProfile } = require('../controllers/applicantProfileController');

const router = express.Router();

router.get('/me', protect, authorize('applicant'), getMyProfile);
router.put('/me', protect, authorize('applicant'), updateMyProfile);

module.exports = router;