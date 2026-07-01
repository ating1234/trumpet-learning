# 🎺 Adam Rapa 小號教學知識庫 (Cloudflare Pages 全端版)

這是一個專為蒐集、整理與學習小號大師 **Adam Rapa** 教學資料的現代化 Web 應用程式。本專案已完全升級為 **Cloudflare Pages 全端架構**，支援經由 GitHub 連動自動部署，並整合了後端 Serverless Function 提供超強的 AI 智能網址解析！

---

## ⚡ 核心功能

1. **影音與文字雙軌學習**：收錄 11 部 100% 真實可播的教學影片/Shorts 以及 11 大核心施力觀念，並附帶精細的時間點對照筆記。
2. **AI 智能網址解析**：在「新增教學」中貼上網址並點擊解析，後端 Serverless Function 會使用您配置的 API Key 呼叫 LLM (Gemini 或 OpenAI)，自動提煉出標題、主題標籤、100字摘要以及時間點重點筆記。
3. **智慧回退 (Fallback) 機制**：若您未設定 API Key，系統會自動切換為免金鑰的基礎解析（僅擷取標題與縮圖），並在網頁上提示引導您完成設定。

---

## 🚀 部署到 Cloudflare Pages 指南 (經由 GitHub)

本專案支援通過 GitHub 連動實現「每次 push 自動部署」。請依照以下步驟完成雲端部署：

### 第一步：上傳專案到 GitHub
1. 在您的 GitHub 帳號中建立一個全新的 Repository（儲存庫）。
2. 在您的本地專案目錄下執行以下指令（將代碼推送到 GitHub）：
   ```bash
   git init
   git add .
   git commit -m "feat: upgrade to Cloudflare Pages fullstack with LLM API"
   git branch -M main
   git remote add origin https://github.com/您的帳號/您的儲存庫名稱.git
   git push -u origin main
   ```

### 第二步：在 Cloudflare Pages 建立專案
1. 登入您的 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 在左側選單選擇 **Workers & Pages** -> 點擊 **Create** -> 選擇 **Pages** 頁籤。
3. 點擊 **Connect to Git** 並關聯您剛剛建立的 GitHub 倉庫。
4. 設定建置參數 (Build Settings)：
   * **Framework preset**: `Vite` (或保持空白)
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
   * **Root directory**: `/`
5. 點擊 **Save and Deploy** 開始第一次建置。

### 第三步：配置 LLM API 金鑰 (環境變數)
1. 建置完成後，進入您的 Cloudflare Pages 專案頁面。
2. 點選 **Settings** 頁籤 -> 選擇左側的 **Environment variables** (環境變數)。
3. 在 **Production** 與 **Preview** 區塊中點選 **Add variables**，並依您的喜好新增以下金鑰之一（系統會自動切換 LLM 引擎）：
   * 若使用 Google Gemini (建議，使用 Gemini 2.5 Flash)：
     * **Variable name**: `GEMINI_API_KEY`
     * **Value**: *[您的 Gemini API Key]*
   * 若使用 OpenAI (使用 GPT-4o mini)：
     * **Variable name**: `OPENAI_API_KEY`
     * **Value**: *[您的 OpenAI API Key]*
4. 點選 **Save** 儲存。
5. **重要**：變數新增後，請至 **Deployments** 頁籤，點選最新一次部署右側的三個點，選擇 **Retry deployment**（重新部署），以便讓環境變數在 Serverless Function 中生效。

---

## 💻 本地開發與測試

若您想在本地開發時測試後端 API 或是前端畫面：

### 1. 安裝環境與依賴
```bash
npm install
```

### 2. 啟動前端開發伺服器
```bash
npm run dev
```

### 3. 本地模擬 Cloudflare Pages Functions (Wrangler 測試)
Cloudflare 提供了 `wrangler` 工具，讓您可以在本地跑起一個完全模擬 Cloudflare 邊緣端的環境，並載入本地環境變數：

1. 在專案根目錄下建立 `.dev.vars` 檔案（此檔案已被 `.gitignore` 忽略，確保安全）：
   ```env
   GEMINI_API_KEY=您的Gemini金鑰
   # 或者 OPENAI_API_KEY=您的OpenAI金鑰
   ```
2. 執行建置與 Wrangler 本地模擬：
   ```bash
   npm run build
   npx wrangler pages dev ./dist --compatibility-date=2026-07-01
   ```
3. 瀏覽器開啟 `http://localhost:8788`，您即可在本地測試 100% 真實運作的 LLM 後端解析服務！

---

## 📂 專案結構說明

* `src/App.jsx`： React 前端主程式，包含雙軌表單、智慧解析與 Fallback UI。
* `functions/api/parse.js`： Cloudflare Pages 後端 API，負責在邊緣端安全爬網並調用 LLM 完成分析。
* `src/data/rapaData.json`： 您的 Adam Rapa 小號教學大師班核心資料庫。
