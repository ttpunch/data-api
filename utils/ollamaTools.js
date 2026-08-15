const { TOOL_DEFINITIONS } = require("./agentTools.js");

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama.com/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "minimax-m3";
const TIMEOUT_MS = 60000;

const tagged = (code, detail) => Object.assign(new Error(detail), { code });

// One turn of the conversation: send the transcript, get back the model's
// message (which may contain tool_calls).
const chatWithTools = async (transcript) => {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) throw tagged("missing_api_key", "OLLAMA_API_KEY is not configured");
  if (typeof fetch !== "function") {
    throw tagged("runtime_no_fetch", `global fetch unavailable on Node ${process.version}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response;
    try {
      response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          tools: TOOL_DEFINITIONS,
          messages: transcript,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw tagged("upstream_timeout", `no response within ${TIMEOUT_MS}ms`);
      }
      throw tagged("upstream_unreachable", err.message);
    }

    if (!response.ok) {
      throw tagged(`upstream_${response.status}`, `Ollama returned ${response.status}`);
    }

    let body;
    try {
      body = await response.json();
    } catch (err) {
      // Mirrors utils/ollama.js: HTTP 200 with a non-JSON body (e.g. a proxy
      // error page) must not collapse into the generic "unknown" reason.
      throw tagged("bad_model_json", `model reply was not JSON: ${err.message}`);
    }
    return body?.message ?? {};
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { chatWithTools };
