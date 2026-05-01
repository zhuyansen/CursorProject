# 信源监控 → Discord（拿到 Webhook 之后）

## 1. 准备 Webhook（Discord 端）

1. 服务器里选一个**文字频道**（建议单独建 `#信源`）。
2. 频道设置 → **整合功能** → **Webhooks** → **新 Webhook**。
3. **复制 Webhook URL**（只保存在本机，不要发聊天、不要提交 Git）。

若 URL 泄露：在 Discord **删除该 Webhook** 并新建，旧 URL 立即作废。

## 2. 本机配置

```bash
cd scripts/source_watch
cp config.example.json config.json
```

编辑 `config.json`：

- 把 `discord_webhook_url` 改成你的 Webhook 完整地址。
- 按需改 `rss_feeds`、`twitter_users`（监控哪些账号）。

`config.json` 已在仓库根 `.gitignore` 中忽略，避免误提交。

## 3. 环境变量

监控 X 时间线需要 **twitterapi.io** 的 Key：

```bash
export TWITTERAPI_KEY="你的_X-API-Key"
```

（在 [twitterapi.io](https://twitterapi.io) 控制台复制。）

## 4. 第一次运行（建立基线，一般不推送）

```bash
export SOURCE_WATCH_CONFIG="$(pwd)/config.json"
python3 watch_sources.py "$SOURCE_WATCH_CONFIG"
```

第一次会写入 `config.state.json`，**通常不会在 Discord 刷屏**。

## 5. 第二次及以后（有更新才推送）

再执行同一条命令；当 RSS 或 X 上出现**比 state 里更新的内容**时，会往 Discord 频道发消息（含链接 + 简短预览）。

## 6. 定时自动跑（例：每 15 分钟）

```cron
*/15 * * * * export TWITTERAPI_KEY=...; export SOURCE_WATCH_CONFIG=/绝对路径/scripts/source_watch/config.json; /usr/bin/python3 /绝对路径/scripts/source_watch/watch_sources.py "$SOURCE_WATCH_CONFIG" >>/tmp/source_watch.log 2>&1
```

## 7. 可选：不用 Discord，用 ntfy

在 `config.json` 里填 `ntfy_topic`（随机长串当频道名），`discord_webhook_url` 可留空；手机装 ntfy App 订阅同一 topic 即可收推送。

## 8. 快速测 Webhook 是否正常

**方式 A（推荐，走同一套脚本）：** 在 `config.json` 填好真实 Webhook 后执行：

```bash
python3 watch_sources.py --test-discord config.json
```

成功时终端会提示，Discord 频道里会出现一条「source-watch：Discord 推送测试 OK」。

**方式 B（curl）：**

```bash
curl -sS -X POST -H "Content-Type: application/json" \
  -d '{"content":"source-watch 测试 OK"}' \
  "你的Webhook完整URL"
```

频道里出现这条消息即配置成功。

若 Python 报 **403 / error code: 1010** 而 `curl` 能发成功：是 Cloudflare 对默认 Python UA 的拦截，脚本已改为使用与 curl 类似的 `User-Agent`；请更新到最新 `watch_sources.py` 再试。

## 9. 把「全部信源 + 全局浏览量 Top10」发到 Discord

依赖：已跑过 `scripts/twitterapi_90d_research.py`，存在 `twitterapi_90d_report/summary.json` 与 `tweets_90d.jsonl`；`config.json` 里填写真实 `discord_webhook_url`（或环境变量 `DISCORD_WEBHOOK_URL`）。

```bash
python3 scripts/source_watch/post_digest_discord.py
# 或指定配置路径：
python3 scripts/source_watch/post_digest_discord.py /path/to/config.json
```

会连发多条消息：报告时间窗、**所有合并后的信源域名及次数**（多段代码块）、**全量推文中 view 最高的 10 条**（含链接与预览）。

## 10. 英文推文（X）浏览量 Top10 → Discord

脚本：`post_source_feed_top10_discord.py`

从 `twitterapi_90d_report/tweets_90d.jsonl` 中取 **`lang == en`** 的推文，按 **`viewCount`** 降序取 **Top10**，每条发 **X status 链接**（不是站外文章）。若英文条数不足 10，用其它语言高浏览帖补足并标注。

```bash
python3 scripts/source_watch/post_source_feed_top10_discord.py
```

## 11. 英文信源（非新闻）· 每 8 小时 · 窗口内浏览 Top10 → Discord（GoSailGlobal 搬运池文案）

- 名单：`en_sources_by_category.json`（工程实践 / 研究叙事 / 大厂官方；**不含**媒体/通讯社类新闻号，避免 digest 被时事刷屏）。  
- 脚本：`fetch_en_top10_discord.py`  
  - 拉取名单里每个号的 `last_tweets`（twitterapi.io），**只考虑最近 `window_hours`（默认 8）小时内**、且 **未在 `en_digest_posted_ids.json` 里发过** 的帖。  
  - 按 `viewCount` 取全局 Top10，**优先 `lang=en`**，不够则其它语言补足。  
  - Discord 每条带 **一句中文「搬运候选」导语**（模板，模拟翻译号口吻）+ **X 原文链接**。  

```bash
export TWITTERAPI_KEY="..."
python3 scripts/source_watch/fetch_en_top10_discord.py
```

**Cron 每 8 小时示例：**

```cron
5 */8 * * * cd /path/to/repo/scripts/source_watch && TWITTERAPI_KEY=... /usr/bin/python3 fetch_en_top10_discord.py >>/tmp/en_digest.log 2>&1
```

首次运行会写入 `en_digest_posted_ids.json`（已加入 `.gitignore`）。若要「全量重推」，删除该文件即可。

## 12. docs.newapi.pro 聊天 + 生图 → 中文草稿 → **Typefully**（+ 可选 Discord）

1. 先跑 **`fetch_en_top10_discord.py`** → 生成 **`en_digest_last_batch.json`**。  
2. 环境变量（见 **`fluxnode.example.env`**）：
   - `NEWAPI_KEY` + `NEWAPI_BASE_URL`（默认 **`https://docs.newapi.pro/v1`**）+ `NEWAPI_CHAT_MODEL`（默认 **`gpt-4`**）
   - `NEWAPI_IMAGE_MODEL`（如 **`gpt-image-2`**）可选；生图 URL 会下载并走 Typefully **媒体上传** 再挂到 X 草稿
   - **`TYPEFULLY_API_KEY`**；`TYPEFULLY_SOCIAL_SET_ID` 可省略（自动 `GET /v2/social-sets` 取第一个，或用 `TYPEFULLY_X_USERNAME=GoSailGlobal` 匹配）
   - `TYPEFULLY_PUBLISH_AT`：默认 **只存草稿**（不设 `publish_at`）；设为 `now` 或 `next-free-slot` 或 ISO 时间则按 Typefully 文档发布/排队

```bash
export NEWAPI_KEY="sk-..."
export TYPEFULLY_API_KEY="..."
python3 scripts/source_watch/generate_cn_drafts_fluxnode.py
```

结果摘要写入 **`cn_drafts_typefully_last.json`**（已 `.gitignore`）。若仍配置了 Discord webhook，会同步发摘要与草稿分段。

**安全**：任何 `sk-` 出现在聊天后都应 **轮换**；勿把密钥写入仓库。
