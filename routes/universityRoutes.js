const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createUniversity, getUniversities, getUniversity, updateUniversity, deleteUniversity,
} = require('../controllers/universityController');

const router = express.Router();

router.get('/', getUniversities);
router.get('/:id', getUniversity);
router.post('/', protect, authorize('lgc'), createUniversity);
router.put('/:id', protect, authorize('lgc'), updateUniversity);
router.delete('/:id', protect, authorize('lgc'), deleteUniversity);

module.exports = router;