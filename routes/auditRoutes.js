const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAuditLogs } = require('../controllers/auditController');

const router = express.Router();

router.use(protect, authorize('lgc'));
router.get('/', getAuditLogs);

module.exports = router;