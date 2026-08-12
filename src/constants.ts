export const SERVER_NAME = "bilibili-mcp-server";
export const SERVER_VERSION = "0.1.0";
export const OPEN_API_BASE_URL = "https://member.bilibili.com";
export const REQUEST_TIMEOUT_MS = 15_000;
export const CHARACTER_LIMIT = 25_000;

export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const LOCAL_READ_ONLY_ANNOTATIONS = {
  ...READ_ONLY_ANNOTATIONS,
  openWorldHint: false,
} as const;
