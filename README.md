# bilibili-mcp

一个合规优先的 Bilibili MCP Server，通过哔哩哔哩**官方开放平台**访问已授权账号的数据。

> 本项目不调用逆向整理的非公开接口，不绕过登录、签名或风控，也不提供任意用户/视频的批量抓取能力。

## 能力

| MCP 工具 | 作用 | 官方 Scope |
| --- | --- | --- |
| `bilibili_parse_url` | 本地解析 BV/av/ep/ss、空间、直播间和短链 | 无 |
| `bilibili_get_authorized_user` | 获取已授权用户昵称、头像和 OpenID | `USER_INFO` |
| `bilibili_get_video` | 获取已授权用户拥有或联合投稿的单个稿件 | `ARC_BASE` |
| `bilibili_list_videos` | 分页查询已授权用户的稿件列表 | `ARC_BASE` |
| `bilibili_get_user_stats` | 获取关注、粉丝和审核通过稿件数 | `USER_DATA` |
| `bilibili_get_video_stats` | 获取播放、点赞、投币、收藏、评论等数据 | `ARC_DATA` |

所有工具均为只读工具；网络请求使用官方签名 2.0（HMAC-SHA256）。

## 前置条件

1. 在[哔哩哔哩开放平台](https://openhome.bilibili.com/)完成开发者入驻并创建应用。
2. 为应用申请所需 Scope。
3. 按[官方 OAuth 2.0 文档](https://openhome.bilibili.com/doc/4/eaf0e2b5-bde9-b9a0-9be1-019bb455701c)取得已授权用户的 `access_token`。
4. Node.js 20 或更高版本。

官方开放平台可能要求企业资质，实际准入规则以官方页面为准。

## 安装与构建

```bash
git clone https://github.com/nameefef/bilibili-mcp.git
cd bilibili-mcp
pnpm install
pnpm run build
```

准备环境变量：

```bash
export BILIBILI_CLIENT_ID="your_client_id"
export BILIBILI_APP_SECRET="your_app_secret"
export BILIBILI_ACCESS_TOKEN="authorized_user_access_token"
```

没有凭证时服务仍可启动，但只能使用本地的 `bilibili_parse_url` 工具。

## MCP 客户端配置

把绝对路径替换为你本机的仓库位置：

```json
{
  "mcpServers": {
    "bilibili": {
      "command": "node",
      "args": ["/absolute/path/to/bilibili-mcp/dist/index.js"],
      "env": {
        "BILIBILI_CLIENT_ID": "your_client_id",
        "BILIBILI_APP_SECRET": "your_app_secret",
        "BILIBILI_ACCESS_TOKEN": "authorized_user_access_token"
      }
    }
  }
}
```

不要把真实密钥写入会提交到 Git 的配置文件；更推荐由系统密钥管理器或进程环境注入。

## 开发

```bash
pnpm run dev
pnpm run check
```

使用 MCP Inspector：

```bash
pnpm dlx @modelcontextprotocol/inspector node dist/index.js
```

## 限制与安全

- 仅使用官方开放平台文档公开的接口。
- 只能读取明确授权给当前应用的账号及稿件数据。
- 访问令牌和应用密钥只从环境变量读取，不会出现在 MCP 工具参数或返回值中。
- API 返回的头像、封面等资源应按官方规则缓存和使用。
- 遇到 `127007`、`127011` 等错误时，请检查应用 Scope 和用户授权状态。
- 平台接口、准入条件和配额可能变化，请以[官方文档](https://openhome.bilibili.com/doc)为准。

## 共创者

- [nameefef](https://github.com/nameefef)——项目发起人与维护者
- OpenAI Codex——架构、实现、测试与文档协作

Codex 是 AI 编程助手，不拥有可计入 GitHub Contributors 图表的个人账号；共同创作关系在项目文档和提交说明中明确记录。

## 许可证

[MIT](LICENSE)。Bilibili、哔哩哔哩及相关标识属于其权利人，本项目与哔哩哔哩官方无隶属或背书关系。
