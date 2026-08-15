import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { runToolLoop, MAX_ITERATIONS, TOOL_DEFINITIONS } = require("./agentTools.js");

// A fake `chat` that replays a scripted list of model replies in order.
const scriptedChat = (replies) => {
  let i = 0;
  return async () => replies[i++] ?? { content: "done" };
};

const RECORD = {
  _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
  machine_no: "251",
  breakdown: "spindle motor failure",
  bgdate: "2026-08-15T00:00:00.000Z",
};

describe("TOOL_DEFINITIONS", () => {
  it("exposes exactly the three intended tools", () => {
    expect(TOOL_DEFINITIONS.map((t) => t.function.name)).toEqual([
      "find_breakdowns",
      "propose_update_breakdown",
      "propose_delete_breakdown",
    ]);
  });
});

describe("runToolLoop — lookup", () => {
  it("executes find_breakdowns and returns the real records", async () => {
    const out = await runToolLoop({
      message: "what happened to 251",
      chat: scriptedChat([
        { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "251" } } }] },
        { content: "Here is the history." },
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out.kind).toBe("records");
    expect(out.machine_no).toBe("251");
    expect(out.records).toEqual([RECORD]);
  });

  it("reports plainly when a machine has no records", async () => {
    const out = await runToolLoop({
      message: "what happened to 999",
      chat: scriptedChat([
        { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "999" } } }] },
        { content: "Nothing found." },
      ]),
      findBreakdowns: async () => [],
    });
    expect(out.kind).toBe("reply");
    expect(out.text).toContain("999");
  });
});

describe("runToolLoop — id provenance (security critical)", () => {
  it("refuses a delete whose id was never returned by a lookup", async () => {
    const out = await runToolLoop({
      message: "delete record abc",
      chat: scriptedChat([
        {
          tool_calls: [
            { function: { name: "propose_delete_breakdown", arguments: { id: "ffffffffffffffffffffffff" } } },
          ],
        },
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out.kind).toBe("error");
    expect(out.reason).toBe("unknown_record_id");
  });

  it("refuses an update whose id was never returned by a lookup", async () => {
    const out = await runToolLoop({
      message: "change that record",
      chat: scriptedChat([
        {
          tool_calls: [
            {
              function: {
                name: "propose_update_breakdown",
                arguments: { id: "ffffffffffffffffffffffff", breakdown: "x" },
              },
            },
          ],
        },
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out.kind).toBe("error");
    expect(out.reason).toBe("unknown_record_id");
  });

  it("allows a delete for an id that a lookup did return", async () => {
    const out = await runToolLoop({
      message: "delete the spindle one for 251",
      chat: scriptedChat([
        { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "251" } } }] },
        { tool_calls: [{ function: { name: "propose_delete_breakdown", arguments: { id: RECORD._id } } }] },
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out.kind).toBe("propose_delete");
    expect(out.record).toEqual(RECORD);
  });

  it("carries only the changed fields on an update proposal", async () => {
    const out = await runToolLoop({
      message: "fix the date on that one",
      chat: scriptedChat([
        { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "251" } } }] },
        {
          tool_calls: [
            {
              function: {
                name: "propose_update_breakdown",
                arguments: { id: RECORD._id, bgdate: "2026-08-12" },
              },
            },
          ],
        },
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out.kind).toBe("propose_update");
    expect(out.changes).toEqual({ bgdate: "2026-08-12" });
    expect(out.record).toEqual(RECORD);
  });
});

describe("runToolLoop — only the first tool_call in a reply is executed (regression guard)", () => {
  it("does not let a proposal riding with its own legitimising lookup through in the same turn", async () => {
    const out = await runToolLoop({
      message: "look up 251 and delete the spindle one",
      chat: scriptedChat([
        {
          tool_calls: [
            { function: { name: "find_breakdowns", arguments: { machine_no: "251" } } },
            { function: { name: "propose_delete_breakdown", arguments: { id: RECORD._id } } },
          ],
        },
        // No further scripted reply: the loop calls chat() again after the lookup
        // and gets the default { content: "done" }, which is what proves the
        // second call in the array was never executed.
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out.kind).not.toBe("propose_delete");
    // The lookup (calls[0]) did run and its records are what come back.
    expect(out.kind).toBe("records");
    expect(out.records).toEqual([RECORD]);
  });

  it("checks a proposal before any lookup later in the same array can legitimise it", async () => {
    const out = await runToolLoop({
      message: "delete it, also look up 251",
      chat: scriptedChat([
        {
          tool_calls: [
            { function: { name: "propose_delete_breakdown", arguments: { id: RECORD._id } } },
            { function: { name: "find_breakdowns", arguments: { machine_no: "251" } } },
          ],
        },
      ]),
      findBreakdowns: async () => [RECORD],
    });
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });
});

describe("runToolLoop — id type handling (regression guard)", () => {
  const lookupThenPropose = (idArg) =>
    runToolLoop({
      message: "delete that one",
      chat: scriptedChat([
        { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "251" } } }] },
        { tool_calls: [{ function: { name: "propose_delete_breakdown", arguments: { id: idArg } } }] },
      ]),
      findBreakdowns: async () => [RECORD],
    });

  it("rejects a numeric id even when it would coerce to a real id's text", async () => {
    const out = await lookupThenPropose(12345);
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });

  it("rejects a null id", async () => {
    const out = await lookupThenPropose(null);
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });

  it("rejects an array wrapping the real id", async () => {
    const out = await lookupThenPropose([RECORD._id]);
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });

  it("rejects an object whose toString would produce the real id", async () => {
    const out = await lookupThenPropose({ toString: () => RECORD._id });
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });

  it("rejects the real id in a different letter case", async () => {
    const out = await lookupThenPropose(RECORD._id.toUpperCase());
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });

  it("still accepts the real id with surrounding whitespace, because str() trims by design", async () => {
    const out = await lookupThenPropose(`  ${RECORD._id}  `);
    expect(out.kind).toBe("propose_delete");
    expect(out.record).toEqual(RECORD);
  });
});

describe("runToolLoop — records without a usable _id (regression guard)", () => {
  it("does not let a record lacking _id seed a usable 'undefined' provenance key", async () => {
    const out = await runToolLoop({
      message: "delete that one",
      chat: scriptedChat([
        { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "251" } } }] },
        {
          tool_calls: [
            { function: { name: "propose_delete_breakdown", arguments: { id: "undefined" } } },
          ],
        },
      ]),
      findBreakdowns: async () => [{ machine_no: "251", breakdown: "x" }],
    });
    expect(out).toEqual({ kind: "error", reason: "unknown_record_id" });
  });
});

