const router = require("express").Router();
const upload = require("../middleware/uploadMiddleware");
const {
  createStatus,
  getStatuses,
  markSeen,
  reactToStatus,
  replyToStatus
} = require("../controllers/statusController");

router.get("/", getStatuses);
router.post("/", upload.single("file"), createStatus);
router.post("/:statusId/seen", markSeen);
router.post("/:statusId/react", reactToStatus);
router.post("/:statusId/reply", replyToStatus);

module.exports = router;
