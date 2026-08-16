const machine = require("../models/machine.js");
const { runToolLoop } = require("../utils/agentTools.js");
const { chatWithTools } = require("../utils/ollamaTools.js");

// The only database access this endpoint has is this read. There is no write
// path here at all — writes happen when the user confirms, via the existing
// edit and delete endpoints.
//
// limit(50) mirrors MAX_RECORDS in utils/agentTools.js, which truncates the
// result to 50 records after loading it. Bounding the query here means the
// database does that trimming instead of the full history being fetched into
// memory on every request. Keep these two literals in sync.
const findBreakdowns = async (machineNo) => {
  try {
    return await machine.find({ machine_no: machineNo }).sort({ bgdate: -1 }).limit(50).lean();
  } catch (error) {
    // Re-tag so a driver-specific code (Mongo error code, ETIMEDOUT, etc.)
    // never reaches the client outside the fixed reason vocabulary.
    throw Object.assign(new Error(error.message), { code: "db_error" });
  }
};

const agentActController = async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (!message) return res.status(400).json({ message: "message is required" });
  if (message.length > 2000) return res.status(400).json({ message: "message is too long" });

  try {
    const result = await runToolLoop({ message, chat: chatWithTools, findBreakdowns });
    return res.status(200).json(result);
  } catch (error) {
    console.error("[api/agent/act] failed:", error.code || "unknown", "-", error.message);
    return res.status(502).json({
      message: "Could not complete the request",
      reason: error.code || "unknown",
    });
  }
};

module.exports = agentActController;
