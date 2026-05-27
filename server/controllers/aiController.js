exports.getSuggestions = async (req, res) => {
  try {
    const { messages } = req.body || {};

    const last =
      messages?.length
        ? messages[messages.length - 1]
            .text || ""
        : "";

    const suggestions = [
      "Sounds good — I'll handle that.",
      "Can you send more details?",
      "I can do that tomorrow.",
      "Thanks! I'll confirm.",
      "Great idea."
    ];

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({
      error: "server error"
    });
  }
};