describe("runToolLoop — bounds and malformed input", () => {
  it("stops after MAX_ITERATIONS instead of looping forever", async () => {
    let calls = 0;
    const chat = async () => {
      calls += 1;
      return { tool_calls: [{ function: { name: "find_breakdowns", arguments: { machine_no: "251" } } }] };
    };
    const out = await runToolLoop({ message: "loop", chat, findBreakdowns: async () => [RECORD] });
    expect(calls).toBe(MAX_ITERATIONS);
    expect(["records", "reply"]).toContain(out.kind);
  });

  it("returns a plain reply when the model calls no tool at all", async () => {
    const out = await runToolLoop({
      message: "hello",
      chat: scriptedChat([{ content: "Ask me about a machine." }]),
      findBreakdowns: async () => [],
    });
    expect(out).toEqual({ kind: "reply", text: "Ask me about a machine." });
  });

  it("treats an unknown tool name as an error rather than guessing", async () => {
    const out = await runToolLoop({
      message: "drop the table",
      chat: scriptedChat([{ tool_calls: [{ function: { name: "drop_everything", arguments: {} } }] }]),
      findBreakdowns: async () => [],
    });
    expect(out.kind).toBe("error");
    expect(out.reason).toBe("unknown_tool");
  });

  it("errors rather than throwing when find_breakdowns has no machine number", async () => {
    const out = await runToolLoop({
      message: "look something up",
      chat: scriptedChat([{ tool_calls: [{ function: { name: "find_breakdowns", arguments: {} } }] }]),
      findBreakdowns: async () => [],
    });
    expect(out.kind).toBe("error");
    expect(out.reason).toBe("missing_machine_no");
  });
});
