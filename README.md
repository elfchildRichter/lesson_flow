# 課伴 LessonFlow

課伴是一個以 **LangGraph 狀態圖** 與 **檢索增強生成 (RAG: Retrieval-Augmented Generation)** 為核心的 AI 教學助理。上傳 PDF 教材後，可以：

- 產生可下載的 PowerPoint 教學簡報與高品質逐頁演講稿
- 使用自然語言向教材提問，獲得附帶頁碼標示的精準回答
- **Self-RAG 防幻覺審查**：自動校對回答真實性，避免模型自創不實資訊
- **可選性網路補充搜尋 (Corrective RAG)**：當教材資訊不足或需延伸案例時，可勾選開啟聯網搜尋補足內容

專案支援兩種 AI 執行模式：

| 模式 | 文字生成 | Embedding | 適用情境 |
|---|---|---|---|
| Ollama（預設） | 本機 Ollama 模型 | Hugging Face Sentence Transformers | 教材不離開電腦、離線推論、無 API 費用 |
| OpenAI | OpenAI Responses API | OpenAI Embeddings API | 較高生成品質、不需在本機執行模型 |

專案不包含範例教材、固定回答或模板生成降級；內容均來自使用者上傳的 PDF。

## 核心架構：LangGraph 工作流 (Workflows)

本專案採用 **LangGraph** 重構兩大 AI 核心作業：

1. **問答工作流 (Self-RAG + CRAG QA Flow)**:
   - `retrieve` ➔ `grade_documents`（相關性審查）
   - 若相關 ➔ `generate_answer` ➔ `check_hallucination`（防幻覺核對） ➔ 輸出解答
   - 若不相關 & 開啟網路搜尋 ➔ `web_search` ➔ `generate_answer`
   - 若不相關 & 未開啟網路搜尋 ➔ `fallback_answer`（安全降級提示）

2. **簡報生成工作流 (Multi-Stage Deck Flow)**:
   - `plan_outline`（第一階段：簡報大綱與單頁目標規劃）
   - `enrich_with_web`（第二階段：可選聯網檢索延伸案例與數據）
   - `generate_contents`（第三階段：單頁重點與逐字講稿生成）
   - `audit_quality`（第四階段：品質與長度檢測，不達標自動回溯精進）
   - `finalize_deck`（格式驗證與 `Deck` 模型輸出）

## 系統需求

