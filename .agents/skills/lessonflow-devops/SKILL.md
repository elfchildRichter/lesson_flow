---
name: lessonflow-devops
description: Lesson Flow 技術維護工程師 Skill。負責處理 Railway 雲端部署、Linux Kernel OOM 診斷、Hugging Face 快取持久化、AI Provider 切換與 Docker 環境建置。
---

# 🛠️ Lesson Flow 技術維護部 (Lesson Flow 技術維護工程師)

## 📌 部門定位與核心職責
技術維護部是 Lesson Flow 系統穩定度、效能優化與基礎設施的守護者。

### 主要任務：
1. **雲端部署與監控 (Railway DevOps)**：維護 Railway 部署設定、資源限制與環境變數設定。
2. **OOM (Out of Memory) 診斷與優化**：排查 PyTorch / SentenceTransformers 模型載入導致的 512MB RAM 超標問題，維護 Hugging Face 快取持久化 Volume (`/app/data`)。
3. **多模型提供者整合 (AI Providers)**：維護 `gemini`, `openai`, `ollama_cloud`, `ollama_local` 四大推論引擎切換機制。
4. **系統容錯與降級機制 (Graceful Degradation)**：當主模型 API 異常或超過配額時，自動觸發修復與降級邏輯。

---

## 🛠️ 相關檔案與核心組件
- [`app/services.py`](file:///Users/Archer/Repos/lesson_flow/app/services.py)：Embedding 與 LLM 載入邏輯
- [`Dockerfile`](file:///Users/Archer/Repos/lesson_flow/Dockerfile) & [`docker-compose.yml`](file:///Users/Archer/Repos/lesson_flow/docker-compose.yml)：容器化建置
- [`TODO.md`](file:///Users/Archer/Repos/lesson_flow/TODO.md)： Railway 部署日誌與診斷問題紀錄簿

---

## 📋 標準作業規範 (SOP)

### 1. OOM 記憶體溢出處理流程
- 在資源受限的雲端環境 (RAM < 512MB)，優先將環境變數設定為 `AI_PROVIDER=gemini` 或 `openai`，避開本機 PyTorch 載入。
- 若需使用本機/HuggingFace 模型，必須確保掛載持久化卷軸 `HF_HOME=/app/data/huggingface` 防止每次重啟重複下載。

### 2. OpenAI API Strict JSON Schema 防護
- 呼叫 `response_format={"type": "json_schema", ...}` 時，遞迴檢查所有 JSON schema 的 object 物件層級，確保強制加上 `"additionalProperties": False`。
