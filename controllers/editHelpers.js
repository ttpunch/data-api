const { isoDate } = require("../utils/agentInterpreter.js");

// Only these fields may be changed through the edit endpoint. Anything else in
// the request body is ignored rather than passed to Mongoose.
const EDITABLE = ["breakdown", "machine_no", "bgdate"];

const buildUpdate = (body) => {
  const source = body && typeof body === "object" ? body : {};
  const update = {};
  for (const field of EDITABLE) {
    if (!(field in source)) continue;
    if (field === "bgdate") {
      const valid = isoDate(typeof source.bgdate === "string" ? source.bgdate : "");
      if (valid) update.bgdate = valid;
      continue;
    }
    if (typeof source[field] === "string") update[field] = source[field];
  }
  return update;
};

const buildDeleteResult = (result, id) =>
  result.deletedCount > 0
    ? { status: 200, body: { deleted: id } }
    : { status: 404, body: { message: "Record not found" } };

module.exports = { buildUpdate, buildDeleteResult, EDITABLE };