- Python 3.10 以上（建議）
- 可選取文字的 PDF；掃描型 PDF 需先經過 OCR
- Ollama 模式需要安裝 [Ollama](https://docs.ollama.com/)
- OpenAI 模式需要有效的 OpenAI API Key

## 安裝

兩種模式共用相同的 Python 環境：

```bash
git clone <repository-url>
cd lesson_flow

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Windows PowerShell 啟用虛擬環境：

```powershell
.venv\Scripts\Activate.ps1
```

接著依照下方說明設定 Ollama 或 OpenAI 模式。

## 模式一：Ollama + Hugging Face

這是預設模式。PDF 文字、向量及提示內容都在本機處理。Hugging Face 模型第一次使用時需要下載，之後會從本機快取載入。

### 1. 安裝並啟動 Ollama

依照 [Ollama 官方文件](https://docs.ollama.com/)完成安裝，然後下載預設模型：

```bash
ollama pull qwen3:4b
```

Ollama 桌面程式通常會自動啟動服務；若沒有，可手動執行：

```bash
ollama serve
```

可使用以下指令確認模型已存在：

```bash
ollama list
```

### 2. 設定 `.env`

```dotenv
AI_PROVIDER=ollama

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

MAX_UPLOAD_MB=30
```

可以把 `OLLAMA_MODEL` 改成其他已透過 `ollama pull` 下載、且支援良好中文生成與 JSON 結構化輸出的模型。專案透過 [Ollama Chat API](https://docs.ollama.com/api/chat)產生問答及簡報內容。

本機向量使用 Sentence Transformers 的 query/document encoding 與 cosine similarity；模型使用方式可參考 [Sentence Transformers Semantic Search](https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html)。

### 3. 啟動

```bash
uvicorn app.main:app --reload
```

第一次上傳 PDF 時會下載 Hugging Face embedding 模型，因此等待時間會比後續上傳稍長。

## 模式二：OpenAI

OpenAI 模式會將文件片段與問題傳送到 OpenAI API。請留意 API 用量、費用及組織的資料處理政策。

### 1. 建立 API Key

前往 [OpenAI API Keys](https://platform.openai.com/api-keys) 建立金鑰。API Key 只能存放在伺服器端的 `.env`，不要提交到 Git 或放入前端程式。

### 2. 設定 `.env`

```dotenv
AI_PROVIDER=openai

OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-5-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

MAX_UPLOAD_MB=30
```

此模式使用 OpenAI [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)產生回答與教學內容，並使用 Embeddings API 建立文件索引。

### 3. 啟動

```bash
uvicorn app.main:app --reload
```

修改 `AI_PROVIDER` 或模型名稱後，需要重新啟動服務才會生效。

## 使用方式

1. 開啟 <http://127.0.0.1:8000>。
2. 上傳包含可擷取文字的 PDF。
3. 選擇學習對象、教學語氣、課程時間、投影片數量，並可勾選「開啟網路補充搜尋」。
4. 產生並預覽投影片及逐頁講稿。
5. 下載 `.pptx` 或 `.md`，或切換至「文件問答」向教材提問。

可透過健康檢查確認目前的提供者與模型：

```bash
curl http://127.0.0.1:8000/api/health
```

Ollama 模式的回應範例：

```json
{
  "status": "ok",
  "provider": "ollama",
  "provider_label": "Ollama + Hugging Face",
  "generation_model": "qwen3:4b",
  "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
}
```

## API

| Method | Endpoint | 說明 |
|---|---|---|
| `GET` | `/api/health` | 顯示目前的 AI 提供者與模型 |
| `POST` | `/api/documents` | 上傳 PDF 並建立 embedding 索引 |
| `POST` | `/api/ask` | 根據指定文件回答問題（可選 `enable_web_search: bool`） |
| `POST` | `/api/decks` | 產生投影片及逐頁講稿（可選 `enable_web_search: bool`） |
| `GET` | `/api/decks/{deck_id}/pptx` | 下載 PowerPoint |
| `GET` | `/api/decks/{deck_id}/script` | 下載 Markdown 講稿 |

啟動服務後，可在 <http://127.0.0.1:8000/docs> 查看互動式 API 文件。

## 專案結構

```text
app/
├── main.py          # FastAPI 路由、PDF 上傳、問答與簡報端點
├── models.py        # 文件、來源、問答與簡報 Pydantic/Dataclass 模型
├── services.py      # PDF 解析、Embedding、向量檢索與 LangGraph 調用
├── workflows/       # LangGraph 狀態圖工作流模組
│   ├── state.py     # QAState 與 DeckState 狀態定義
│   ├── qa_graph.py  # Self-RAG + CRAG 問答狀態圖
│   └── deck_graph.py# 多階段簡報生成狀態圖
└── static/          # HTML、CSS、JavaScript 前端 UI
tests/
├── test_api.py
├── test_services.py
└── test_workflows.py
```

文件與向量索引目前儲存在程序記憶體中，重新啟動服務後會清除，適合本機開發與 MVP。正式部署可改用 PostgreSQL + pgvector 或其他向量資料庫。

## 測試

測試使用假的 embedding 與 Ollama 回應，不需要連線到外部服務：

```bash
PYTHONPATH=. .venv/bin/pytest -v
```

## 常見問題

### 無法連線到 Ollama

確認服務和模型：

```bash
ollama list
curl http://localhost:11434/api/tags
```

若 Ollama 位於其他主機，請修改 `OLLAMA_BASE_URL`。容器內的 `localhost` 指向容器本身，Docker 部署時通常需要使用宿主機位址。

### 顯示找不到 Ollama 模型

`OLLAMA_MODEL` 必須與 `ollama list` 顯示的名稱完全一致：

```bash
ollama pull qwen3:4b
```

### Hugging Face 模型下載失敗

確認第一次執行時可以連線到 Hugging Face。下載完成後可使用本機快取；也可以將 `HUGGINGFACE_EMBEDDING_MODEL` 設為本機模型目錄。

### OpenAI 模式啟動失敗

確認以下設定均存在，且重新啟動服務：

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=your-api-key
```

### PDF 沒有可擷取的文字

此 PDF 很可能是掃描圖片。請先使用 OCR 工具建立文字層，再重新上傳。
