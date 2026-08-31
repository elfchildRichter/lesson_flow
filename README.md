# 課伴 LessonFlow

課伴是一個以 **LangGraph 狀態圖**、**多部門 AI 團隊動態調度 (Agent Orchestration)** 與 **多模態檢索增強生成 (Multimodal RAG)** 為核心的 AI 教學助理與 SaaS 自動化平台。上傳 PDF 教材後，可以：

- **🤖 Agent 指揮所 (Agent Ops Command Center)**：整合 **CompanyRouter** 與 **SkillRegistry**，支援 **全域智慧導航 (Omni-Routing)** 與管理員動態調度 4 大 AI 專家部門（教務、行政、技術、行銷）處理自動化任務。
- **🎓 四大會員層級與流量配額 (Tiering System)**：支援「教師試用版」、「教師專業版」、「機構/學校版」與「管理員無限版」，具備每日簡報/提問上限、單檔大小與部門存取管控。
- **📄 智慧教材檔名與主題萃取**：導入「」引號標籤識別、Markdown 標題萃取與提問動詞剝離演算法，自動產出簡明教材名稱。
- **🎒 豐富學習對象與語意體驗**：支援選擇「國小生」、「國中生」、「高中生」、「大學生/成人」，AI 自動調適最適教學語氣。
- **方案 A 視覺頁面直解 (Vision-Native Direct Parsing)**：以高畫質 200 DPI PNG 頁面圖檔結合 VLM 視覺大模型，精準還原 PDF 頁面結構、排版、複雜表格與 **LaTeX 數學公式 (`$...$` / `$$...$$`)**。
- **🌐 跨語言簡報與講稿生成**：支援上傳中/英文教材，可自由選擇產出 **繁體中文 (zh-TW)**、**English (en)** 或 **跟隨教材 (auto)** 的簡報與演講稿。
- 產生可下載的 PowerPoint 教學簡報 (`.pptx`) 與高品質逐頁演講稿 (`.md`)。
- 使用自然語言向教材提問，獲得附帶頁碼標示與原文出處的精準回答。
- **Self-RAG 防幻覺審查**：自動校對回答真實性，避免模型自創不實資訊。
- **可選性聯網補充搜尋 (Corrective RAG)**：當教材資訊不足或需延伸最新案例時，可勾選開啟聯網搜尋補足內容。
- **🌐 EN / 繁體中文 雙語介面 (Bilingual i18n)**：支援點擊頂部導覽列按鈕即時切換全站介面、選單選項、提示與錯誤訊息。
- **🔐 管理員控制台與用戶資訊卡片 (User Cards & RWD)**：支援管理員優先排序、上次上線時間追蹤、無邊框平鋪滾動與手機端響應式用戶卡片。
- **💻 CLI 命令列介面 (`app/cli.py`)**：支援直接在 Shell 執行指令派發任務至多部門 AI 團隊處理。

---

## 🤖 多部門 AI 團隊架構 (Company Router & Agent Ops)

課伴導入公司化的跨部門 AI 團隊運作模式，透過 **CompanyRouter (`StateGraph`)** 達成自適應意圖辨識與動態任務派發：

| 部門標誌 | 部門名稱 | 特化 Agent Skill | 核心職責與處理範疇 |
|---|---|---|---|
| 🎓 | **教務教學部** | `qa_teaching_tutor`<br/>`deck_generation_tutor` | 教材概念解析、問答流調優、簡報大綱、逐頁演講稿生成、LaTeX 數學公式渲染與 Self-RAG 審查。 |
| 📋 | **營運與行政部** | `user_quota_operations` | 使用者身份驗證 (JWT)、每日配額 (Quota Limit) 管理、權限控制與系統營運規則廣播。 |
| 🛠️ | **技術維護部** | `railway_devops` | Railway 部署診斷、OOM 記憶體溢出排查、HuggingFace 快取持久化與多 AI Provider 切換。 |
| 🚀 | **市場與營銷部** | `saas_marketing` | SaaS 商業化模式、產品賣點包裝、FB/Threads/LinkedIn 社群貼文文案與 SEO 優化。 |

