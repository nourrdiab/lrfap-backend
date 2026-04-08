const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createApplication,
  getMyApplications,
  getApplication,
  updateSelections,
  submitApplication,
  withdrawApplication,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(protect, authorize('applicant'));

router.post('/', createApplication);
router.get('/', getMyApplications);
router.get('/:id', getApplication);
router.put('/:id/selections', updateSelections);
router.post('/:id/submit', submitApplication);
router.post('/:id/withdraw', withdrawApplication);

module.exports = router;