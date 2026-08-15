const { callOllama } = require("../utils/ollama.js");
const { normalizeInterpretation } = require("../utils/agentInterpreter.js");

const agentController = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) {
    return res.status(400).json({ message: "message is required" });
  }

  if (message.length > 2000) {
    return res.status(400).json({ message: "message is too long" });
  }

  try {
    const raw = await callOllama(message);
    return res.status(200).json(normalizeInterpretation(raw));
  } catch (error) {
    // Prefix is deliberately distinct from the frontend's console.error text,
    // so a server-side log line can't be mistaken for the browser's.
    console.error("[api/agent/interpret] failed:", error.code || "unknown", "-", error.message);
    // reason is a fixed vocabulary of non-sensitive codes (missing_api_key,
    // runtime_no_fetch, upstream_401, upstream_timeout, bad_model_json, ...).
    // It carries no key, prompt, or user content, and makes a deployed
    // instance diagnosable without host log access.
    return res.status(502).json({
      message: "Could not interpret the message",
      reason: error.code || "unknown",
    });
  }
};

module.exports = agentController;
