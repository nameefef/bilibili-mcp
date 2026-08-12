import { CHARACTER_LIMIT } from "./constants.js";
import type {
  AuthorizedUser,
  ResponseFormat,
  UserStats,
  Video,
  VideoList,
  VideoStats,
} from "./schemas.js";

function unixTime(value: number): string {
  return new Date(value * 1000).toISOString();
}

export function jsonText(value: unknown): string {
  const text = JSON.stringify(value, null, 2);
  if (text.length <= CHARACTER_LIMIT) return text;
  return `${text.slice(0, CHARACTER_LIMIT)}\n... response truncated`;
}

export function formatUser(value: AuthorizedUser, format: ResponseFormat): string {
  if (format === "json") return jsonText(value);
  return [`# ${value.name}`, "", `- OpenID: ${value.openid}`, `- Avatar: ${value.face}`].join("\n");
}

export function formatVideo(value: Video, format: ResponseFormat): string {
  if (format === "json") return jsonText(value);
  return [
    `# ${value.title}`,
    "",
    `- BV ID: ${value.resource_id}`,
    `- Status: ${value.addit_info.state_desc}`,
    `- Published: ${unixTime(value.ptime)}`,
    `- Duration: ${value.video_info?.duration ?? "unavailable"} seconds`,
    `- Tags: ${value.tag || "none"}`,
    `- URL: ${value.video_info?.share_url ?? `https://www.bilibili.com/video/${value.resource_id}`}`,
    "",
    value.desc || "No description.",
  ].join("\n");
}

export function formatVideoList(value: VideoList, format: ResponseFormat): string {
  if (format === "json") return jsonText(value);
  const lines = [
    "# Authorized user's videos",
    "",
    `Page ${value.page.pn}; showing ${value.list.length} of ${value.page.total}`,
    "",
  ];
  for (const video of value.list) {
    lines.push(
      `## ${video.title}`,
      `- BV ID: ${video.resource_id}`,
      `- Status: ${video.addit_info.state_desc}`,
      `- Published: ${unixTime(video.ptime)}`,
      "",
    );
  }
  return lines.join("\n");
}

export function formatUserStats(value: UserStats, format: ResponseFormat): string {
  if (format === "json") return jsonText(value);
  return [
    "# Authorized user statistics",
    "",
    `- Following: ${value.following}`,
    `- Followers: ${value.follower}`,
    `- Published videos: ${value.arc_passed_total}`,
  ].join("\n");
}

export function formatVideoStats(value: VideoStats, format: ResponseFormat): string {
  if (format === "json") return jsonText(value);
  return [
    `# ${value.title}`,
    "",
    `- Published: ${unixTime(value.ptime)}`,
    `- Views: ${value.view}`,
    `- Likes: ${value.like}`,
    `- Coins: ${value.coin}`,
    `- Favorites: ${value.favorite}`,
    `- Replies: ${value.reply}`,
    `- Danmaku: ${value.danmaku}`,
    `- Shares: ${value.share}`,
  ].join("\n");
}
