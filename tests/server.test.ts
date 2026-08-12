import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

describe("MCP server", () => {
  const server = createServer();
  const client = new Client({ name: "bilibili-mcp-test-client", version: "1.0.0" });

  beforeEach(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it("advertises the six expected tools", async () => {
    const response = await client.listTools();
    expect(response.tools.map((tool) => tool.name)).toEqual([
      "bilibili_parse_url",
      "bilibili_get_authorized_user",
      "bilibili_get_video",
      "bilibili_list_videos",
      "bilibili_get_user_stats",
      "bilibili_get_video_stats",
    ]);
  });

  it("calls the local URL parser over MCP", async () => {
    const response = await client.callTool({
      name: "bilibili_parse_url",
      arguments: { input: "BV1MW421X7gM", response_format: "json" },
    });
    expect(response.isError).not.toBe(true);
    expect(response.structuredContent).toEqual({
      type: "video",
      id: "BV1MW421X7gM",
      canonical_url: "https://www.bilibili.com/video/BV1MW421X7gM",
    });
  });
});
