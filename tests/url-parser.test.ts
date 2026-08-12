import { describe, expect, it } from "vitest";
import { parseBilibiliResource } from "../src/services/url-parser.js";

describe("parseBilibiliResource", () => {
  it("parses a BV identifier", () => {
    expect(parseBilibiliResource("BV1MW421X7gM")).toEqual({
      type: "video",
      id: "BV1MW421X7gM",
      canonical_url: "https://www.bilibili.com/video/BV1MW421X7gM",
    });
  });

  it("removes tracking parameters from a video URL", () => {
    expect(
      parseBilibiliResource("https://www.bilibili.com/video/BV1MW421X7gM?spm_id_from=333"),
    ).toEqual({
      type: "video",
      id: "BV1MW421X7gM",
      canonical_url: "https://www.bilibili.com/video/BV1MW421X7gM",
    });
  });

  it("parses space and live URLs", () => {
    expect(parseBilibiliResource("https://space.bilibili.com/12345").type).toBe("user_space");
    expect(parseBilibiliResource("https://live.bilibili.com/67890").type).toBe("live_room");
  });

  it("rejects lookalike and insecure hosts", () => {
    expect(() => parseBilibiliResource("https://bilibili.com.example/video/BV1MW421X7gM")).toThrow();
    expect(() => parseBilibiliResource("http://www.bilibili.com/video/BV1MW421X7gM")).toThrow();
  });
});
