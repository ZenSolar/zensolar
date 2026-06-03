import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/safeRedirect";

describe("safeRedirectPath — Auth post-login redirect sanitizer", () => {
  it("returns the path for valid same-origin paths", () => {
    expect(safeRedirectPath("/simulator")).toBe("/simulator");
    expect(safeRedirectPath("/founders/simulator")).toBe("/founders/simulator");
    expect(safeRedirectPath("/simulator?x=1#a")).toBe("/simulator?x=1#a");
  });

  it("falls back to '/' on null / empty / undefined", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com/x")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("http://x")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("rejects paths with whitespace or backslash tricks", () => {
    expect(safeRedirectPath("/foo bar")).toBe("/");
    expect(safeRedirectPath("/foo\\bar")).toBe("/");
    expect(safeRedirectPath("\t/foo")).toBe("/");
  });

  it("respects a custom fallback", () => {
    expect(safeRedirectPath(null, "/home")).toBe("/home");
    expect(safeRedirectPath("//bad", "/home")).toBe("/home");
  });
});
