const router = require("express").Router();

const {
  upsertUser,
  searchUsers
} = require("../controllers/userController");

router.post("/upsert", upsertUser);

router.get("/", searchUsers);

module.exports = router;