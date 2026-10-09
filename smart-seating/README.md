# 智慧隨機座位

本資料夾直接由 GitHub Pages 提供靜態網站，index.html 及 assets 為 source 的建置產物。

保留雙人桌、獨立個人桌、小組共桌（3～10人）、最後一桌單人座位、分開群組、性別偏好、優先前座、固定座位、隨機動畫、儲存與列印。學生資料只存目前瀏覽器。

## 修改與重新建置

使用 Node.js 22 或更新版本：

```sh
cd smart-seating/source
npm ci
npm run typecheck
npm run lint
npm test
npm run build:pages
```

將更新後的 index.html、assets 與 source 一起提交。根目錄原有部署方式不用改動。

重新建置後可移除 assets 中不再由 index.html 或 JS 引用的舊雜湊檔，但不要移除新檔案。

入口：首頁新增智慧隨機座位卡片及快捷連結；工具上方有「教學工具首頁」返回入口。

原 ChatGPT Site 與此 GitHub Pages 是不同網站來源，瀏覽器不會自動轉移先前的名單與設定；首次使用請重新輸入。
