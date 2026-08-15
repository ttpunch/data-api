const CONFIDENCE_FLOOR = 0.5;

const INTENTS = ["breakdown", "machine_details", "clarify", "unsupported"];

const REQUIRED = {
  breakdown: ["mcdata", "bgdetail"],
  machine_details: ["machine_no"],
};

const DEFAULT_CLARIFY =
  "I'm not sure I understood that. Is this a breakdown report, or details for a machine?";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    intent: { type: "string", enum: INTENTS },
    confidence: { type: "number" },
    clarifyQuestion: { type: "string" },
    fields: {
      type: "object",
      properties: {
        mcdata: { type: "string" },
        bgdetail: { type: "string" },
        bgdate: { type: "string" },
        machine_no: { type: "string" },
        machine_name: { type: "string" },
        location: { type: "string" },
        specifications: {
          type: "array",
          items: {
            type: "object",
            properties: { key: { type: "string" }, value: { type: "string" } },
            required: ["key", "value"],
          },
        },
      },
    },
  },
  required: ["intent", "confidence"],
};

const str = (v) => (typeof v === "string" ? v.trim() : "");

const pickFields = (intent, fields) => {
  if (intent === "breakdown") {
    return {
      mcdata: str(fields.mcdata),
      bgdetail: str(fields.bgdetail),
      bgdate: str(fields.bgdate) || null,
    };
  }
  return {
    machine_no: str(fields.machine_no),
    machine_name: str(fields.machine_name),
    location: str(fields.location),
    specifications: Array.isArray(fields.specifications)
      ? fields.specifications
          .filter((s) => s && typeof s === "object" && str(s.key))
          .map((s) => ({ key: str(s.key), value: str(s.value) }))
      : [],
  };
};

const clarify = (question) => ({
  intent: "clarify",
  confidence: 0,
  fields: {},
  missing: [],
  clarifyQuestion: str(question) || DEFAULT_CLARIFY,
});

const container = (raw) => {
  const source = [raw.fields, raw.data].find((c) => c && typeof c === "object");
  return source || {};
};

const normalizeInterpretation = (raw) => {
  if (!raw || typeof raw !== "object") {
    return { intent: "unsupported", confidence: 0, fields: {}, missing: [], clarifyQuestion: "" };
  }

  const intent = INTENTS.includes(raw.intent) ? raw.intent : "unsupported";
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0;

  if (intent === "clarify") return clarify(raw.clarifyQuestion || container(raw).clarifyQuestion);

  if (intent === "unsupported") {
    return { intent, confidence, fields: {}, missing: [], clarifyQuestion: "" };
  }

  if (confidence < CONFIDENCE_FLOOR) return clarify(raw.clarifyQuestion);

  const fields = pickFields(intent, container(raw));
  const missing = REQUIRED[intent].filter((name) => !fields[name]);

  return { intent, confidence, fields, missing, clarifyQuestion: "" };
};

module.exports = { normalizeInterpretation, CONFIDENCE_FLOOR, RESPONSE_SCHEMA, DEFAULT_CLARIFY };
