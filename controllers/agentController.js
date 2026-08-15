const { callOllama } = require("../utils/ollama.js");
const { normalizeInterpretation } = require("../utils/agentInterpreter.js");

const agentController = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ message: "message is required" });
  }

  try {
    const raw = await callOllama(message);
    return res.status(200).json(normalizeInterpretation(raw));
  } catch (error) {
    console.error("Agent interpret failed:", error.message);
    return res.status(502).json({ message: "Could not interpret the message" });
  }
};

module.exports = agentController;
