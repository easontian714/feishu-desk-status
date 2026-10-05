# 工位状态牌

连接个人飞书日历，全屏展示“在上班”“开会中”“吃饭中”或“下班了”。页面只返回推导后的状态，不向浏览器暴露会议标题、参与人或描述。

## 本地运行

1. 复制 `.env.example` 为 `.env.local`，填写飞书应用凭证和随机的 `SESSION_SECRET`。
2. 将飞书应用的 OAuth 回调地址配置为 `http://localhost:3000/api/auth/callback`。
3. 运行 `npm install && npm run dev`。

生产环境需将 `APP_URL` 设置为部署后的 HTTPS 域名，并在飞书开发者后台增加相应回调地址。
