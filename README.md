# 課伴 LessonFlow

把 PDF 教材轉成教學簡報、逐頁演講稿，並透過 RAG（檢索增強生成）針對文件內容問答的教學助理。

## 功能

- 上傳 PDF，自動解析頁面並建立可檢索的知識索引
- 依對象、語氣、堂數及簡報頁數產生教學大綱
- 線上預覽投影片與逐頁講稿，匯出 `.pptx` 和 `.md`
- 文件問答附上來源頁碼及相關原文，避免脫離教材回答
- 未設定 API Key 時可使用本機檢索與示範內容；設定後啟用 OpenAI Responses API 與 embeddings

## 快速開始

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

開啟 <http://127.0.0.1:8000>。正式 AI 功能需在 `.env` 或環境變數設定 `OPENAI_API_KEY`；模型可由 `OPENAI_MODEL` 覆寫。

## 架構

```text
app/
├── main.py          # API、PDF 上傳、下載端點
├── services.py      # PDF 解析、RAG、AI 與 PPTX 產生
├── models.py        # 資料模型
└── static/          # 無建置步驟的響應式前端
```

AI 呼叫採用 OpenAI 官方 Python SDK 的 [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)，文件向量預設使用 `text-embedding-3-small`。所有索引目前存於記憶體，適合 MVP；正式部署可將 `DocumentStore` 換成 PostgreSQL + pgvector。

## 測試

```bash
pytest
```
