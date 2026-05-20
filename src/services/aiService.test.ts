import { describe, it, expect } from "vitest";
import { buildContext, buildAgriPrompt, isOnline, type FarmerContext } from "./aiService";

describe("buildContext", () => {
  it("returns empty string when no farmer data", () => {
    expect(buildContext()).toBe("");
  });

  it("includes name when provided", () => {
    expect(buildContext({ name: "Rahim" })).toContain("Rahim");
  });

  it("includes district when provided", () => {
    expect(buildContext({ district: "Dhaka" })).toContain("Dhaka");
  });

  it("joins multiple fields with separator", () => {
    const ctx: FarmerContext = { name: "Rahim", district: "Dhaka", crops: ["ধান", "পাট"], landSize: "3 বিঘা" };
    const result = buildContext(ctx);
    expect(result).toContain("Rahim");
    expect(result).toContain("Dhaka");
    expect(result).toContain("ধান");
    expect(result).toContain("3 বিঘা");
    expect(result).toContain(" | ");
  });
});

describe("buildAgriPrompt", () => {
  it("returns prompt unchanged without context", () => {
    expect(buildAgriPrompt("hello")).toBe("hello");
  });

  it("appends context when provided", () => {
    const result = buildAgriPrompt("ধান রোগ?", "জেলা: রাজশাহী");
    expect(result).toContain("ধান রোগ?");
    expect(result).toContain("রাজশাহী");
  });
});

describe("isOnline", () => {
  it("returns boolean for navigator.onLine", () => {
    const result = isOnline();
    expect(typeof result).toBe("boolean");
  });
});
