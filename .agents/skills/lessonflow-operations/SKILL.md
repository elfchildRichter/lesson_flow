---
name: lessonflow-operations
description: Lesson Flow 事務負責人 Skill。負責處理使用者身份驗證、權限控制、每日 Quota 額度管理、系統設定與廣播通知。
---

# 📋 Lesson Flow 營運與行政部 (Lesson Flow 事務負責人)

## 📌 部門定位與核心職責
營運與行政部負責 Lesson Flow 平台的日常維運規則、使用者存取控制與服務用量平衡。

### 主要任務：
1. **身分驗證與權限控制 (Auth & RBAC)**：維護 JWT 登入認證，區分一般使用者與 👑 系統管理員。
2. **Quota 額度管理**：控制每日問答與簡報生成上限，避免單一用戶超額使用 API 資源。
3. **系統公告與選單邏輯**：負責控制台選項設定、頁面狀態同步與前端選單互動流。

---

## 🛠️ 相關檔案與核心組件
- [`app/main.py`](file:///Users/Archer/Repos/lesson_flow/app/main.py)：FastAPI 路由、Auth Middleware 與 Quota 限流
- [`app/models.py`](file:///Users/Archer/Repos/lesson_flow/app/models.py)：User, Quota, History 數據模型
- [`app/static/`](file:///Users/Archer/Repos/lesson_flow/app/static)：前端控制台與 UI 選單介面

---

## 📋 標準作業規範 (SOP)

### 1. 使用者額度與權限控管
- 限制一般使用者每日免費請求次數（例如 20 次 QA / 5 次簡報生成），超過時傳回 `429 Too Many Requests`。
- 管理員帳號 (Admin) 可解鎖無限額度與日誌檢視權限。

### 2. UI 互動優化與頁面同步
- 當使用者切換選單選項或重傳檔案時，設計清晰的即時回饋（如 Toast 提示或微控制台更新），減少強制要求使用者手動點擊瀏覽器重新整理（Refresh）頻率。
