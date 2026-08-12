#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(`bilibili-mcp-server\n\nUsage: bilibili-mcp\nTransport: stdio\n\nOptional at startup, required by network tools:\n  BILIBILI_CLIENT_ID\n  BILIBILI_APP_SECRET\n  BILIBILI_ACCESS_TOKEN\n`);
    return;
  }

  const server = createServer();
  await server.connect(new StdioServerTransport());
  console.error("bilibili-mcp-server running on stdio");
}

main().catch((error: unknown) => {
  console.error("Fatal server error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
