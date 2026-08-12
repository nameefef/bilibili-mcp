import { z } from "zod";

export const ResponseFormatSchema = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("Response format: markdown for people or json for programs");

export const BvidSchema = z
  .string()
  .regex(/^BV[0-9A-Za-z]{10}$/, "resource_id must be a 12-character BV id")
  .describe("Bilibili BV id, for example BV1MW421X7gM");

export const AuthorizedUserSchema = z.object({
  name: z.string(),
  face: z.string().url(),
  openid: z.string(),
});

export const VideoInfoSchema = z.object({
  cid: z.number(),
  filename: z.string(),
  duration: z.number(),
  share_url: z.string(),
  iframe_url: z.string(),
});

export const AdditionalInfoSchema = z.object({
  state: z.number(),
  state_desc: z.string(),
  reject_reason: z.string(),
});

export const VideoSchema = z.object({
  resource_id: z.string(),
  title: z.string(),
  cover: z.string(),
  tid: z.number(),
  no_reprint: z.number(),
  desc: z.string(),
  tag: z.string(),
  copyright: z.number(),
  ctime: z.number(),
  ptime: z.number(),
  video_info: VideoInfoSchema.nullish(),
  addit_info: AdditionalInfoSchema,
});

export const VideoListSchema = z.object({
  list: z.array(VideoSchema),
  page: z.object({
    pn: z.number(),
    ps: z.number(),
    total: z.number(),
  }),
});

export const UserStatsSchema = z.object({
  following: z.number(),
  follower: z.number(),
  arc_passed_total: z.number(),
});

export const VideoStatsSchema = z.object({
  title: z.string(),
  ptime: z.number(),
  view: z.number(),
  danmaku: z.number(),
  reply: z.number(),
  favorite: z.number(),
  coin: z.number(),
  share: z.number(),
  like: z.number(),
});

export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;
export type AuthorizedUser = z.infer<typeof AuthorizedUserSchema>;
export type Video = z.infer<typeof VideoSchema>;
export type VideoList = z.infer<typeof VideoListSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type VideoStats = z.infer<typeof VideoStatsSchema>;
