# 即時投票同步服務

這個 Cloudflare Worker 會為每個房間碼建立獨立的 Durable Object，保存題目、選項與票數，並透過 WebSocket 對所有已加入的裝置即時推播更新。

## 部署

1. 在此資料夾執行 `npm install`。
2. 登入 Cloudflare 後執行 `npm run deploy`。
3. 將部署結果的 `https://...workers.dev` 網址填到上層 `../config.js` 的 `window.LIVE_POLL_SERVER`。
4. 重新發布靜態工具箱頁面；老師和學生輸入相同房間碼即可連線。

## 本機測試

執行 `npm run dev`，接著把 `http://127.0.0.1:8787` 暫時填入 `../config.js`。不同瀏覽器或不同裝置可透過同一房間碼看見同步結果。

投票頁面不保存學生姓名；每個瀏覽器分頁每一輪限投一次。重新發布或清空票數會建立新的投票輪次。
