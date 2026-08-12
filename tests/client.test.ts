import { createHash, createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  BilibiliApiError,
  BilibiliClient,
  createSignedHeaders,
  credentialsFromEnv,
  type BilibiliCredentials,
} from "../src/services/bilibili-client.js";

const credentials: BilibiliCredentials = {
  clientId: "client-id",
  appSecret: "app-secret",
  accessToken: "access-token",
};

describe("createSignedHeaders", () => {
  it("implements the documented v2 signature", () => {
    const headers = createSignedHeaders(credentials, "", 1_700_000_000, "nonce-1");
    const canonical = [
      "x-bili-accesskeyid:client-id",
      `x-bili-content-md5:${createHash("md5").update("").digest("hex")}`,
      "x-bili-signature-method:HMAC-SHA256",
      "x-bili-signature-nonce:nonce-1",
      "x-bili-signature-version:2.0",
      "x-bili-timestamp:1700000000",
    ].join("\n");
    expect(headers.Authorization).toBe(
      createHmac("sha256", "app-secret").update(canonical).digest("hex"),
    );
    expect(headers["Access-Token"]).toBe("access-token");
  });
});

describe("credentialsFromEnv", () => {
  it("reports every missing credential without exposing values", () => {
    expect(() => credentialsFromEnv({})).toThrow(/BILIBILI_CLIENT_ID.*BILIBILI_APP_SECRET.*BILIBILI_ACCESS_TOKEN/);
  });
});

describe("BilibiliClient", () => {
  it("validates a successful API response", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, message: "0", data: { ok: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new BilibiliClient(() => credentials, fetchMock);
    await expect(client.get("/test", z.object({ ok: z.boolean() }))).resolves.toEqual({ ok: true });
  });

  it("returns actionable official API errors", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 127011, message: "用户未授权", request_id: "req-1" }), {
        status: 200,
      }),
    );
    const client = new BilibiliClient(() => credentials, fetchMock);
    await expect(client.get("/test", z.unknown())).rejects.toEqual(
      expect.objectContaining<BilibiliApiError>({ code: 127011, requestId: "req-1" }),
    );
  });
});
