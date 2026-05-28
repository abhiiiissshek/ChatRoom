const router = require("express").Router();
const {
  addMembers,
  createGroup,
  deleteGroup,
  getGroups,
  pinMessage,
  removeMember,
  updateGroup
} = require("../controllers/groupController");

router.get("/:uid", getGroups);
router.post("/", createGroup);
router.patch("/:groupId", updateGroup);
router.post("/:groupId/members", addMembers);
router.delete("/:groupId/members/:memberId", removeMember);
router.delete("/:groupId", deleteGroup);
router.post("/:groupId/pins", pinMessage);

module.exports = router;
