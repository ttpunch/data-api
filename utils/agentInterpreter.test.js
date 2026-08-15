import { describe, it, expect } from "vitest";
import { normalizeInterpretation, CONFIDENCE_FLOOR } from "./agentInterpreter.js";

describe("normalizeInterpretation", () => {
  it("keeps a confident breakdown and lists no missing fields", () => {
    const out = normalizeInterpretation({
      intent: "breakdown",
      confidence: 0.9,
      fields: { mcdata: "251", bgdetail: "spindle motor failure", bgdate: "2026-08-15" },
    });
    expect(out.intent).toBe("breakdown");
    expect(out.fields).toEqual({
      mcdata: "251",
      bgdetail: "spindle motor failure",
      bgdate: "2026-08-15",
    });
    expect(out.missing).toEqual([]);
  });

  it("reports required breakdown fields that are absent", () => {
    const out = normalizeInterpretation({
      intent: "breakdown",
      confidence: 0.9,
      fields: { bgdetail: "spindle motor failure" },
    });
    expect(out.missing).toEqual(["mcdata"]);
    expect(out.fields.mcdata).toBe("");
    expect(out.fields.bgdate).toBe(null);
  });

  it("downgrades a low-confidence guess to clarify", () => {
    const out = normalizeInterpretation({
      intent: "breakdown",
      confidence: CONFIDENCE_FLOOR - 0.01,
      fields: { mcdata: "251", bgdetail: "something" },
    });
    expect(out.intent).toBe("clarify");
    expect(out.fields).toEqual({});
    expect(out.clarifyQuestion).toBeTruthy();
  });

  it("keeps the model's own clarify question when it asks one", () => {
    const out = normalizeInterpretation({
      intent: "clarify",
      confidence: 0.8,
      clarifyQuestion: "Is this a breakdown or a new machine?",
    });
    expect(out.intent).toBe("clarify");
    expect(out.clarifyQuestion).toBe("Is this a breakdown or a new machine?");
    expect(out.fields).toEqual({});
  });

  it("drops fields that do not belong to the chosen intent", () => {
    const out = normalizeInterpretation({
      intent: "machine_details",
      confidence: 0.9,
      fields: { machine_no: "251", bgdetail: "leaked from the other schema" },
    });
    expect(out.fields.bgdetail).toBeUndefined();
    expect(out.fields.machine_no).toBe("251");
  });

  it("defaults machine_details specifications to an array", () => {
    const out = normalizeInterpretation({
      intent: "machine_details",
      confidence: 0.9,
      fields: { machine_no: "251" },
    });
    expect(out.fields.specifications).toEqual([]);
  });

  it("keeps only well-formed specification entries", () => {
    const out = normalizeInterpretation({
      intent: "machine_details",
      confidence: 0.9,
      fields: {
        machine_no: "251",
        specifications: [
          { key: "Motor", value: "All axis" },
          { value: "no key so it is dropped" },
          "not an object",
        ],
      },
    });
    expect(out.fields.specifications).toEqual([{ key: "Motor", value: "All axis" }]);
  });

  it("treats an unknown intent as unsupported", () => {
    const out = normalizeInterpretation({ intent: "delete_everything", confidence: 0.99 });
    expect(out.intent).toBe("unsupported");
    expect(out.fields).toEqual({});
  });

  it("treats a null or non-object reply as unsupported", () => {
    expect(normalizeInterpretation(null).intent).toBe("unsupported");
    expect(normalizeInterpretation("nonsense").intent).toBe("unsupported");
  });

  it("treats a missing confidence as zero, so it cannot reach the save step", () => {
    const out = normalizeInterpretation({
      intent: "breakdown",
      fields: { mcdata: "251", bgdetail: "x" },
    });
    expect(out.intent).toBe("clarify");
  });

  it("accepts values under a data key, as minimax-m3 sometimes returns", () => {
    const out = normalizeInterpretation({
      intent: "breakdown",
      confidence: 0.9,
      data: { mcdata: "251", bgdetail: "spindle motor failure", bgdate: "2026-08-15" },
    });
    expect(out.fields.mcdata).toBe("251");
    expect(out.fields.bgdetail).toBe("spindle motor failure");
  });

  it("prefers fields over data when a model sends both", () => {
    const out = normalizeInterpretation({
      intent: "machine_details",
      confidence: 0.9,
      fields: { machine_no: "correct" },
      data: { machine_no: "stale" },
    });
    expect(out.fields.machine_no).toBe("correct");
  });

  it("finds a clarify question nested inside data", () => {
    const out = normalizeInterpretation({
      intent: "clarify",
      confidence: 0.85,
      data: { clarifyQuestion: "Which machine is this about?" },
    });
    expect(out.clarifyQuestion).toBe("Which machine is this about?");
  });
});
