# 台股觀察儀表板

單一 HTML 檔案的股票觀察看板，不需要任何程式安裝，直接部署到 GitHub Pages 就能有一個網址隨時打開查看。

## 部署步驟（純網頁操作，不用打指令）

1. 登入 GitHub，點右上角「+」→「New repository」
2. Repository name 隨意取，例如 `tw-stock-dashboard`，設為 **Public**，其他保持預設，按「Create repository」
3. 進入剛建立的 repo，點「Add file」→「Upload files」
4. 把 `index.html` 拖進去上傳，按「Commit changes」
5. 進 repo 的「Settings」分頁 → 左側選單「Pages」
6. 「Build and deployment」→ Source 選「Deploy from a branch」，Branch 選 `main` / `/ (root)`，按「Save」
7. 等 1-2 分鐘，重新整理這個 Pages 設定頁，上面會出現一個網址，格式像：
   `https://你的帳號.github.io/tw-stock-dashboard/`
8. 打開那個網址，就是你的儀表板了，可以加到手機主畫面當捷徑

## 使用方式

- 上方輸入框輸入股票代號（例如 `2330`、`1409`）按「加入觀察」
- 卡片會自動抓當前市況（有延遲，非官方即時保證），每 30 秒自動更新一次
- 每張卡片下面的「分析筆記」欄位可以手動貼上你跟 Claude 聊天分析出的合理股價區間、技術型態判讀，會存在瀏覽器裡（下次打開還在）
- 觀察名單、筆記都存在你這個瀏覽器本機（localStorage），換裝置或清瀏覽器資料會不見，之後如果需要跨裝置同步可以再升級

## 已知限制

- 即時報價是瀏覽器直接呼叫證交所盤中資訊 API，正常狀況下能用，但偶爾可能因為證交所端限制或維護而抓不到，這不是網頁本身壞掉，重新整理或稍後再試通常會恢復
- 目前沒有走勢圖，只有現價/漲跌/開高低/成交量卡片
- 分析筆記是手動貼上的，不是自動串接 Claude 分析結果（如果之後想要「自動分析」，那一步需要接 Claude API，會另外再說明怎麼做）
