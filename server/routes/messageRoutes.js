const router = require("express").Router();

const upload = require("../middleware/uploadMiddleware");

const {
  getMessages,
  uploadMedia
} = require("../controllers/messageController");

router.get("/:u1/:u2", getMessages);

router.post(
  "/upload",
  upload.single("file"),
  uploadMedia
);

module.exports = router;