const router = require("express").Router();

const {
  upsertUser,
  searchUsers,
  updateUser
} = require("../controllers/userController");

router.post("/upsert", upsertUser);

router.get("/", searchUsers);

router.patch("/:uid", updateUser);

module.exports = router;
