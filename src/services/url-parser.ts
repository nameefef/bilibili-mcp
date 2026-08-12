export type BilibiliResourceType =
  | "video"
  | "bangumi_episode"
  | "bangumi_season"
  | "user_space"
  | "live_room"
  | "short_link";

export interface ParsedBilibiliResource {
  type: BilibiliResourceType;
  id: string;
  canonical_url: string;
}

const rawPatterns: Array<{
  type: BilibiliResourceType;
  pattern: RegExp;
  url: (id: string) => string;
}> = [
  {
    type: "video",
    pattern: /^BV[0-9A-Za-z]{10}$/i,
    url: (id) => `https://www.bilibili.com/video/${id}`,
  },
  {
    type: "video",
    pattern: /^av(\d+)$/i,
    url: (id) => `https://www.bilibili.com/video/${id}`,
  },
  {
    type: "bangumi_episode",
    pattern: /^ep(\d+)$/i,
    url: (id) => `https://www.bilibili.com/bangumi/play/${id}`,
  },
  {
    type: "bangumi_season",
    pattern: /^ss(\d+)$/i,
    url: (id) => `https://www.bilibili.com/bangumi/play/${id}`,
  },
];

export function parseBilibiliResource(input: string): ParsedBilibiliResource {
  const value = input.trim();
  for (const item of rawPatterns) {
    const match = value.match(item.pattern);
    if (match) {
      const id = item.type === "video" && /^BV/i.test(value) ? `BV${value.slice(2)}` : value.toLowerCase();
      return { type: item.type, id, canonical_url: item.url(id) };
    }
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "Unsupported value. Provide a BV/av/ep/ss identifier or an HTTPS Bilibili URL.",
    );
  }

  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS Bilibili URLs are accepted.");
  }

  const host = url.hostname.toLowerCase();
  if (host === "b23.tv") {
    const id = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!id) throw new Error("The b23.tv short link has no identifier.");
    return { type: "short_link", id, canonical_url: `https://b23.tv/${id}` };
  }

  if (!["bilibili.com", "www.bilibili.com", "m.bilibili.com", "space.bilibili.com", "live.bilibili.com"].includes(host)) {
    throw new Error("The URL host is not an allowed Bilibili domain.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  const video = path.match(/^\/video\/(BV[0-9A-Za-z]{10}|av\d+)$/i);
  if (video?.[1]) return parseBilibiliResource(video[1]);

  const bangumi = path.match(/^\/bangumi\/play\/(ep\d+|ss\d+)$/i);
  if (bangumi?.[1]) return parseBilibiliResource(bangumi[1]);

  if (host === "space.bilibili.com") {
    const space = path.match(/^\/(\d+)$/);
    if (space?.[1]) {
      return {
        type: "user_space",
        id: space[1],
        canonical_url: `https://space.bilibili.com/${space[1]}`,
      };
    }
  }

  if (host === "live.bilibili.com") {
    const room = path.match(/^\/(\d+)$/);
    if (room?.[1]) {
      return {
        type: "live_room",
        id: room[1],
        canonical_url: `https://live.bilibili.com/${room[1]}`,
      };
    }
  }

  throw new Error("The Bilibili URL type is not supported yet.");
}
