const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCycle, getCycles, getCycle, updateCycle, updateCycleStatus,
} = require('../controllers/cycleController');

const router = express.Router();

router.get('/', getCycles);
router.get('/:id', getCycle);
router.post('/', protect, authorize('lgc'), createCycle);
router.put('/:id', protect, authorize('lgc'), updateCycle);
router.patch('/:id/status', protect, authorize('lgc'), updateCycleStatus);

module.exports = router;