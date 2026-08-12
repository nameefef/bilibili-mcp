import { createHash, createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import { OPEN_API_BASE_URL, REQUEST_TIMEOUT_MS } from "../constants.js";

export interface BilibiliCredentials {
  clientId: string;
  appSecret: string;
  accessToken: string;
}

interface ApiEnvelope {
  code: number;
  message: string;
  request_id?: string;
  data?: unknown;
}

const ApiEnvelopeSchema = z.object({
  code: z.number(),
  message: z.string(),
  request_id: z.string().optional(),
  data: z.unknown().optional(),
});

export class BilibiliApiError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "BilibiliApiError";
  }
}

export function credentialsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): BilibiliCredentials {
  const clientId = env.BILIBILI_CLIENT_ID?.trim();
  const appSecret = env.BILIBILI_APP_SECRET?.trim();
  const accessToken = env.BILIBILI_ACCESS_TOKEN?.trim();

  const missing = [
    !clientId && "BILIBILI_CLIENT_ID",
    !appSecret && "BILIBILI_APP_SECRET",
    !accessToken && "BILIBILI_ACCESS_TOKEN",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new BilibiliApiError(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Create an app and authorize a user through Bilibili Open Platform first.",
    );
  }

  return { clientId: clientId!, appSecret: appSecret!, accessToken: accessToken! };
}

export function createSignedHeaders(
  credentials: BilibiliCredentials,
  body = "",
  nowSeconds = Math.floor(Date.now() / 1000),
  nonce = randomUUID(),
): Record<string, string> {
  const signedHeaders: Record<string, string> = {
    "x-bili-accesskeyid": credentials.clientId,
    "x-bili-content-md5": createHash("md5").update(body, "utf8").digest("hex"),
    "x-bili-signature-method": "HMAC-SHA256",
    "x-bili-signature-nonce": nonce,
    "x-bili-signature-version": "2.0",
    "x-bili-timestamp": String(nowSeconds),
  };

  const canonical = Object.keys(signedHeaders)
    .sort()
    .map((key) => `${key}:${signedHeaders[key]}`)
    .join("\n");

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Access-Token": credentials.accessToken,
    Authorization: createHmac("sha256", credentials.appSecret)
      .update(canonical, "utf8")
      .digest("hex"),
    ...signedHeaders,
  };
}

export class BilibiliClient {
  constructor(
    private readonly credentialsProvider: () => BilibiliCredentials = () =>
      credentialsFromEnv(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async get<T>(
    path: string,
    schema: z.ZodType<T>,
    query: Record<string, string | number | undefined> = {},
  ): Promise<T> {
    const url = new URL(path, OPEN_API_BASE_URL);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers: createSignedHeaders(this.credentialsProvider()),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new BilibiliApiError(`Unable to reach Bilibili Open Platform: ${detail}`);
    }

    if (!response.ok) {
      throw new BilibiliApiError(
        `Bilibili Open Platform returned HTTP ${response.status}. Try again later.`,
      );
    }

    let envelope: ApiEnvelope;
    try {
      envelope = ApiEnvelopeSchema.parse(await response.json());
    } catch {
      throw new BilibiliApiError("Bilibili Open Platform returned an invalid response.");
    }

    if (envelope.code !== 0) {
      throw new BilibiliApiError(
        `Bilibili Open Platform error ${envelope.code}: ${envelope.message}`,
        envelope.code,
        envelope.request_id,
      );
    }

    const parsed = schema.safeParse(envelope.data);
    if (!parsed.success) {
      throw new BilibiliApiError(
        "Bilibili Open Platform response did not match the documented schema.",
        envelope.code,
        envelope.request_id,
      );
    }
    return parsed.data;
  }
}