---

## 支援 4 大 AI 模型提供者

專案支援 4 種 AI 模型提供者，並支援在網頁左側控制台即時動態切換：

| 模式維度 | 🌟 預設首選：Google Gemini 雲端 | 🟢 商業穩定：OpenAI 雲端 | ☁️ Ollama 雲端 | 🏠 完全隱私：Ollama 本機 |
|---|---|---|---|---|
| **首選場景** | **預設首選 (最佳CP值 / 極速)** | 商業高階 / 安定備用 | 雲端推論 / 自由選擇模型 | 敏感考題 / 機密資料 / 斷網環境 |
| **`AI_PROVIDER`** | `gemini` | `openai` | `ollama_cloud` | `ollama_local` |
| **文字生成 (LLM)** | `gemini-3.6-flash` | `gpt-4o-mini` | `qwen2.5:32b` | `qwen3:4b` |
| **視覺解析 (VLM)** | `gemini-3.6-flash` | `gpt-4o-mini` | `qwen2-vl:7b` | `qwen2-vl` (若無則降級 pypdf) |
| **Embedding 模型** | `gemini-embedding-2` (3072d) | `text-embedding-3-small` (1536d) | `bge-m3` (Ollama API) | `MiniLM-L12-v2` (384d, 延遲載入) |
| **記憶體優化 (RAM)** | 🟢 幾乎為 $0 (RAM < 250MB) | 🟢 幾乎為 $0 (RAM < 250MB) | 🟢 幾乎為 $0 (無需負擔 PyTorch RAM) | 🟡 本機 GPU 執行 |


---

## 核心架構：LangGraph 工作流 (Workflows)

本專案採用 **LangGraph 狀態圖 (StateGraph)** 重構兩大 AI 核心作業：

### 1. 問答工作流 (Self-RAG + CRAG QA Flow)

- `retrieve` ➔ `grade_documents`（相關性審查）
- 若相關 ➔ `generate_answer` ➔ `check_hallucination`（防幻覺核對）
  - 若核對合規 ➔ 輸出解答
  - 若偵測到幻覺 ➔ 帶入 `hallucination_feedback` 回溯 `generate_answer` 重新修正生成（最多重試 1 次）
- 若不相關 & 開啟網路搜尋 ➔ `web_search` ➔ `generate_answer`
- 若不相關 & 未開啟網路搜尋 ➔ `fallback_answer`（安全降級提示）

```mermaid
flowchart TD
    START([開始]) --> retrieve[1. retrieve<br/>檢索教材片段]
    retrieve --> grade[2. grade_documents<br/>相關性審查]
    
    grade -- 教材相關 --> generate[3. generate_answer<br/>生成回答並標示頁碼]
    grade -- 不相關 & 已勾選聯網 --> web[web_search<br/>DuckDuckGo 搜尋]
    grade -- 不相關 & 未勾選聯網 --> fallback[fallback_answer<br/>降級安全提示]
    
    web --> generate
    fallback --> END1([結束])
    
    generate --> check[4. check_hallucination<br/>Self-RAG 防幻覺審查]
    
    check -- 偵測到幻覺<br/>(重試修訂 <= 1) --> generate
    check -- 審查合規 / 通過 --> END2([結束])
```

### 2. 簡報生成工作流 (Multi-Stage Deck Flow with Audit Feedback Loop)

- `plan_outline`（第一階段：簡報大綱與目標語言規劃）
- `enrich_with_web`（第二階段：可選聯網檢索延伸教學案例與數據）
- `generate_contents`（第三階段：單頁重點與目標語言逐字講稿生成；支援接收 `audit_feedback` 精進修訂）
- `audit_quality`（第四階段：品質與講稿長度檢測，未達標自動產生改進建議並回溯至 `generate_contents` 精進內容）
- `finalize_deck`（格式驗證與 `Deck` 模型輸出）

