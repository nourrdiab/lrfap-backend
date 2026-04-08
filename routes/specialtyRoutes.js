const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createSpecialty, getSpecialties, getSpecialty, updateSpecialty, deleteSpecialty,
} = require('../controllers/specialtyController');

const router = express.Router();

router.get('/', getSpecialties);
router.get('/:id', getSpecialty);
router.post('/', protect, authorize('lgc'), createSpecialty);
router.put('/:id', protect, authorize('lgc'), updateSpecialty);
router.delete('/:id', protect, authorize('lgc'), deleteSpecialty);

module.exports = router;