import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  LOCAL_READ_ONLY_ANNOTATIONS,
  READ_ONLY_ANNOTATIONS,
  SERVER_NAME,
  SERVER_VERSION,
} from "./constants.js";
import {
  formatUser,
  formatUserStats,
  formatVideo,
  formatVideoList,
  formatVideoStats,
  jsonText,
} from "./format.js";
import {
  AuthorizedUserSchema,
  BvidSchema,
  ResponseFormatSchema,
  UserStatsSchema,
  VideoListSchema,
  VideoSchema,
  VideoStatsSchema,
} from "./schemas.js";
import { BilibiliApiError, BilibiliClient } from "./services/bilibili-client.js";
import { parseBilibiliResource } from "./services/url-parser.js";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

function success(data: object, text: string): ToolResult {
  return { content: [{ type: "text", text }], structuredContent: { ...data } };
}

function failure(error: unknown): ToolResult {
  const message =
    error instanceof BilibiliApiError || error instanceof Error
      ? error.message
      : "Unexpected error.";
  return {
    isError: true,
    content: [{ type: "text", text: `Error: ${message}` }],
  };
}

export function createServer(client = new BilibiliClient()): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "bilibili_parse_url",
    {
      title: "Parse Bilibili URL or identifier",
      description:
        "Parse a public Bilibili BV/av/ep/ss identifier or HTTPS URL locally and return its resource type, id, and canonical URL. Does not contact Bilibili or resolve b23.tv redirects.",
      inputSchema: z
        .object({
          input: z.string().min(1).max(2048).describe("Bilibili identifier or HTTPS URL"),
          response_format: ResponseFormatSchema,
        })
        .strict(),
      annotations: LOCAL_READ_ONLY_ANNOTATIONS,
    },
    async ({ input, response_format }): Promise<ToolResult> => {
      try {
        const data = parseBilibiliResource(input);
        return success(data, response_format === "json" ? jsonText(data) : `# Parsed Bilibili resource\n\n- Type: ${data.type}\n- ID: ${data.id}\n- URL: ${data.canonical_url}`);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "bilibili_get_authorized_user",
    {
      title: "Get authorized Bilibili user",
      description:
        "Get the nickname, avatar URL, and app-scoped OpenID of the user who authorized the configured official Bilibili Open Platform access token. Requires USER_INFO scope.",
      inputSchema: z.object({ response_format: ResponseFormatSchema }).strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ response_format }): Promise<ToolResult> => {
      try {
        const data = await client.get("/arcopen/fn/user/account/info", AuthorizedUserSchema);
        return success(data, formatUser(data, response_format));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "bilibili_get_video",
    {
      title: "Get an authorized user's Bilibili video",
      description:
        "Get one video submission owned or co-authored by the authorized user through the official Open Platform. Requires ARC_BASE scope; it cannot read arbitrary videos.",
      inputSchema: z.object({ resource_id: BvidSchema, response_format: ResponseFormatSchema }).strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ resource_id, response_format }): Promise<ToolResult> => {
      try {
        const data = await client.get("/arcopen/fn/archive/view", VideoSchema, { resource_id });
        return success(data, formatVideo(data, response_format));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "bilibili_list_videos",
    {
      title: "List the authorized user's Bilibili videos",
      description:
        "List paginated video submissions belonging to the authorized user through the official Open Platform. Requires ARC_BASE scope. Page size is limited to 1-50.",
      inputSchema: z
        .object({
          page: z.number().int().min(1).default(1).describe("1-based page number"),
          page_size: z.number().int().min(1).max(50).default(20).describe("Items per page"),
          status: z.enum(["all", "is_pubing", "pubed", "not_pubed"]).default("all"),
          response_format: ResponseFormatSchema,
        })
        .strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ page, page_size, status, response_format }): Promise<ToolResult> => {
      try {
        const data = await client.get("/arcopen/fn/archive/viewlist", VideoListSchema, {
          pn: page,
          ps: page_size,
          status,
        });
        const pagination = {
          ...data,
          count: data.list.length,
          has_more: data.page.pn * data.page.ps < data.page.total,
          next_page: data.page.pn * data.page.ps < data.page.total ? data.page.pn + 1 : null,
        };
        return success(pagination, formatVideoList(data, response_format));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "bilibili_get_user_stats",
    {
      title: "Get authorized Bilibili user statistics",
      description:
        "Get following, follower, and approved-video counts for the authorized user through the official Open Platform. Requires USER_DATA scope.",
      inputSchema: z.object({ response_format: ResponseFormatSchema }).strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ response_format }): Promise<ToolResult> => {
      try {
        const data = await client.get("/arcopen/fn/data/user/stat", UserStatsSchema);
        return success(data, formatUserStats(data, response_format));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "bilibili_get_video_stats",
    {
      title: "Get statistics for an authorized user's Bilibili video",
      description:
        "Get views, likes, coins, favorites, replies, danmaku, and shares for a video owned or co-authored by the authorized user. Requires ARC_DATA scope.",
      inputSchema: z.object({ resource_id: BvidSchema, response_format: ResponseFormatSchema }).strict(),
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ resource_id, response_format }): Promise<ToolResult> => {
      try {
        const data = await client.get("/arcopen/fn/data/arc/stat", VideoStatsSchema, { resource_id });
        return success(data, formatVideoStats(data, response_format));
      } catch (error) {
        return failure(error);
      }
    },
  );

  return server;
}
