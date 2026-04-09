const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getMyPrograms,
  getProgramApplications,
  getApplicationDetail,
  getProgramRanking,
  updateProgramRanking,
  submitProgramRanking,
} = require('../controllers/universityReviewController');

const router = express.Router();

router.use(protect, authorize('university', 'lgc'));

router.get('/programs', getMyPrograms);
router.get('/programs/:programId/applications', getProgramApplications);
router.get('/applications/:applicationId', getApplicationDetail);
router.get('/programs/:programId/ranking', getProgramRanking);
router.put('/programs/:programId/ranking', updateProgramRanking);
router.post('/programs/:programId/ranking/submit', submitProgramRanking);

module.exports = router;