const { RESPONSE_SCHEMA } = require("./agentInterpreter.js");
const dotenv = require("dotenv");
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || "https://ollama.com/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "minimax-m3";
const TIMEOUT_MS = 60000;

// minimax-m3 wraps its JSON in a ```json fence despite the format schema.
// Verified live 2026-08-15; gpt-oss:120b does not. Strip it before parsing.
const stripFence = (text) =>
  text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

const systemPrompt = (today) => `You convert a maintenance engineer's sentence into structured data for a machine breakdown tracker. Today's date is ${today}.

Choose exactly one intent:
- "breakdown": a fault, failure, repair, or observation about a machine on a date. Fields: mcdata (the machine number), bgdetail (what happened), bgdate (YYYY-MM-DD; resolve words like "today" or "yesterday" against today's date; use null if no date is implied).
- "machine_details": describes a machine itself — its name, location, or specifications. Fields: machine_no, machine_name, location, specifications (a list of {key, value}).
- "clarify": the sentence could plausibly be either of the above, or a required field is unclear. Set clarifyQuestion to a single short question.
- "unsupported": the sentence is not about machines at all.

Set confidence between 0 and 1 for how sure you are of the intent. Never invent a machine number, date, or detail that the sentence does not support — leave it out instead.

Put every extracted value under the "fields" key, and put clarifyQuestion at the top level. Reply with raw JSON only — no markdown code fence.`;

// Tag failures with a short, non-sensitive code so a deployed instance can be
// diagnosed from the HTTP response alone, without needing host log access.
// Codes never contain the key, the prompt, or the user's message.
const tagged = (code, detail) => Object.assign(new Error(detail), { code });

const callOllama = async (message) => {
  const apiKey = process.env.OLLAMA_API_KEY;
  if (!apiKey) throw tagged("missing_api_key", "OLLAMA_API_KEY is not configured");

  // Node <18 has no global fetch. Without this the failure surfaces as a bare
  // ReferenceError, which is indistinguishable from a real upstream problem.
  if (typeof fetch !== "function") {
    throw tagged("runtime_no_fetch", `global fetch unavailable on Node ${process.version}`);
  }

  const today = new Date().toISOString().slice(0, 10);
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
          format: RESPONSE_SCHEMA,
          messages: [
            { role: "system", content: systemPrompt(today) },
            { role: "user", content: message },
          ],
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw tagged("upstream_timeout", `no response within ${TIMEOUT_MS}ms`);
      }
      // DNS failure, blocked egress, TLS problem, connection refused.
      throw tagged("upstream_unreachable", err.message);
    }

    if (!response.ok) {
      // 401/403 => bad key value. 404 => OLLAMA_MODEL name wrong.
      throw tagged(`upstream_${response.status}`, `Ollama returned ${response.status} for model "${OLLAMA_MODEL}"`);
    }

    const body = await response.json();
    const content = body?.message?.content;
    if (typeof content !== "string") return null;
    try {
      return JSON.parse(stripFence(content));
    } catch (err) {
      throw tagged("bad_model_json", `model reply was not JSON: ${err.message}`);
    }
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { callOllama };
