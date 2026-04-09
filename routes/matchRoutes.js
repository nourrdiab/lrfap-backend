const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  dryRun,
  executeMatch,
  getMatchRuns,
  getMatchRun,
  publishResults,
} = require('../controllers/matchController');

const router = express.Router();

router.use(protect, authorize('lgc'));

router.post('/dry-run', dryRun);
router.post('/execute', executeMatch);
router.post('/publish', publishResults);
router.get('/runs', getMatchRuns);
router.get('/runs/:id', getMatchRun);

module.exports = router;