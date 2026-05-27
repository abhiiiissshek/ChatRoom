const router = require("express").Router();

const {
  getConversations
} = require("../controllers/conversationController");

router.get("/:uid", getConversations);

module.exports = router;