const router = require("express").Router();
const { createRoom, endRoom, getRoomByInvite } = require("../controllers/roomController");

router.post("/", createRoom);
router.get("/invite/:token", getRoomByInvite);
router.patch("/:roomId/end", endRoom);

module.exports = router;
