const router = require('express').Router();
const {
  uploadReport,
  getMyReports,
  deleteReport,
} = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect, restrictTo('patient'));

router.post('/', upload.single('file'), uploadReport);
router.get('/my', getMyReports);
router.delete('/:id', deleteReport);

module.exports = router;