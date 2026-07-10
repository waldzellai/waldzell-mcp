import { describe, expect, it } from "vitest";

import { canonicalJson, sha256 } from "../../src/canonical-json.js";

describe("canonicalJson", () => {
  it("sorts object keys recursively while preserving array order", () => {
    const first = {
      zebra: 1,
      alpha: { delta: true, beta: ["first", "second"] },
    };
    const reordered = {
      alpha: { beta: ["first", "second"], delta: true },
      zebra: 1,
    };
    const changedArrayOrder = {
      alpha: { beta: ["second", "first"], delta: true },
      zebra: 1,
    };

    expect(canonicalJson(first)).toBe(
      '{"alpha":{"beta":["first","second"],"delta":true},"zebra":1}',
    );
    expect(sha256(canonicalJson(first))).toBe(
      sha256(canonicalJson(reordered)),
    );
    expect(sha256(canonicalJson(first))).not.toBe(
      sha256(canonicalJson(changedArrayOrder)),
    );
  });

  it.each([
    ["undefined", undefined],
    ["a function", () => "unsupported"],
    ["a symbol", Symbol("unsupported")],
    ["NaN", Number.NaN],
    ["positive infinity", Number.POSITIVE_INFINITY],
    ["negative infinity", Number.NEGATIVE_INFINITY],
    ["a bigint", 1n],
    ["an undefined object property", { value: undefined }],
    ["an undefined array element", [undefined]],
  ])("rejects %s", (_name, value) => {
    expect(() => canonicalJson(value)).toThrow(/unsupported/i);
  });

  it("rejects cycles without rejecting repeated non-cyclic references", () => {
    const shared = { value: 1 };
    expect(canonicalJson({ left: shared, right: shared })).toBe(
      '{"left":{"value":1},"right":{"value":1}}',
    );

    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalJson(cyclic)).toThrow(/cycle/i);
  });

  it("rejects accessor-backed array elements before reading them", () => {
    const values = ["initial"];
    let getterCalls = 0;
    Object.defineProperty(values, 0, {
      configurable: true,
      enumerable: true,
      get() {
        getterCalls += 1;
        return "unstable";
      },
      set(_value: string) {},
    });

    expect(() => canonicalJson(values)).toThrow(/accessor/i);
    expect(getterCalls).toBe(0);
  });
});

describe("sha256", () => {
  it("returns a prefixed lowercase digest for strings and bytes", () => {
    const expected =
      "sha256:2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

    expect(sha256("hello")).toBe(expected);
    expect(sha256(new TextEncoder().encode("hello"))).toBe(expected);
  });
});
