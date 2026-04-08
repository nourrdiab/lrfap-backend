const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createProgram, getPrograms, getProgram, updateProgram, deleteProgram,
} = require('../controllers/programController');

const router = express.Router();

router.get('/', getPrograms);
router.get('/:id', getProgram);
router.post('/', protect, authorize('lgc', 'university'), createProgram);
router.put('/:id', protect, authorize('lgc', 'university'), updateProgram);
router.delete('/:id', protect, authorize('lgc'), deleteProgram);

module.exports = router;