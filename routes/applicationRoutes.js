const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createApplication,
  getMyApplications,
  getApplication,
  updateSelections,
  submitApplication,
  withdrawApplication,
  acceptOffer,
  declineOffer,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(protect, authorize('applicant'));

router.post('/', createApplication);
router.get('/', getMyApplications);
router.get('/:id', getApplication);
router.put('/:id/selections', updateSelections);
router.post('/:id/submit', submitApplication);
router.post('/:id/withdraw', withdrawApplication);
router.post('/:id/offer/accept', acceptOffer);
router.post('/:id/offer/decline', declineOffer);

module.exports = router;