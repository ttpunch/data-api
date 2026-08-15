import { describe, it, expect, vi } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { buildUpdate, buildDeleteResult } = require("./editHelpers.js");

describe("buildUpdate", () => {
  it("applies only the fields that are present", () => {
    expect(buildUpdate({ breakdown: "new text" })).toEqual({ breakdown: "new text" });
  });

  it("accepts machine_no and bgdate, which the old controller dropped", () => {
    expect(buildUpdate({ machine_no: "2-512", bgdate: "2026-08-12" })).toEqual({
      machine_no: "2-512",
      bgdate: "2026-08-12",
    });
  });

  it("rejects a non-ISO bgdate rather than letting Mongoose guess", () => {
    expect(buildUpdate({ bgdate: "08-12-2026" })).toEqual({});
  });

  it("ignores unknown fields entirely", () => {
    expect(buildUpdate({ hacked: true, breakdown: "ok" })).toEqual({ breakdown: "ok" });
  });

  it("returns an empty object for an empty body", () => {
    expect(buildUpdate({})).toEqual({});
    expect(buildUpdate(null)).toEqual({});
  });

  it("keeps an empty-string breakdown, which is a real edit", () => {
    expect(buildUpdate({ breakdown: "" })).toEqual({ breakdown: "" });
  });
});

describe("buildDeleteResult", () => {
  it("reports success when one document was removed", () => {
    expect(buildDeleteResult({ deletedCount: 1 }, "abc")).toEqual({
      status: 200,
      body: { deleted: "abc" },
    });
  });

  it("reports 404 when nothing matched", () => {
    expect(buildDeleteResult({ deletedCount: 0 }, "abc")).toEqual({
      status: 404,
      body: { message: "Record not found" },
    });
  });
});