```mermaid
flowchart TD
    START([開始]) --> outline[1. plan_outline<br/>大綱與單頁主題規劃]
    
    outline -- 已勾選聯網補充 --> web[2. enrich_with_web<br/>聯網搜尋延伸案例與數據]
    outline -- 未勾選聯網 --> contents[3. generate_contents<br/>單頁重點與逐字講稿生成]
    
    web --> contents
    
    contents --> audit[4. audit_quality<br/>品質與講稿長度檢測]
    
    audit -- 講稿過簡 / 未達標<br/>(重試精進 <= 1) --> contents
    audit -- 品質通過 --> finalize[5. finalize_deck<br/>格式驗證與 Deck 輸出]
    
    finalize --> END([結束])
```

---

## 系統需求

- **Docker & Docker Compose**（建議，包含完整執行與套件環境）
- Python 3.10 以上（僅在不上 Docker、直接於宿主機手動執行時需要）
- 可選取文字或包含算式的 PDF
- Google Gemini 模式需 `GEMINI_API_KEY`（免費額度充裕）
- OpenAI 模式需有效的 OpenAI API Key
- Ollama 雲端模式需 `OLLAMA_API_KEY`
- Ollama 本機模式需安裝 [Ollama](https://docs.ollama.com/)

---

## 快速開始與 Docker 部署

本專案可使用 **Docker 與 Docker Compose** 進行開發與部署。

### 1. 複製專案與準備環境變數

```bash
git clone <repository-url>
cd lesson_flow
cp .env.example .env
```

在 `.env` 中設定您的 Key 與提供者（例如預設 `AI_PROVIDER=gemini` 並填入 `GEMINI_API_KEY`，以及用於私有庫建置的 `GITHUB_TOKEN`）。

### 2. 啟動服務

#### 平時日常開發：
```bash
docker compose up
```
* **即時熱更新 (Hot Reload)**：在 IDE 編輯 `app/` 目錄下的程式碼時，容器將自動偵測並重載，網頁刷新的即為最新程式碼。
* **網頁進入點**：開啟 **<http://localhost:8000>** 即可開始測試與使用。

#### 首次建置 / 修改 `requirements.txt` 時：
```bash
docker compose up --build
```

- **資料持久化**：宿主機 `./data/users.db` 將自動掛載至容器內 `/app/data/users.db`，確保使用者資料與每日配額持久保存。
- **健康檢查**：可透過 `curl http://localhost:8000/api/health` 查看 API 與模型服務狀態。
- **停止服務**：按 `Ctrl + C` 或執行 `docker compose down` 即可。

---

### (選用) 本地宿主機環境開發 (Host Virtualenv & CLI)

若選擇不安裝 Docker，直接在宿主機上執行：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### CLI 命令列工具測試：
專案配備全功能命令列工具 `app/cli.py`，支援直接下達自然語言任務至 Orchestrator：
```bash
python3 -m app.cli "請幫我排查 Railway 部署發生的 Out of Memory 錯誤"
python3 -m app.cli "寫一篇介紹 Self-RAG 防幻覺功能的 FB 宣傳貼文"
```

---

## AI 模式與動態切換配置

專案支援 **Gemini 雲端**、**OpenAI 雲端**、**Ollama 雲端** 與 **Ollama 本機** 四種提供者。在 **網頁左側控制台** 可即時動態切換。若切換時偵測到 Embedding 維度不同，系統會自動重新剖析並更新已上傳文件的向量索引。

### 模式一：Gemini 雲端 API (預設首選)

前往 [Google AI Studio](https://aistudio.google.com/) 取得免費 API Key。設定 `.env`：
```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.6-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
```

### 模式二：Ollama 雲端 API

設定 `.env`：
```dotenv
AI_PROVIDER=ollama_cloud
OLLAMA_BASE_URL=https://api.ollama.com
OLLAMA_API_KEY=your-ollama-api-key
OLLAMA_MODEL=deepseek-v4-flash:0731
OLLAMA_CLOUD_VISION_MODEL=qwen2-vl:7b
OLLAMA_EMBEDDING_MODEL=bge-m3
```

### 模式三：Ollama 本機服務

1. 依照 [Ollama 官方文件](https://docs.ollama.com/) 安裝並下載預設模型：
   ```bash
   ollama pull qwen3:4b
   ```
2. 設定 `.env`：
   ```dotenv
   AI_PROVIDER=ollama_local
   OLLAMA_LOCAL_URL=http://localhost:11434
   OLLAMA_LOCAL_MODEL=qwen3:4b
   OLLAMA_LOCAL_VISION_MODEL=qwen2-vl
   HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
   ```

### 模式四：OpenAI 雲端 API

1. 前往 [OpenAI API Keys](https://platform.openai.com/api-keys) 建立金鑰。
2. 設定 `.env`：
   ```dotenv
   AI_PROVIDER=openai
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   ```

---

## 使用方式

1. 開啟 <http://127.0.0.1:8000>。
2. 可點擊頂部導覽列按鈕即時切換 **繁體中文** 或 **English** 介面。
3. 註冊並登入帳號（新註冊帳號需由管理員審核開通）。
4. 上傳 PDF 教材（支援含數學公式與結構表格之文件）。
5. 選擇學習對象、教學語氣、課程時間、投影片數量與 **目標輸出語言 (🇹🇼 繁體中文 / 🇺🇸 English / 🤖 跟隨教材)**，並可於左側選單隨時切換 AI 提供者（Gemini / OpenAI / Ollama 雲端 / Ollama 本機）。
6. 產生並預覽投影片及逐頁演講稿。
7. 下載 `.pptx` 或 `.md`，或切換至「文件問答」向教材提問。
8. 登入管理員帳號可進入 **🤖 Agent 指揮所**（或使用 CLI）派發跨部門自動化任務。

驗證健康狀態：

```bash
curl http://127.0.0.1:8000/api/health
```

Gemini 雲端模式的回應範例：

```json
{
  "status": "ok",
  "provider": "gemini",
  "provider_label": "Gemini 雲端 API",
  "generation_model": "gemini-3.6-flash",
  "embedding_model": "gemini-embedding-2"
}
```

---

## API 端點列表

| Method | Endpoint | 說明 |
|---|---|---|
| `GET` | `/api/health` | 顯示系統健康狀態與當前 AI 提供者資訊 |
| `GET` | `/api/provider` | 查詢當前 AI 模型提供者詳細資訊與可切換選項 |
| `POST` | `/api/provider` | 動態切換 AI 模型提供者 (`gemini` / `ollama_cloud` / `ollama_local` / `openai`) |
| `POST` | `/api/auth/register` | 使用者註冊（新帳號需管理員審核） |
| `POST` | `/api/auth/login` | 使用者登入並取得 JWT Bearer Token |
| `GET` | `/api/user/me` | 查詢當前登入使用者身分與每日剩餘配額 |
| `POST` | `/api/user/change-password` | 修改當前使用者密碼 |
| `POST` | `/api/documents` | 上傳 PDF，執行 VLM 多模態頁面解析並建立向量索引（需登入） |
| `POST` | `/api/ask` | 根據指定文件回答問題（需登入與配額，可選 `enable_web_search`） |
| `POST` | `/api/decks` | 產生投影片及逐頁講稿（需登入與配額，支援 `language: zh-TW/en/auto`） |
| `GET` | `/api/decks/{deck_id}/pptx` | 下載 PowerPoint 簡報文件 |
| `GET` | `/api/decks/{deck_id}/script` | 下載 Markdown 演講腳本 |
| `GET` | `/api/agent/skills` | [管理員] 查詢多部門 AI Skills 註冊表與關鍵字 |
| `POST` | `/api/agent/dispatch` | [管理員] 派發自然語言任務至 CompanyRouter 執行多部門調度 |
| `GET` | `/api/admin/users/list` | [管理員] 查詢全站使用者帳號清單（含每日與累計用量、上次上線時間） |
| `GET` | `/api/admin/users/pending` | [管理員] 查詢待開通審核之使用者帳號列表 |
| `POST` | `/api/admin/users/review` | [管理員] 核准或拒絕使用者帳號開通 |
| `POST` | `/api/admin/users/tier` | [管理員] 變更使用者會員層級 (`teacher_trial` / `teacher_pro` / `institution` / `admin`) |
| `POST` | `/api/admin/users/role` | [管理員] 調整使用者權限角色 (`user` / `admin`) |
| `POST` | `/api/admin/users/reset-password` | [管理員] 強制重置指定使用者密碼 |
| `DELETE` | `/api/admin/users/{username}` | [管理員] 刪除指定使用者帳號 |

啟動服務後，可在 <http://127.0.0.1:8000/docs> 查看完整互動式 OpenAPI 文件。

---

## 專案結構

```text
.
├── Dockerfile           # Docker 容器建置設定 (含 CPU-only PyTorch 與 GITHUB_TOKEN 支持)
├── docker-compose.yml   # Docker Compose 服務編排（包含目錄掛載與 Hot Reload）
├── .dockerignore        # Docker 忽略檔案設定
├── app/
│   ├── main.py          # FastAPI 路由、Auth、Admin、PDF 上傳與核心端點
│   ├── models.py        # 文件、來源、問答與簡報 Pydantic/Dataclass 模型
│   ├── tiers.py         # 四大會員層級 (Tiering) 與每日流量上限權限定義
│   ├── services.py      # PyMuPDF 渲染、Gemini/OpenAI/Ollama 整合與向量檢索
│   ├── workflows/       # LangGraph 狀態圖工作流模組
│   │   ├── state.py     # QAState 與 DeckState 狀態定義
│   │   ├── qa_graph.py  # Self-RAG + CRAG 問答狀態圖
│   │   └── deck_graph.py# 多階段簡報生成狀態圖 (含語言控制)
│   └── static/          # HTML、CSS、JavaScript 前端 UI (含 i18n 雙語模組與模型選單)
└── tests/
    ├── test_api.py
    ├── test_services.py
    └── test_workflows.py
```

---

## 測試

測試使用 Mock 的向量與 API 回應，不需要連線到外部服務。

### 透過 Docker 容器執行測試：
```bash
docker compose exec app pytest -v
```

### 透過本機環境執行測試：
```bash
python3 -m pytest -v
```

---

## Railway 部署

本專案支援透過 Docker 鏡像檔直接部署至 [Railway](https://railway.app)。

### 部署重點說明：
1. **私有模組與 GITHUB_TOKEN**：本專案依賴私有庫 `fastapi-auth-core`。請在 Railway 的 **Variables** 頁面新增 `GITHUB_TOKEN`（填入具備 `fastapi-auth-core` Read-only 權限的 Personal Access Token），Docker 建置時會自動從私有 GitHub 庫下載安裝。
2. **零 PyTorch 記憶體優化 (RAM < 250MB)**：當 `AI_PROVIDER` 設定為 `gemini`、`openai` 或 `ollama_cloud` 時，服務採用 **Lazy Loading 延遲載入** 機制，不會在伺服器上載入 PyTorch 模型，全站實測記憶體佔用小於 **250MB RAM**，完全符合 Railway 免費或低成本方案需求。
3. **環境變數設定 (Variables)**：請於 Railway 控制台設定 `GITHUB_TOKEN`、`AI_PROVIDER=gemini`、`GEMINI_API_KEY`、`JWT_SECRET_KEY`、`AUTH_DB_PATH=/app/data/users.db` 等變數。
4. **資料持久化 (Persistent Volume)**：請於 Railway 新增 Volume 並將掛載路徑設定為 `/app/data`，確保 SQLite 使用者資料庫重啟不遺失。

---

## 常見問題

### Docker 建置出現 read-only file system 或顯卡套件下載過慢

`Dockerfile` 已加入 CPU-only 索引標籤 `--extra-index-url https://download.pytorch.org/whl/cpu`。若遭遇快取毀損，可執行：
```bash
docker builder prune -f
docker compose up --build
```

### 無法連線到 Ollama 本機服務

確認服務和模型：

```bash
ollama list
curl http://localhost:11434/api/tags
```

若 Ollama 位於其他主機，請修改 `OLLAMA_LOCAL_URL`。

