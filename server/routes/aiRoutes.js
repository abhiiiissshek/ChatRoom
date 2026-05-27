const router = require("express").Router();

const {
  getSuggestions
} = require("../controllers/aiController");

router.post(
  "/suggest",
  getSuggestions
);

module.exports = router;