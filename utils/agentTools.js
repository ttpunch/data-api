const MAX_ITERATIONS = 4;
const MAX_RECORDS = 50;

const SYSTEM_PROMPT = `You help a maintenance engineer work with a machine breakdown database.

Use the tools to look things up. Never invent record data or record ids.

Rules you must follow:
- To change or remove a record you must FIRST call find_breakdowns and use an id from its results. Never guess an id.
- Deletions are one record at a time. If the user asks to delete several, call find_breakdowns and let them choose.
- propose_update_breakdown and propose_delete_breakdown do NOT perform the change. They ask the user to confirm it. Say so plainly.
- If you cannot tell which record the user means, ask a short question instead of guessing.`;

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "find_breakdowns",
      description:
        "Look up all breakdown records for one machine by its machine number. Use this before proposing any change.",
      parameters: {
        type: "object",
        properties: {
          machine_no: {
            type: "string",
            description: 'The machine number alone, for example "251" or "2-512". Not a sentence.',
          },
        },
        required: ["machine_no"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_breakdown",
      description:
        "Ask the user to confirm a change to ONE existing record. Does not save anything. The id must come from a find_breakdowns result.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The _id from a find_breakdowns result." },
          breakdown: { type: "string", description: "Replacement fault text. Omit if unchanged." },
          bgdate: { type: "string", description: "Replacement date as YYYY-MM-DD. Omit if unchanged." },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_breakdown",
      description:
        "Ask the user to confirm deleting ONE existing record permanently. Does not delete anything. The id must come from a find_breakdowns result.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The _id from a find_breakdowns result." },
        },
        required: ["id"],
      },
    },
  },
];

const str = (v) => (typeof v === "string" ? v.trim() : "");

// A record without a usable _id must never seed the provenance set: absent that
// guard, `String(undefined)` collapses to the literal string "undefined" and a
// proposal carrying id: "undefined" would then pass the check below.
const idOf = (r) => (r && r._id !== undefined && r._id !== null ? String(r._id) : null);

const runToolLoop = async ({ message, chat, findBreakdowns }) => {
  // Every _id this loop has actually shown to the model. A proposal referencing
  // anything outside this set is rejected — the invariant is enforced here, in
  // code, not by trusting the system prompt.
  const seenIds = new Map();
  const transcript = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: message },
  ];
  let lastRecords = null;
  let lastMachineNo = "";

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const reply = await chat(transcript);
    const calls = Array.isArray(reply?.tool_calls) ? reply.tool_calls : [];

    if (calls.length === 0) {
      if (lastRecords && lastRecords.length > 0) {
        return {
          kind: "records",
          machine_no: lastMachineNo,
          records: lastRecords,
          reply: str(reply?.content),
        };
      }
      if (lastRecords && lastRecords.length === 0) {
        return { kind: "reply", text: `No breakdown records found for ${lastMachineNo}.` };
      }
      return { kind: "reply", text: str(reply?.content) };
    }

    // Only the first tool_call in a reply is ever executed; the rest of the array
    // is discarded. This is deliberate and load-bearing for id provenance: it is
    // what stops a model from riding a write proposal in on the same turn as the
    // find_breakdowns call that would legitimise it. Do not change this to
    // iterate over `calls` without re-deriving the provenance guarantee.
    const call = calls[0];
    const name = call?.function?.name;
    const args = call?.function?.arguments ?? {};

    if (name === "find_breakdowns") {
      const machineNo = str(args.machine_no);
      if (!machineNo) return { kind: "error", reason: "missing_machine_no" };

      const records = (await findBreakdowns(machineNo)).slice(0, MAX_RECORDS);
      records.forEach((r) => {
        const id = idOf(r);
        if (id) seenIds.set(id, r);
      });
      lastRecords = records;
      lastMachineNo = machineNo;

      transcript.push({ role: "assistant", content: "", tool_calls: [call] });
      transcript.push({
        role: "tool",
        content: JSON.stringify(
          records
            .filter((r) => idOf(r) !== null)
            .map((r) => ({
              id: idOf(r),
              machine_no: r.machine_no,
              breakdown: r.breakdown,
              bgdate: r.bgdate,
            }))
        ),
      });
      continue;
    }

    if (name === "propose_update_breakdown" || name === "propose_delete_breakdown") {
      const record = seenIds.get(str(args.id));
      if (!record) return { kind: "error", reason: "unknown_record_id" };

      if (name === "propose_delete_breakdown") {
        return { kind: "propose_delete", record };
      }

      const changes = {};
      if (typeof args.breakdown === "string") changes.breakdown = args.breakdown;
      if (typeof args.bgdate === "string") changes.bgdate = args.bgdate;
      return { kind: "propose_update", record, changes };
    }

    return { kind: "error", reason: "unknown_tool" };
  }

  if (lastRecords && lastRecords.length > 0) {
    return { kind: "records", machine_no: lastMachineNo, records: lastRecords, reply: "" };
  }
  return { kind: "reply", text: "Could you be more specific about which machine you mean?" };
};

module.exports = { runToolLoop, TOOL_DEFINITIONS, MAX_ITERATIONS, SYSTEM_PROMPT };
