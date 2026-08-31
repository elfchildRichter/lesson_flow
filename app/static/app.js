const state = {
  document: null,
  deck: null,
  activeSlide: 0,
  user: null,
  provider: null,
  activeDept: null,
  agentHistory: [],
  lang: localStorage.getItem('app_lang') || 'zh-TW'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const translations = {
  'zh-TW': {
    'nav.brand': '課伴<small>LESSONFLOW (Alpha)</small>',
    'nav.workspace': '教材解析',
    'nav.deck': '教學簡報',
    'nav.chat': '教材問答',
    'nav.profile': '個人帳號設定',
    'nav.admin': '管理員控制台',
    'nav.agent': 'AI 備課助手',
    'nav.crumb_create': '建立新課程',
    'nav.crumb_workspace': '教材解析',
    'nav.crumb_deck': '簡報檢視',
    'nav.crumb_chat': '教材問答',
    'nav.crumb_admin': '管理員控制台',
    'nav.crumb_agent': 'AI 備課助手',
    'nav.crumb_profile': '個人帳號設定',
    'agent.eyebrow': '💡 AI 教師備課與任務助手',
    'agent.title': '💡 AI 備課助手',
    'agent.subtitle': '自動為您設計單元教案大綱、生成測驗題庫、撰寫講稿大綱與 FB/Threads 社群教學宣傳貼文。',
    'agent.metric_depts': '4 大專家助手',
    'agent.metric_depts_sub': '教務備課 · 題庫生成 · 行銷推廣 · 限額查詢',
    'agent.metric_skills': '5 個 Skills',
    'agent.metric_skills_sub': '外掛式動態註冊表 (Registry)',
    'agent.metric_router': 'CompanyRouter',
    'agent.metric_router_sub': '意圖自適應分流與容錯',
    'agent.dept_status_active': '🟢 服務中',
    'agent.dept_academic_title': '教務教學部',
    'agent.dept_academic_role': 'Lesson Flow 小老師',
    'agent.dept_academic_desc': '負責教材解析、問答流調優、單元教案大綱、試題與簡報逐頁演講稿生成。',
    'agent.dept_ops_title': '營運與行政部',
    'agent.dept_ops_role': '教務行政特助',
    'agent.dept_ops_desc': '負責學校/機構團體合約、席位授權撥發、帳號開通與團隊權限維護。',
    'agent.dept_mkt_title': '市場與營銷部',
    'agent.dept_mkt_role': '營銷推廣負責人',
    'agent.dept_mkt_desc': '負責課程宣傳推廣、教學賣點包裝、招生文案與 FB/Threads/LinkedIn 社群貼文生成。',
    'agent.dept_devops_title': '技術維護部',
    'agent.dept_devops_role': '技術維護工程師',
    'agent.dept_devops_desc': '負責 JWT 身份驗證排查、系統 Quota 限額控管、Railway 部署與 OOM 診斷。',
    'agent.dept_mkt_platform_label': '文案推廣平台：',
    'agent.welcome_title': '💡 歡迎使用 AI 備課助手',
    'agent.welcome_desc': '請下達備課或教學任務（例如：「設計牛頓運動定律 45 分鐘教案」、「出 5 題高中生物題」或「寫一篇教學心得」）。',
    'agent.sug_1': '🎓 45 分鐘教案設計',
    'agent.sug_2': '📝 5 題生物選擇題與解析',
    'agent.sug_3': '🚀 FB/Threads 社群推廣文案',
    'agent.sug_4': '📋 查詢會員等級與每日配額',
    'agent.placeholder': '下達備課或教學任務 (例: \'幫我設計一份 45 分鐘物理教案大綱\' 或 \'出 5 題選擇題\')...',
    'provider.title': '⚡ AI 模型提供者',
    'multimodal.title': '📷 教材解析設定',
    'multimodal.toggle_label': '圖表與理化公式辨識',
    'multimodal.hint': '適合含圖表或數學符號的講義（開啟時解析時間較長）',
    'quota.title': '每日使用額度',
    'quota.unlogged': '未登入',
    'quota.unlimited': '👑 無限配額',
    'quota.active': '已開通',
    'quota.admin': '👑 管理員',
    'quota.regular': '一般用戶',
    'quota.deck_label': '教學簡報',
    'quota.ask_label': '文件提問',
    'quota.guest': '訪客用戶',
    'quota.login_hint': '點擊登入帳號',
    'topbar.status_ready': '系統就緒',
    'topbar.login_reg': '登入 / 註冊',
    'topbar.logout': '登出',

    'hero.eyebrow': 'AI 教學設計工作台',
    'hero.title': '把教材，變成一堂<br><em>真正好懂的課。</em>',
    'hero.copy': '上傳 PDF，幾分鐘內完成課程簡報、逐頁講稿，<br>還能隨時向教材提問。',
    'steps.01_title': '上傳教材',
    'steps.01_desc': 'PDF 文件',
    'steps.02_title': '設定課程',
    'steps.02_desc': '對象與節奏',
    'steps.03_title': '生成內容',
    'steps.03_desc': '簡報與講稿',
    'upload.title': '選擇你的教材',
    'upload.secure': '✓ 安全加密',
    'upload.drag': '拖曳 PDF 到這裡',
    'upload.click': '或點擊選擇電腦中的檔案',
    'upload.limit': '最大 30 MB · 支援可選取文字的 PDF',
    'settings.title': '設計這堂課',
    'settings.status_wait': '等待教材',
    'settings.audience': '學習對象',
    'settings.tone': '教學語氣',
    'settings.duration': '課程時間',
    'settings.slide_count': '簡報頁數',
    'settings.language': '簡報輸出語言',
    'settings.web_search': '開啟網路補充搜尋（延伸最新案例與外部數據）',
    'settings.generate_btn': '生成教學內容',
    'settings.estimate': '預計需要 1–2 分鐘，可留在此頁等待',
    'value.01_title': '忠於原文',
    'value.01_desc': '回答附上教材頁碼',
    'value.02_title': '教學設計',
    'value.02_desc': '不是單純內容摘要',
    'value.03_title': '即刻匯出',
    'value.03_desc': 'PPTX 與逐頁講稿',

    'opt.audience.college': '大學生',
    'opt.audience.high': '高中生',
    'opt.audience.middle': '國中生',
    'opt.audience.elementary': '國小生',
    'opt.audience.adult': '職場成人',
    'opt.audience.general': '一般大眾',
    'opt.tone.clear': '清楚易懂',
    'opt.tone.lively': '活潑互動',
    'opt.tone.rigorous': '專業嚴謹',
    'opt.tone.story': '故事引導',

    'opt.provider.gemini': '✨ Gemini 雲端 (Cloud API)',
    'opt.provider.ollama_cloud': 'Ollama 雲端 (Cloud API)',
    'opt.provider.ollama_local': 'Ollama 本機 (Local LLM)',
    'opt.provider.openai': 'OpenAI 雲端 (GPT-4o)',

    'opt.duration.20': '20 分鐘',
    'opt.duration.30': '30 分鐘',
    'opt.duration.45': '45 分鐘',
    'opt.duration.60': '60 分鐘',
    'opt.duration.90': '90 分鐘',

    'opt.slides.6': '6 頁',
    'opt.slides.8': '8 頁',
    'opt.slides.10': '10 頁',
    'opt.slides.12': '12 頁',
    'opt.slides.15': '15 頁',

    'opt.lang.zh_tw': '🇹🇼 繁體中文 (Traditional Chinese)',
    'opt.lang.en': '🇺🇸 English',
    'opt.lang.auto': '🤖 與教材同語系 (Auto)',

    'deck.eyebrow': '教學內容已就緒',
    'deck.title': '你的教學簡報',
    'deck.subtitle': '上傳教材後開始生成。',
    'deck.btn_script': '↓ 下載講稿',
    'deck.btn_pptx': '↓ 匯出 PPTX',
    'deck.empty_slide': '還沒有簡報',
    'deck.stage_empty_b': '尚未產生內容',
    'deck.stage_empty_s': '回到工作台上傳教材並設定課程',
    'deck.notes_label': '這頁怎麼說',
    'deck.page_ref': '講者備註',
    'deck.speaker_notes_placeholder': '生成後，逐頁講稿會顯示在這裡。',

    'chat.eyebrow': '文件知識庫',
    'chat.title': '問教材，不問網路。',
    'chat.subtitle': '每個回答都以你的文件為依據，並附上可核對的來源頁碼。',
    'chat.doc_empty_b': '尚未選擇教材',
    'chat.doc_empty_s': '請先回到工作台上傳',
    'chat.welcome_b': '嗨，我是你的教材助教',
    'chat.welcome_p': '上傳文件後，你可以請我解釋概念、比較差異，或從教材中整理重點。我只會根據文件內容回答。',
    'chat.sug_1': '這份教材的三個核心重點是什麼？',
    'chat.sug_2': '用簡單的例子解釋最重要的概念',
    'chat.web_search': '開啟網路補充搜尋（教材中查無解答時聯網檢索）',
    'chat.placeholder': '向教材提問…',
    'chat.shortcut': '<span>↵</span> Enter 傳送 · Shift + Enter 換行',

    'admin.eyebrow': '系統權限與用戶審核',
    'admin.title': '👑 管理員控制台',
    'admin.subtitle': '審核新註冊帳號、調整權限、重置密碼與維護全系統使用者。',
    'admin.btn_create_user': '➕ 新增用戶 / 管理員',
    'admin.metric_total': '系統總帳號數',
    'admin.metric_pending': '待開通審核',
    'admin.metric_admin': '系統管理員',
    'admin.th_id': 'ID',
    'admin.th_username': '帳號名稱',
    'admin.th_tier': '會員層級 / 角色',
    'admin.th_daily_usage': '今日使用 / 限額',
    'admin.th_total_usage': '累計總使用量',
    'admin.th_last_login': '上次上線時間',
    'admin.th_role': '角色',
    'admin.th_status': '審核狀態',
    'admin.th_created': '建立時間',
    'admin.th_actions': '管理操作',
    'admin.loading': '載入中…',
    'admin.create_modal_title': '➕ 新增帳號 (管理員開通)',
    'admin.create_modal_sub': '直接為系統建立已開通權限之一般用戶或管理員帳號',
    'admin.create_lbl_username': '帳號名稱 (Username)',
    'admin.create_lbl_password': '初始密碼 (Password)',
    'admin.create_lbl_role': '身分角色 (Role)',
    'admin.create_lbl_tier': '會員層級 (Tier)',
    'admin.create_btn_submit': '確認建立帳號',
    'admin.opt_role_user': '👤 一般用戶 (user)',
    'admin.opt_role_admin': '👑 系統管理員 (admin)',
    'admin.opt_tier_trial': '🎓 教師試用版 (1簡報/5提問)',
    'admin.opt_tier_pro': '⭐ 教師專業版 (10簡報/50提問+VLM)',
    'admin.opt_tier_inst': '🏫 機構/學校版 (100簡報/500提問)',

    'profile.eyebrow': '個人帳號與安全性設定',
    'profile.title': '⚙️ 個人帳號設定',
    'profile.subtitle': '檢視您的帳號身分、每日配額使用狀況並進行密碼修改。',
    'profile.basic_title': '帳號基本資訊',
    'profile.role_user': '一般用戶',
    'profile.role_admin': '系統管理員',
    'profile.lbl_username': '帳號名稱',
    'profile.lbl_role': '帳號權限',
    'profile.lbl_quota': '每日提問配額',
    'profile.btn_logout': '登出系統',
    'profile.change_pass_title': '修改個人密碼',
    'profile.lbl_old_pass': '原密碼',
    'profile.lbl_new_pass': '新密碼',
    'profile.ph_old_pass': '輸入原密碼',
    'profile.ph_new_pass': '輸入新密碼 (至少4字元)',
    'profile.btn_save_pass': '儲存新密碼',

    'auth.tab_login': '用戶登入',
    'auth.tab_register': '註冊新帳號',
    'auth.login_title': '歡迎回來',
    'auth.login_sub': '請輸入您的帳號與密碼以取得 API 使用權限與配額',
    'auth.lbl_username': '帳號',
    'auth.lbl_password': '密碼',
    'auth.ph_username': '輸入帳號',
    'auth.ph_password': '輸入密碼',
    'auth.btn_login': '登入系統',
    'auth.reg_title': '建立新帳號',
    'auth.reg_sub': '註冊後需經管理員開通，方可登入並開始使用每日 20 次提問額度',
    'auth.ph_reg_user': '長度至少 3 個字元',
    'auth.ph_reg_pass': '長度至少 4 個字元',
    'auth.btn_register': '送出註冊',

    'loading.read_title': '正在讀懂你的教材',
    'loading.read_copy': '整理章節與核心概念…',
    'loading.read_multimodal_copy': '正在辨識圖表、表格與理化公式，處理時間稍長請稍候…',
    'loading.read_fast_copy': '正在快速讀取純文字內容與章節結構…',
    'loading.deck_title': '正在規劃教學架構與講稿…',
    'loading.deck_copy': '運用 LLM 設計教學流程與產生簡報，需時約 1-2 分鐘…',
    'loading.ask_title': '正在對照教材內容並生成最佳解答…',
    'loading.ask_copy': '從章節段落精準索引並附上頁碼說明…',
    'toast.logout': '已成功登出',
    'toast.pass_changed': '密碼已成功修改',
    'toast.pdf_invalid': '請選擇 PDF 檔案',
    'toast.pdf_uploaded': '教材已完成解析，可以開始設計課程'
  },
  'en': {
    'nav.brand': 'LessonFlow<small>(Alpha)</small>',
    'nav.workspace': 'Material Parsing',
    'nav.deck': 'Presentation Decks',
    'nav.chat': 'Material Q&A',
    'nav.profile': 'Account Settings',
    'nav.admin': 'Admin Console',
    'nav.agent': 'AI Lesson Assistant',
    'nav.crumb_create': 'Create Course',
    'nav.crumb_workspace': 'Material Parsing',
    'nav.crumb_deck': 'Deck View',
    'nav.crumb_chat': 'Material Q&A',
    'nav.crumb_admin': 'Admin Console',
    'nav.crumb_agent': 'AI Lesson Assistant',
    'nav.crumb_profile': 'Account Settings',
    'agent.eyebrow': '💡 AI Lesson Preparation & Task Assistant',
    'agent.title': '💡 AI Lesson Assistant',
    'agent.subtitle': 'Automatically design lesson plan outlines, generate quiz questions with explanations, and draft social teaching posts.',
    'agent.metric_depts': '4 AI Assistants',
    'agent.metric_depts_sub': 'Lesson Plan · Quiz Generator · Social Post · Quota Checker',
    'agent.metric_skills': '5 Skills',
    'agent.metric_skills_sub': 'Extensible Skill Registry',
    'agent.metric_router': 'CompanyRouter',
    'agent.metric_router_sub': 'Adaptive Intent Routing & Fallback',
    'agent.dept_status_active': '🟢 Active',
    'agent.dept_academic_title': 'Academic & Teaching',
    'agent.dept_academic_role': 'Lesson Flow Tutor',
    'agent.dept_academic_desc': 'Handles material parsing, Q&A, lesson plan outlines, quiz questions, and slide deck scripts.',
    'agent.dept_ops_title': 'Operations & Admin',
    'agent.dept_ops_role': 'Ops & Institution Admin',
    'agent.dept_ops_desc': 'Handles school/institution licensing, member seat allocation, account approvals, and org permissions.',
    'agent.dept_mkt_title': 'Marketing & Sales',
    'agent.dept_mkt_role': 'Marketing Lead',
    'agent.dept_mkt_desc': 'Promotes your courses, packages teaching highlights, creates enrollment copy, and generates social media posts.',
    'agent.dept_devops_title': 'DevOps & Maintenance',
    'agent.dept_devops_role': 'DevOps Engineer',
    'agent.dept_devops_desc': 'Handles JWT auth diagnostics, system quota enforcement, Railway deployments, and OOM analysis.',
    'agent.dept_mkt_platform_label': 'Target Platform:',
    'agent.welcome_title': '💡 Welcome to AI Lesson Assistant',
    'agent.welcome_desc': 'Enter any lesson plan or teaching task (e.g. "Design a 45-min Physics lesson plan", "Generate 5 Biology quiz questions", or "Write a teaching post").',
    'agent.sug_1': '🎓 45-min Lesson Plan Design',
    'agent.sug_2': '📝 5 Biology Quiz Questions',
    'agent.sug_3': '🚀 FB/Threads Promo Post',
    'agent.sug_4': '📋 Check Tier & Daily Quota',
    'agent.placeholder': 'Enter teaching task (e.g. \'Design a 45-min Physics lesson plan\' or \'Generate 5 quiz questions\')...',
    'provider.title': '⚡ AI Provider',
    'multimodal.title': '📷 PDF Reading Mode',
    'multimodal.toggle_label': 'Diagrams & Math Formulas',
    'multimodal.hint': 'Recommended for PDFs with figures or math',
    'quota.title': 'Daily Quota',
    'quota.unlogged': 'Not Logged In',
    'quota.unlimited': '👑 Unlimited Quota',
    'quota.active': 'Active',
    'quota.admin': '👑 Admin',
    'quota.regular': 'Regular User',
    'quota.deck_label': 'Decks',
    'quota.ask_label': 'Q&A',
    'quota.guest': 'Guest User',
    'quota.login_hint': 'Click to login',
    'topbar.status_ready': 'System Ready',
    'topbar.login_reg': 'Sign In / Register',
    'topbar.logout': 'Log Out',

    'hero.eyebrow': 'AI Instructional Design Workspace',
    'hero.title': 'Transform Materials into<br><em>Truly Engaging Lessons.</em>',
    'hero.copy': 'Upload a PDF to generate presentation decks and speaker scripts in minutes,<br>and ask questions anytime.',
    'steps.01_title': 'Upload PDF',
    'steps.01_desc': 'PDF Document',
    'steps.02_title': 'Setup Course',
    'steps.02_desc': 'Audience & Pace',
    'steps.03_title': 'Generate',
    'steps.03_desc': 'Decks & Scripts',
    'upload.title': 'Select Your Material',
    'upload.secure': '✓ Secure & Encrypted',
    'upload.drag': 'Drag & Drop PDF Here',
    'upload.click': 'or click to browse files',
    'upload.limit': 'Max 30 MB · Selectable text PDF supported',
    'settings.title': 'Design This Lesson',
    'settings.status_wait': 'Awaiting Material',
    'settings.audience': 'Audience',
    'settings.tone': 'Teaching Tone',
    'settings.duration': 'Duration',
    'settings.slide_count': 'Slide Count',
    'settings.language': 'Output Language',
    'settings.web_search': 'Enable Web Search (Fetch latest cases & external data)',
    'settings.generate_btn': 'Generate Lesson Content',
    'settings.estimate': 'Takes about 1–2 minutes, feel free to wait here',
    'value.01_title': 'Factually Faithful',
    'value.01_desc': 'Answers cited with PDF page numbers',
    'value.02_title': 'Instructional Design',
    'value.02_desc': 'Structured learning, not just summaries',
    'value.03_title': 'Instant Export',
    'value.03_desc': 'Download PPTX & speaker scripts',

    'opt.audience.college': 'College Students',
    'opt.audience.high': 'High School Students',
    'opt.audience.middle': 'Middle School Students',
    'opt.audience.elementary': 'Elementary School Students',
    'opt.audience.adult': 'Working Adults',
    'opt.audience.general': 'General Public',
    'opt.tone.clear': 'Clear & Easy to Understand',
    'opt.tone.lively': 'Lively & Interactive',
    'opt.tone.rigorous': 'Professional & Rigorous',
    'opt.tone.story': 'Story-driven',

    'opt.provider.gemini': 'Gemini Cloud API ✨',
    'opt.provider.ollama_cloud': 'Ollama Cloud API',
    'opt.provider.ollama_local': 'Ollama Local LLM',
    'opt.provider.openai': 'OpenAI Cloud API',

    'opt.duration.20': '20 Mins',
    'opt.duration.30': '30 Mins',
    'opt.duration.45': '45 Mins',
    'opt.duration.60': '60 Mins',
    'opt.duration.90': '90 Mins',

    'opt.slides.6': '6 Slides',
    'opt.slides.8': '8 Slides',
    'opt.slides.10': '10 Slides',
    'opt.slides.12': '12 Slides',
    'opt.slides.15': '15 Slides',

    'opt.lang.zh_tw': '🇹🇼 Traditional Chinese',
    'opt.lang.en': '🇺🇸 English',
    'opt.lang.auto': '🤖 Auto (Match Material)',

    'deck.eyebrow': 'Lesson Content Ready',
    'deck.title': 'Your Lesson Deck',
    'deck.subtitle': 'Upload materials to start generating.',
    'deck.btn_script': '↓ Download Script',
    'deck.btn_pptx': '↓ Export PPTX',
    'deck.empty_slide': 'No slides yet',
    'deck.stage_empty_b': 'No Content Generated',
    'deck.stage_empty_s': 'Return to workspace to upload PDF & configure course',
    'deck.notes_label': 'Speaker Notes',
    'deck.page_ref': 'Notes',
    'deck.speaker_notes_placeholder': 'Speaker notes for each slide will appear here.',

    'chat.eyebrow': 'Document Knowledge Base',
    'chat.title': 'Ask Your PDF, Not The Web.',
    'chat.subtitle': 'Every answer is grounded in your document with page citations.',
    'chat.doc_empty_b': 'No Material Selected',
    'chat.doc_empty_s': 'Please upload a PDF in workspace first',
    'chat.welcome_b': "Hi! I'm your Lesson Assistant",
    'chat.welcome_p': 'Once a document is uploaded, ask me to explain concepts, compare ideas, or summarize key points.',
    'chat.sug_1': 'What are the 3 core takeaways of this material?',
    'chat.sug_2': 'Explain the main concept with a simple example',
    'chat.web_search': 'Enable Web Search (Search web if answer is not in PDF)',
    'chat.placeholder': 'Ask questions about the document...',
    'chat.shortcut': '<span>↵</span> Enter to send · Shift + Enter for new line',

    'admin.eyebrow': 'Permissions & User Management',
    'admin.title': '👑 Admin Console',
    'admin.subtitle': 'Review registered accounts, modify permissions, reset passwords, and manage users.',
    'admin.btn_create_user': '➕ Add User / Admin',
    'admin.metric_total': 'Total Accounts',
    'admin.metric_pending': 'Pending Approval',
    'admin.metric_admin': 'System Admins',
    'admin.th_id': 'ID',
    'admin.th_username': 'Username',
    'admin.th_tier': 'Membership Tier / Role',
    'admin.th_daily_usage': 'Daily Usage / Quota',
    'admin.th_total_usage': 'Cumulative Usage',
    'admin.th_last_login': 'Last Active Time',
    'admin.th_role': 'Role',
    'admin.th_status': 'Status',
    'admin.th_created': 'Created At',
    'admin.th_actions': 'Actions',
    'admin.loading': 'Loading...',
    'admin.create_modal_title': '➕ Create Account (Admin Pre-approved)',
    'admin.create_modal_sub': 'Directly create pre-approved regular user or admin accounts.',
    'admin.create_lbl_username': 'Username',
    'admin.create_lbl_password': 'Password',
    'admin.create_lbl_role': 'Account Role',
    'admin.create_lbl_tier': 'Membership Tier',
    'admin.create_btn_submit': 'Confirm Create Account',
    'admin.opt_role_user': '👤 Regular User',
    'admin.opt_role_admin': '👑 System Admin',
    'admin.opt_tier_trial': '🎓 Teacher Free Trial (1 deck/5 ask)',
    'admin.opt_tier_pro': '⭐ Teacher Pro (10 deck/50 ask + VLM)',
    'admin.opt_tier_inst': '🏫 Institution / School (100 deck/500 ask)',

    'profile.eyebrow': 'Account & Security Settings',
    'profile.title': '⚙️ Account Settings',
    'profile.subtitle': 'View account identity, daily quota usage, and change password.',
    'profile.basic_title': 'Basic Account Info',
    'profile.role_user': 'Regular User',
    'profile.role_admin': 'System Admin',
    'profile.lbl_username': 'Username',
    'profile.lbl_role': 'Role',
    'profile.lbl_quota': 'Daily Quota',
    'profile.btn_logout': 'Log Out',
    'profile.change_pass_title': 'Change Password',
    'profile.lbl_old_pass': 'Current Password',
    'profile.lbl_new_pass': 'New Password',
    'profile.ph_old_pass': 'Enter current password',
    'profile.ph_new_pass': 'Enter new password (at least 4 chars)',
    'profile.btn_save_pass': 'Save New Password',

    'auth.tab_login': 'User Login',
    'auth.tab_register': 'Register',
    'auth.login_title': 'Welcome Back',
    'auth.login_sub': 'Please enter your credentials to access API features & quota',
    'auth.lbl_username': 'Username',
    'auth.lbl_password': 'Password',
    'auth.ph_username': 'Enter username',
    'auth.ph_password': 'Enter password',
    'auth.btn_login': 'Sign In',
    'auth.reg_title': 'Create Account',
    'auth.reg_sub': 'Registration requires admin approval before logging in.',
    'auth.ph_reg_user': 'At least 3 characters',
    'auth.ph_reg_pass': 'At least 4 characters',
    'auth.btn_register': 'Submit Registration',

    'loading.read_title': 'Reading Your Material',
    'loading.read_copy': 'Analyzing chapters and key concepts...',
    'loading.read_multimodal_copy': 'Analyzing figures, tables & math formulas, this may take a moment...',
    'loading.read_fast_copy': 'Fast reading plain text and section structure...',
    'loading.deck_title': 'Designing Lesson Deck & Scripts...',
    'loading.deck_copy': 'Using LLM to structure lesson flow & generate slides, takes 1-2 mins...',
    'loading.ask_title': 'Searching PDF & Generating Answer...',
    'loading.ask_copy': 'Indexing document chunks precisely with page citations...',
    'toast.logout': 'Logged out successfully',
    'toast.pass_changed': 'Password changed successfully',
    'toast.pdf_invalid': 'Please select a valid PDF file',
    'toast.pdf_uploaded': 'Material parsed successfully! Ready for deck & Q&A.'
  }
};

function t(key) {
  const lang = state.lang || 'zh-TW';
  return (translations[lang] && translations[lang][key]) || (translations['zh-TW'] && translations['zh-TW'][key]) || key;
}

function setLanguage(lang) {
  state.lang = lang;
  localStorage.setItem('app_lang', lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-TW';

  $$('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translated = t(key);
    if (translated) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else {
        el.innerHTML = translated;
      }
    }
  });

  updateSelectOptions();

  if (state.provider) {
    updateProviderUI({ provider: state.provider });
  }

  if (state.user) {
    updateAuthUI(state.user);
  } else {
    updateAuthUI(null);
  }

  const activeView = $('.view.active')?.id.replace('View', '') || 'workspace';
  switchView(activeView);
}

function updateSelectOptions() {
  const audienceSelect = $('#audience');
  if (audienceSelect) {
    const selectedVal = audienceSelect.value;
    const audienceOpts = [
      { val: '大學生', key: 'opt.audience.college' },
      { val: '高中生', key: 'opt.audience.high' },
      { val: '國中生', key: 'opt.audience.middle' },
      { val: '國小生', key: 'opt.audience.elementary' },
      { val: '職場成人', key: 'opt.audience.adult' },
      { val: '一般大眾', key: 'opt.audience.general' }
    ];
    audienceSelect.innerHTML = audienceOpts.map(o =>
      `<option value="${o.val}" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
    ).join('');
  }

  const toneSelect = $('#tone');
  if (toneSelect) {
    const selectedVal = toneSelect.value;
    const toneOpts = [
      { val: '清楚易懂', key: 'opt.tone.clear' },
      { val: '活潑互動', key: 'opt.tone.lively' },
      { val: '專業嚴謹', key: 'opt.tone.rigorous' },
      { val: '故事引導', key: 'opt.tone.story' }
    ];
    toneSelect.innerHTML = toneOpts.map(o =>
      `<option value="${o.val}" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
    ).join('');
  }

  const providerSelect = $('#providerSelect');
  if (providerSelect) {
    const selectedVal = providerSelect.value;
    const providerOpts = [
      { val: 'gemini', key: 'opt.provider.gemini' },
      { val: 'ollama_cloud', key: 'opt.provider.ollama_cloud' },
      { val: 'ollama_local', key: 'opt.provider.ollama_local' },
      { val: 'openai', key: 'opt.provider.openai' }
    ];
    providerSelect.innerHTML = providerOpts.map(o =>
      `<option value="${o.val}" style="font-size: 12px !important;" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
    ).join('');
  }

  const durationSelect = $('#duration');
  if (durationSelect) {
    const selectedVal = durationSelect.value;
    const durationOpts = [
      { val: '20', key: 'opt.duration.20' },
      { val: '30', key: 'opt.duration.30' },
      { val: '45', key: 'opt.duration.45' },
      { val: '60', key: 'opt.duration.60' },
      { val: '90', key: 'opt.duration.90' }
    ];
    durationSelect.innerHTML = durationOpts.map(o =>
      `<option value="${o.val}" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
    ).join('');
  }

  const slideCountSelect = $('#slideCount');
  if (slideCountSelect) {
    const selectedVal = slideCountSelect.value;
    const slideOpts = [
      { val: '6', key: 'opt.slides.6' },
      { val: '8', key: 'opt.slides.8' },
      { val: '10', key: 'opt.slides.10' },
      { val: '12', key: 'opt.slides.12' },
      { val: '15', key: 'opt.slides.15' }
    ];
    slideCountSelect.innerHTML = slideOpts.map(o =>
      `<option value="${o.val}" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
    ).join('');
  }

  const targetLangSelect = $('#targetLanguage');
  if (targetLangSelect) {
    const selectedVal = targetLangSelect.value;
    const langOpts = [
      { val: 'zh-TW', key: 'opt.lang.zh_tw' },
      { val: 'en', key: 'opt.lang.en' },
      { val: 'auto', key: 'opt.lang.auto' }
    ];
    targetLangSelect.innerHTML = langOpts.map(o =>
      `<option value="${o.val}" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
    ).join('');
  }
}

function translateError(msg) {
  if (!msg) return state.lang === 'en' ? 'Service temporarily unavailable' : '服務暫時無法使用';
  if (state.lang !== 'en') return msg;

  const errorMap = {
    '服務暫時無法使用': 'Service temporarily unavailable',
    '只支援 PDF 檔案': 'Only PDF files are supported',
    '找不到文件，請重新上傳': 'Document not found, please re-upload',
    '找不到簡報': 'Presentation deck not found',
    '找不到講稿': 'Speaker script not found',
    '請先登入帳號': 'Please log in first',
    '僅限管理員存取': 'Admin access only',
    '僅限管理員存取控制台': 'Admin access only',
    '請輸入有效的帳號與密碼': 'Please enter a valid username and password',
    '帳號與密碼長度至少需 4 個字元': 'Username and password must be at least 4 characters',
    '帳號或密碼錯誤': 'Incorrect username or password',
    '帳號尚未經過管理員核准開通': 'Account pending admin approval',
    '此帳號已被停用': 'Account has been disabled',
    '此帳號已被停用或拒絕開通': 'Account disabled or application rejected',
    '使用者名稱已存在': 'Username already exists',
    '無效的 Token': 'Invalid authentication token',
    '登入憑證已過期': 'Session expired, please log in again',
    '每日生成簡報配額已達上限 (每日最多 3 份)': 'Daily deck quota reached (Max 3/day)',
    '每日文件提問配額已達上限 (每日最多 10 次)': 'Daily Q&A quota reached (Max 10/day)',
    '新密碼長度至少需 4 個字元': 'New password must be at least 4 characters',
    '舊密碼輸入錯誤': 'Incorrect old password',
    '密碼已成功修改': 'Password changed successfully',
    '未設定 OPENAI_API_KEY，無法切換至 OpenAI': 'OPENAI_API_KEY is not set. Cannot switch to OpenAI.',
    '無法讀取加密的 PDF': 'Cannot read encrypted PDF files.',
    'PDF 沒有可擷取的文字；掃描檔請先執行 OCR': 'PDF has no extractable text; please run OCR for scanned documents first.',
    '請先選擇 PDF 檔案': 'Please select a PDF file',
    '請選擇 PDF 檔案': 'Please select a PDF file',
    '請先登入帳號以開始問答': 'Please log in to ask questions',
    '請先上傳教材': 'Please upload material first',
    '請先登入帳號以使用文件上傳功能': 'Please log in to upload documents',
    '登入失敗': 'Login failed',
    '註冊失敗': 'Registration failed',
    '用戶狀態已更新': 'User status updated',
    '角色權限已更新': 'User role updated',
    '密碼重置成功': 'Password reset successfully',
    '已刪除使用者': 'User deleted successfully'
  };

  if (errorMap[msg]) return errorMap[msg];

  if (typeof msg === 'string') {
    if (msg.includes('未偵測到 Ollama 本機服務') || msg.includes('未偵測到 Ollama')) {
      const match = msg.match(/\((http[s]?:\/\/[^\)]+)\)/);
      const url = match ? match[1] : 'http://localhost:11434';
      return `Local Ollama service not detected. Please verify Ollama is installed and running at ${url}.`;
    }
    if (msg.includes('檔案不可超過')) {
      return msg.replace('檔案不可超過', 'File size cannot exceed');
    }
    if (msg.includes('處理 PDF 時發生錯誤')) {
      return msg.replace('處理 PDF 時發生錯誤：', 'Error processing PDF: ');
    }
    if (msg.includes('AI 暫時無法回答')) {
      return msg.replace('AI 暫時無法回答：', 'AI temporarily unavailable: ');
    }
    if (msg.includes('產生教材時發生錯誤')) {
      return msg.replace('產生教材時發生錯誤：', 'Error generating lesson content: ');
    }
    if (msg.includes('Hugging Face embedding 模型載入或推論失敗')) {
      return msg.replace('Hugging Face embedding 模型載入或推論失敗：', 'Hugging Face embedding model load/inference failed: ');
    }
  }

  return msg;
}

function toast(message, error = false) {
  message = translateError(message);
  const el = $('#toast'); el.querySelector('p').textContent = message; el.querySelector('span').textContent = error ? '!' : '✓';
  el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3200);
}

function loading(show, title, copy) {
  title = title || t('loading.read_title');
  copy = copy || t('loading.read_copy');
  $('#loadingTitle').textContent = title; $('#loadingCopy').textContent = copy; $('#loadingOverlay').classList.toggle('hidden', !show);
}

// 支援 Bearer Token 的 Fetch 封裝
async function api(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  options.headers = options.headers || {};
  if (token) {
    if (options.body instanceof FormData) {
      options.headers['Authorization'] = `Bearer ${token}`;
    } else {
      options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    }
  }

  const response = await fetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    let errorMsg = body.detail;
    if (typeof errorMsg === 'object' && errorMsg !== null) {
      errorMsg = JSON.stringify(errorMsg);
    }
    if (!errorMsg) {
      errorMsg = response.status === 503
        ? '服務暫時無法使用'
        : `HTTP Error ${response.status}: ${response.statusText || '系統發生錯誤'}`;
    }

    if (response.status === 401 && token) {
      logoutUser(false);
      openAuthModal('login');
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// --- 身份驗證 UI 與 Tier 配額控制 ---

function getTierInfo(user) {
  const isEn = state.lang === 'en';
  if (!user) {
    return {
      tierKey: 'teacher_trial',
      badge: isEn ? '🎓 Teacher Free Trial' : '🎓 教師試用版',
      deckLimit: 1,
      askLimit: 5,
      maxUploadMb: 10,
      isUnlimited: false
    };
  }
  if (user.role === 'admin' || user.tier === 'admin') {
    return {
      tierKey: 'admin',
      badge: isEn ? '👑 Unlimited' : '👑 無限版',
      deckLimit: -1,
      askLimit: -1,
      maxUploadMb: 500,
      isUnlimited: true
    };
  }
  let rawTier = (user.tier || '').toLowerCase();
  if (rawTier.includes('inst') || rawTier.includes('school')) rawTier = 'institution';
  else if (rawTier.includes('pro')) rawTier = 'teacher_pro';
  else if (rawTier.includes('trial') || rawTier.includes('free')) rawTier = 'teacher_trial';

  const tierKey = rawTier || (user.role === 'admin' ? 'admin' : 'teacher_trial');
  const tiers = {
    'teacher_trial': {
      tierKey: 'teacher_trial',
      badge: isEn ? '🎓 Teacher Free Trial' : '🎓 教師試用版',
      deckLimit: 1,
      askLimit: 5,
      maxUploadMb: 10,
      isUnlimited: false
    },
    'teacher_pro': {
      tierKey: 'teacher_pro',
      badge: isEn ? '⭐ Teacher Pro' : '⭐ 教師專業版',
      deckLimit: 10,
      askLimit: 50,
      maxUploadMb: 30,
      isUnlimited: false
    },
    'institution': {
      tierKey: 'institution',
      badge: isEn ? '🏫 Institution / School' : '🏫 機構/學校版',
      deckLimit: 100,
      askLimit: 500,
      maxUploadMb: 100,
      isUnlimited: false
    }
  };
  return tiers[tierKey] || tiers['teacher_pro'];
}

function updateAuthUI(user) {
  state.user = user;
  const container = $('#authHeaderContainer');
  const tier = getTierInfo(user);

  if (user) {
    const q = user.quota || {};
    const deckLimit = tier.isUnlimited ? -1 : (q.deck?.daily_limit || tier.deckLimit);
    const askLimit = tier.isUnlimited ? -1 : (q.ask?.daily_limit || tier.askLimit);
    const deckUsed = q.deck?.used_count || 0;
    const askUsed = q.ask?.used_count || 0;
    const isUnlimited = tier.isUnlimited;

    const quotaLabel = isUnlimited
      ? tier.badge
      : (state.lang === 'en'
        ? `${tier.badge} · Decks:${deckUsed}/${deckLimit}`
        : `${tier.badge} · 教材:${deckUsed}/${deckLimit}份`);

    if (container) {
      container.innerHTML = `
        <div class="auth-user-chip">
          <strong>👤 ${escapeHtml(user.username)}</strong>
          <small>${quotaLabel}</small>
          <button class="auth-logout-btn" id="logoutBtn" type="button">${t('topbar.logout')}</button>
        </div>
      `;
    }

    // 更新側邊欄 Profile 卡片
    if ($('#quotaBadge')) $('#quotaBadge').textContent = tier.badge;
    if ($('#deckQuotaText')) $('#deckQuotaText').textContent = isUnlimited ? (state.lang === 'en' ? 'Unlimited' : '無限') : `${deckUsed} / ${deckLimit} ${state.lang === 'en' ? '' : '份'}`;
    if ($('#deckQuotaBar')) {
      $('#deckQuotaBar').style.width = isUnlimited ? '100%' : `${Math.min(100, (deckUsed / deckLimit) * 100)}%`;
      $('#deckQuotaBar').style.background = isUnlimited ? '#d97706' : 'var(--green)';
    }
    if ($('#askQuotaText')) $('#askQuotaText').textContent = isUnlimited ? (state.lang === 'en' ? 'Unlimited' : '無限') : `${askUsed} / ${askLimit} ${state.lang === 'en' ? '' : '次'}`;
    if ($('#askQuotaBar')) {
      $('#askQuotaBar').style.width = isUnlimited ? '100%' : `${Math.min(100, (askUsed / askLimit) * 100)}%`;
      $('#askQuotaBar').style.background = isUnlimited ? '#d97706' : 'var(--green)';
    }

    if ($('#userAvatar')) $('#userAvatar').textContent = user.role === 'admin' ? '👑' : user.username.charAt(0).toUpperCase();
    if ($('#userProfileInfo')) $('#userProfileInfo').innerHTML = `${escapeHtml(user.username)}<small>${tier.badge}</small>`;
  } else {
    if (container) container.innerHTML = `<button class="auth-btn" id="openAuthBtn" type="button" data-i18n="topbar.login_reg">${t('topbar.login_reg')}</button>`;

    // 重置側邊欄 Profile 卡片
    if ($('#quotaBadge')) $('#quotaBadge').textContent = tier.badge;
    if ($('#deckQuotaText')) $('#deckQuotaText').textContent = state.lang === 'en' ? `- / ${tier.deckLimit}` : `- / ${tier.deckLimit} 份`;
    if ($('#deckQuotaBar')) $('#deckQuotaBar').style.width = '0%';
    if ($('#askQuotaText')) $('#askQuotaText').textContent = state.lang === 'en' ? `- / ${tier.askLimit}` : `- / ${tier.askLimit} 次`;
    if ($('#askQuotaBar')) $('#askQuotaBar').style.width = '0%';
    if ($('#userAvatar')) $('#userAvatar').textContent = state.lang === 'en' ? 'G' : '客';
    if ($('#userProfileInfo')) $('#userProfileInfo').innerHTML = `${t('quota.guest')}<small>${tier.badge}</small>`;
  }
  updateAdminUI();
  updateAgentDepartmentBadges(user);
  const profileNavBtn = $('#profileNavBtn');
  if (profileNavBtn) {
    if (state.user) profileNavBtn.classList.remove('hidden');
    else profileNavBtn.classList.add('hidden');
  }
}

function renderDeptActiveIndicators() {
  const isEn = state.lang === 'en';
  const activeKey = state.activeDept; // null = unsegmented omni mode

  const depts = [
    { key: 'academic', card: '#deptCardAcademic', defaultLabel: isEn ? '💬 Chat with Academic Tutor' : '💬 與教務小老師對話', activeLabel: isEn ? '✓ Active Chatting' : '✓ 對話中 (教務小老師)' },
    { key: 'marketing', card: '#deptCardMarketing', defaultLabel: isEn ? '💬 Chat with Marketing Lead' : '💬 與營銷推廣負責人對話', activeLabel: isEn ? '✓ Active Chatting' : '✓ 對話中 (營銷推廣負責人)' },
    { key: 'operations', card: '#deptCardOperations', defaultLabel: isEn ? '💬 Chat with Ops Admin' : '💬 與教務行政特助對話', activeLabel: isEn ? '✓ Active Chatting' : '✓ 對話中 (教務行政特助)' },
    { key: 'devops', card: '#deptCardDevops', defaultLabel: isEn ? '💬 Chat with DevOps Engineer' : '💬 與技術維護工程師對話', activeLabel: isEn ? '✓ Active Chatting' : '✓ 對話中 (技術維護工程師)' }
  ];

  depts.forEach(item => {
    const card = $(item.card);
    if (!card) return;
    const btn = card.querySelector('.dept-chat-btn');
    const isThisActive = (activeKey === item.key);

    if (isThisActive) {
      card.classList.add('dept-card-active');
      card.style.borderColor = '#6366f1';
      card.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.25)';
      if (btn) {
        btn.textContent = item.activeLabel;
        btn.style.background = '#4f46e5';
        btn.style.color = '#ffffff';
      }
    } else {
      card.classList.remove('dept-card-active');
      card.style.borderColor = '';
      card.style.boxShadow = '';
      if (btn) {
        btn.textContent = item.defaultLabel;
        btn.style.background = '';
        btn.style.color = '';
      }
    }
  });
}

function updateAgentDepartmentBadges(user) {
  const isEn = state.lang === 'en';
  const role = user?.role || 'guest';
  const tierKey = user?.tier || (role === 'admin' ? 'admin' : 'teacher_trial');
  const isAdmin = role === 'admin' || tierKey === 'admin';

  function setCardButtonStatus(cardSelector, isActive) {
    const card = $(cardSelector);
    if (!card) return;
    const btn = card.querySelector('.dept-chat-btn');
    if (btn) {
      btn.disabled = !isActive;
      btn.style.cursor = isActive ? 'pointer' : 'not-allowed';
      btn.style.opacity = isActive ? '1' : '0.5';
    }
  }

  // 1. 教務教學部 (Academic)
  const academicBadge = $('#deptBadgeAcademic');
  if (academicBadge) {
    academicBadge.className = 'dept-badge badge-active';
    academicBadge.textContent = isEn ? '🟢 Active' : '🟢 已啟用';
  }
  setCardButtonStatus('#deptCardAcademic', true);

  // 2. 市場與營銷部 (Marketing)
  const mktCard = $('#deptCardMarketing');
  const mktBadge = $('#deptBadgeMarketing');
  if (mktBadge) {
    mktBadge.className = 'dept-badge badge-active';
    mktBadge.textContent = isEn ? '🟢 Active' : '🟢 已啟用';
    if (mktCard) mktCard.style.opacity = '1';
  }
  setCardButtonStatus('#deptCardMarketing', true);

  // 3. 營運與行政部 (Operations)
  const opsCard = $('#deptCardOperations');
  const opsBadge = $('#deptBadgeOperations');
  if (opsBadge) {
    opsBadge.className = 'dept-badge badge-active';
    opsBadge.textContent = isEn ? '🟢 Active' : '🟢 已啟用';
    if (opsCard) opsCard.style.opacity = '1';
  }
  setCardButtonStatus('#deptCardOperations', true);

  // 4. 技術維護部 (DevOps) - Admin Only (Far right)
  const devopsCard = $('#deptCardDevops');
  const devopsBadge = $('#deptBadgeDevops');
  if (devopsBadge) {
    if (isAdmin) {
      devopsBadge.className = 'dept-badge badge-active';
      devopsBadge.textContent = isEn ? '🟢 Active (Admin)' : '🟢 管理員已啟用';
      if (devopsCard) devopsCard.style.opacity = '1';
    } else {
      devopsBadge.className = 'dept-badge badge-locked';
      devopsBadge.textContent = isEn ? '🔒 Admin Only' : '🔒 👑 管理員專用';
      if (devopsCard) devopsCard.style.opacity = '0.7';
    }
  }
  setCardButtonStatus('#deptCardDevops', isAdmin);
  renderDeptActiveIndicators();
}

async function fetchCurrentUser() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    updateAuthUI(null);
    return;
  }
  try {
    const user = await api('/api/user/me');
    updateAuthUI(user);
  } catch (err) {
    localStorage.removeItem('auth_token');
    updateAuthUI(null);
  }
}

function logoutUser(notify = true) {
  localStorage.removeItem('auth_token');
  updateAuthUI(null);
  if (notify) toast(t('toast.logout'));
}

// Modal 控制
function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  $('#loginError').classList.add('hidden');
  $('#regError').classList.add('hidden');
  $('#regSuccess').classList.add('hidden');
  const modal = $('#authModal');
  modal.classList.remove('hidden');
}

function closeAuthModal() {
  $('#authModal').classList.add('hidden');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  $('#tabLoginBtn').classList.toggle('active', isLogin);
  $('#tabRegisterBtn').classList.toggle('active', !isLogin);
  $('#loginForm').classList.toggle('hidden', !isLogin);
  $('#registerForm').classList.toggle('hidden', isLogin);
}

// 事件委派：點擊登入按鈕、登出按鈕、語言切換或側邊欄
document.addEventListener('click', (e) => {
  const langBtn = e.target.closest('.lang-btn');
  if (langBtn) {
    e.preventDefault();
    setLanguage(langBtn.dataset.lang);
    return;
  }

  const openBtn = e.target.closest('#openAuthBtn') || e.target.closest('.auth-btn');
  if (openBtn) {
    e.preventDefault();
    openAuthModal('login');
    return;
  }

  const logoutBtn = e.target.closest('#logoutBtn');
  if (logoutBtn) {
    e.preventDefault();
    logoutUser(true);
    return;
  }

  const profileBtn = e.target.closest('#sidebarProfileBtn');
  if (profileBtn) {
    e.preventDefault();
    if (state.user) {
      switchView('profile');
    } else {
      openAuthModal('login');
    }
    return;
  }
});

$('#closeAuthModalBtn')?.addEventListener('click', closeAuthModal);
$('#authModal')?.addEventListener('click', (e) => {
  if (e.target === $('#authModal')) closeAuthModal();
});
$('#tabLoginBtn')?.addEventListener('click', () => switchAuthTab('login'));
$('#tabRegisterBtn')?.addEventListener('click', () => switchAuthTab('register'));

// 登入表單提交
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;
  const errorEl = $('#loginError');
  errorEl.classList.add('hidden');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || (state.lang === 'en' ? 'Login failed' : '登入失敗'));
    }

    localStorage.setItem('auth_token', data.access_token);
    await fetchCurrentUser();
    closeAuthModal();
    toast(state.lang === 'en' ? `Welcome back, ${data.username}!` : `登入成功！歡迎回來，${data.username}`);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

// 註冊表單提交
$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#regUsername').value.trim();
  const password = $('#regPassword').value;
  const errorEl = $('#regError');
  const successEl = $('#regSuccess');
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || (state.lang === 'en' ? 'Registration failed' : '註冊失敗'));
    }

    successEl.textContent = data.message || (state.lang === 'en' ? 'Registered! Awaiting admin approval.' : '註冊成功！請等待管理員核准開通。');
    successEl.classList.remove('hidden');
    $('#regUsername').value = '';
    $('#regPassword').value = '';
    setTimeout(() => {
      switchAuthTab('login');
      $('#loginUsername').value = username;
    }, 2000);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

// --- 教材處理與核心邏輯 ---

function setDocument(doc) {
  state.document = doc;
  $('#settingsPanel').classList.remove('locked'); $('#fileCard').classList.remove('hidden'); $('#generateBtn').disabled = false;
  $('#settingStatus').textContent = state.lang === 'en' ? '✓ Parsed' : '✓ 已完成解析'; $('#fileName').textContent = doc.name;
  $('#fileMeta').textContent = state.lang === 'en'
    ? `${doc.pages} pages · ${(doc.size_bytes / 1024 / 1024).toFixed(1)} MB · ${doc.chunks} chunks`
    : `${doc.pages} 頁 · ${(doc.size_bytes / 1024 / 1024).toFixed(1)} MB · ${doc.chunks} 個知識片段`;
  $('#questionInput').disabled = false; $('#sendBtn').disabled = false;
  $('#chatDoc').innerHTML = state.lang === 'en'
    ? `<span>PDF</span><div><b>${escapeHtml(doc.name)}</b><small>${doc.pages} pages · Indexed</small></div>`
    : `<span>PDF</span><div><b>${escapeHtml(doc.name)}</b><small>${doc.pages} 頁 · 已建立索引</small></div>`;
  $('#modeText').textContent = doc.provider_label;
  const steps = $$('.step'); steps[0].classList.add('done'); steps[1].classList.add('active');
  toast(t('toast.pdf_uploaded'));
}

async function uploadFile(file) {
  if (!state.user) {
    toast(state.lang === 'en' ? 'Please log in to upload documents' : '請先登入帳號以使用文件上傳功能', true);
    openAuthModal('login');
    return;
  }
  if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) return toast(t('toast.pdf_invalid'), true);
  const data = new FormData();
  data.append('file', file);
  const enableMultimodal = $('#multimodalToggle') ? $('#multimodalToggle').checked : false;
  data.append('enable_multimodal', enableMultimodal);
  const copyKey = enableMultimodal ? 'loading.read_multimodal_copy' : 'loading.read_fast_copy';
  loading(true, t('loading.read_title'), t(copyKey));
  try { setDocument(await api('/api/documents', { method: 'POST', body: data })); }
  catch (e) { toast(e.message, true); }
  finally { loading(false); }
}

$('#fileInput').addEventListener('change', e => uploadFile(e.target.files[0]));
const dz = $('#dropzone');
['dragenter', 'dragover'].forEach(name => dz.addEventListener(name, e => { e.preventDefault(); dz.classList.add('dragging'); }));
['dragleave', 'drop'].forEach(name => dz.addEventListener(name, e => { e.preventDefault(); dz.classList.remove('dragging'); }));
dz.addEventListener('drop', e => uploadFile(e.dataTransfer.files[0]));
$('#removeFile').addEventListener('click', () => {
  state.document = null;
  $('#settingsPanel').classList.add('locked');
  $('#fileCard').classList.add('hidden');
  $('#generateBtn').disabled = true;
  $('#questionInput').disabled = true;
  $('#sendBtn').disabled = true;
  $('#settingStatus').textContent = t('settings.status_wait');
  $$('.step').forEach((s, i) => { if (i) s.classList.remove('active', 'done'); });
  toast(state.lang === 'en' ? 'Removed material from workspace' : '已從工作台移除教材');
});

function switchView(name) {
  if (name === 'admin' && (!state.user || state.user.role !== 'admin')) {
    toast(state.lang === 'en' ? 'Admin access only' : '僅限管理員存取控制台', true);
    return;
  }
  if (name === 'profile' && !state.user) {
    toast(state.lang === 'en' ? 'Please log in first' : '請先登入帳號', true);
    openAuthModal('login');
    return;
  }
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  if ($(`#${name}View`)) $(`#${name}View`).classList.add('active');

  const crumbs = {
    'workspace': t('nav.crumb_create'),
    'deck': t('nav.crumb_deck'),
    'chat': t('nav.crumb_chat'),
    'profile': t('nav.crumb_profile'),
    'agent': t('nav.crumb_agent'),
    'admin': t('nav.crumb_admin')
  };
  if ($('#crumb')) $('#crumb').textContent = crumbs[name] || t('nav.crumb_create');
  if (innerWidth < 950) toggleSidebar(false);


  if (name === 'admin') {
    fetchAllUsers();
  } else if (name === 'profile') {
    renderProfileView();
  }
}

function renderProfileView() {
  if (!state.user) return;
  if ($('#profileUsernameText')) $('#profileUsernameText').textContent = state.user.username;
  if ($('#profileRoleText')) $('#profileRoleText').textContent = state.user.role === 'admin' ? t('profile.role_admin') : t('profile.role_user');
  if ($('#profileRoleBadge')) {
    $('#profileRoleBadge').textContent = state.user.role === 'admin' ? t('quota.admin') : t('profile.role_user');
    $('#profileRoleBadge').className = `role-chip ${state.user.role}`;
  }
  if ($('#profileQuotaText')) {
    const q = state.user.quota || {};
    const deckQ = q.deck || { used_count: 0, daily_limit: 3 };
    const askQ = q.ask || { used_count: 0, daily_limit: 10 };
    if (state.user.role === 'admin') {
      $('#profileQuotaText').textContent = state.lang === 'en' ? '👑 Admin: Unlimited Quota' : '👑 管理員：無限額度';
    } else {
      $('#profileQuotaText').textContent = state.lang === 'en'
        ? `Decks: ${deckQ.used_count}/${deckQ.daily_limit} · Q&A: ${askQ.used_count}/${askQ.daily_limit}`
        : `生成教材：${deckQ.used_count}/${deckQ.daily_limit} 份 · 文件提問：${askQ.used_count}/${askQ.daily_limit} 次`;
    }
  }
}
$$('.nav-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-view]');
  if (target) {
    const viewName = target.dataset.view;
    if (viewName) {
      if (target.tagName === 'A' || target.getAttribute('href') === '#') {
        e.preventDefault();
      }
      switchView(viewName);
    }
  }
});

function toggleSidebar(forceState) {
  const sidebar = $('.sidebar');
  const overlay = $('#sidebarOverlay');
  if (!sidebar) return;
  const isOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', isOpen);
  if (overlay) overlay.classList.toggle('active', isOpen);
}

if ($('.menu-toggle')) {
  $('.menu-toggle').addEventListener('click', () => toggleSidebar());
}
if ($('#sidebarOverlay')) {
  $('#sidebarOverlay').addEventListener('click', () => toggleSidebar(false));
}

$('#generateBtn').addEventListener('click', async () => {
  if (!state.user) {
    toast(state.lang === 'en' ? 'Please log in first' : '請先登入帳號', true);
    openAuthModal('login');
    return;
  }
  if (!state.document) return;
  loading(true, t('loading.deck_title'), t('loading.deck_copy'));
  const payload = {
    document_id: state.document.id,
    audience: $('#audience').value,
    tone: $('#tone').value,
    language: $('#targetLanguage') ? $('#targetLanguage').value : 'zh-TW',
    duration: +$('#duration').value,
    slide_count: +$('#slideCount').value,
    enable_web_search: $('#deckWebSearch') ? $('#deckWebSearch').checked : false,
  };
  try {
    state.deck = await api('/api/decks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    renderDeck(); $$('.step')[1].classList.add('done'); $$('.step')[2].classList.add('active', 'done'); $('#deckCount').textContent = '1';
    await fetchCurrentUser();
    toast(state.lang === 'en' ? 'Deck and speaker notes are ready!' : '簡報與逐頁講稿已經準備好了'); switchView('deck');
  } catch (e) { toast(e.message, true); } finally { loading(false); }
});

function renderDeck() {
  const d = state.deck;
  const modeLabels = {
    'gemini': state.lang === 'en' ? 'Gemini Cloud' : 'Gemini 雲端生成',
    'openai': state.lang === 'en' ? 'OpenAI Cloud' : 'OpenAI 雲端生成',
    'ollama_cloud': state.lang === 'en' ? 'Ollama Cloud' : 'Ollama 雲端生成',
    'ollama_local': state.lang === 'en' ? 'Ollama Local' : 'Ollama 本機生成',
    'ollama': state.lang === 'en' ? 'Ollama Local' : 'Ollama 本機生成',
  };
  const modeText = modeLabels[d.mode] || (state.lang === 'en' ? 'AI Generated' : 'AI 生成');
  const slideText = state.lang === 'en' ? `${d.slides.length} Slides` : `${d.slides.length} 張投影片`;
  $('#deckTitle').textContent = d.title;
  $('#deckSubtitle').textContent = `${d.subtitle} · ${slideText} · ${modeText}`;
  $('#pptDownload').href = `/api/decks/${d.id}/pptx`;
  $('#scriptDownload').href = `/api/decks/${d.id}/script`;
  $('#pptDownload').classList.remove('disabled');
  $('#scriptDownload').classList.remove('disabled');
  $('#slideList').innerHTML = d.slides.map((s, i) => `<div class="slide-thumb ${i === 0 ? 'active' : ''}" data-index="${i}"><small>${String(i + 1).padStart(2, '0')}</small><div class="mini-slide"><b>${escapeHtml(s.title)}</b>${s.bullets.slice(0, 3).map(() => '<i></i>').join('')}</div></div>`).join('');
  $$('.slide-thumb').forEach(t => t.addEventListener('click', () => showSlide(+t.dataset.index)));
  showSlide(0);
}

const katexOptions = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ],
  throwOnError: false
};

function unescapeMathInElement(element) {
  if (!element) return;
  let html = element.innerHTML;
  html = html.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g, (match) => {
    return match
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  });
  element.innerHTML = html;
}

function renderMath(element) {
  if (typeof renderMathInElement === 'function' && element) {
    try {
      unescapeMathInElement(element);
      renderMathInElement(element, katexOptions);
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
}

function wrapSvgText(text, maxLineChars = 8) {
  if (!text) return [];
  let cleaned = text.replace(/[\*`"']/g, '').replace(/^[•\-\d\.\s、:：]+/, '').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLineChars) return [cleaned];

  const clauses = cleaned.split(/[，,；;。]/);
  if (clauses.length > 1 && clauses[0].length >= 2 && clauses[0].length <= maxLineChars + 2) {
    return [clauses[0], clauses.slice(1).join(' ').slice(0, maxLineChars)];
  }

  return [
    cleaned.slice(0, maxLineChars),
    cleaned.slice(maxLineChars, maxLineChars * 2)
  ];
}

function renderSvgTextLines(lines, cx, startY, fontSize = 11, fontColor = "#2B3530", fontWeight = "bold") {
  if (!lines || lines.length === 0) return '';
  const lineHeight = Math.round(fontSize * 1.35);
  const totalHeight = (lines.length - 1) * lineHeight;
  const initialY = startY - (totalHeight / 2);

  return `<text x="${cx}" y="${initialY}" text-anchor="middle" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fontColor}">
    ${lines.map((line, idx) => `<tspan x="${cx}" dy="${idx === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`).join('')}
  </text>`;
}

function extractConceptualTag(bulletText, fallback) {
  if (!bulletText) return wrapSvgText(fallback, 14);
  let cleaned = bulletText.replace(/[\*`"']/g, '').replace(/^[•\-\d\.\s、:：]+/, '').trim();
  if (!cleaned) return wrapSvgText(fallback, 14);

  const colonParts = cleaned.split(/[:：—\-\(（]/);
  if (colonParts.length > 1 && colonParts[0].length >= 2 && colonParts[0].length <= 14) {
    return wrapSvgText(colonParts[0], 14);
  }
  return wrapSvgText(cleaned, 14);
}

function extractEmoji(str) {
  if (!str) return '💡';
  const match = str.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}]/u);
  if (match) return match[0];
  const clean = str.toLowerCase().trim();
  if (clean.includes('bulb') || clean.includes('idea')) return '💡';
  if (clean.includes('book') || clean.includes('text')) return '📚';
  if (clean.includes('chart') || clean.includes('graph')) return '📊';
  if (clean.includes('gear') || clean.includes('process')) return '⚙️';
  if (clean.includes('brain') || clean.includes('think')) return '🧠';
  if (clean.includes('lightning') || clean.includes('power')) return '⚡';
  if (clean.includes('lock')) return '🔒';
  if (clean.includes('globe') || clean.includes('web')) return '🌐';
  if (clean.includes('target') || clean.includes('goal')) return '🎯';
  if (clean.includes('microscope') || clean.includes('science')) return '🔬';
  if (clean.includes('search')) return '🔍';
  return '💡';
}

function renderDynamicDiagram(slide, index) {
  const icon = extractEmoji(slide.icon);
  const title = slide.title || '核心觀念';
  const bullets = slide.bullets || [];

  const l1 = extractConceptualTag(bullets[0], '基礎定義');
  const l2 = extractConceptualTag(bullets[1], '核心推演');
  const l3 = extractConceptualTag(bullets[2], '應用成果');

  const titleLower = title.toLowerCase();
  let type = 'flow';
  if (titleLower.includes('架構') || titleLower.includes('系統') || titleLower.includes('結構') || titleLower.includes('組成') || titleLower.includes('分層') || titleLower.includes('流程')) {
    type = 'arch';
  } else if (titleLower.includes('對比') || titleLower.includes('比較') || titleLower.includes('差異') || titleLower.includes('vs') || titleLower.includes('優缺')) {
    type = 'compare';
  } else if (titleLower.includes('公式') || titleLower.includes('原理') || titleLower.includes('定義') || titleLower.includes('核心') || titleLower.includes('算式')) {
    type = 'focus';
  } else {
    const types = ['flow', 'arch', 'compare', 'focus'];
    type = types[index % types.length];
  }

  if (type === 'flow') {
    return `
      <svg viewBox="0 0 290 350" class="diagram-svg">
        <rect x="15" y="15" width="260" height="85" rx="10" fill="#FFF" stroke="#DE5B37" stroke-width="2"/>
        <rect x="15" y="15" width="260" height="28" rx="10" fill="#FFF5F2"/>
        <text x="145" y="34" text-anchor="middle" font-size="13" font-weight="bold" fill="#DE5B37">① 觀念起點</text>
        ${renderSvgTextLines(l1, 145, 66, 12, "#2B3530")}

        <path d="M 145 100 L 145 118" stroke="#DE5B37" stroke-width="2"/>
        <polygon points="145,118 140,110 150,110" fill="#DE5B37"/>

        <rect x="15" y="122" width="260" height="85" rx="10" fill="#FFF" stroke="#4A5568" stroke-width="2"/>
        <rect x="15" y="122" width="260" height="28" rx="10" fill="#EDF2F7"/>
        <text x="145" y="141" text-anchor="middle" font-size="13" font-weight="bold" fill="#4A5568">② 核心推演</text>
        ${renderSvgTextLines(l2, 145, 173, 12, "#2B3530")}

        <path d="M 145 207 L 145 225" stroke="#2B6CB0" stroke-width="2"/>
        <polygon points="145,225 140,217 150,217" fill="#2B6CB0"/>

        <rect x="15" y="229" width="260" height="85" rx="10" fill="#FFF" stroke="#2B6CB0" stroke-width="2"/>
        <rect x="15" y="229" width="260" height="28" rx="10" fill="#EBF8FF"/>
        <text x="145" y="248" text-anchor="middle" font-size="13" font-weight="bold" fill="#2B6CB0">③ 應用成果</text>
        ${renderSvgTextLines(l3, 145, 280, 12, "#2B3530")}
      </svg>
    `;
  } else if (type === 'arch') {
    return `
      <svg viewBox="0 0 290 350" class="diagram-svg">
        <rect x="15" y="15" width="260" height="55" rx="10" fill="#DE5B37"/>
        <text x="145" y="49" text-anchor="middle" font-size="15" fill="#FFF" font-weight="bold">${escapeHtml(icon)} ${escapeHtml(title.slice(0, 14))}</text>

        <path d="M 145 70 L 145 105 M 145 195 L 145 225" stroke="#CBD5E0" stroke-width="2" fill="none"/>

        <rect x="15" y="105" width="260" height="90" rx="10" fill="#FFF" stroke="#CBD5E0" stroke-width="2"/>
        <rect x="15" y="105" width="260" height="28" rx="10" fill="#F7FAFC"/>
        <text x="145" y="124" text-anchor="middle" font-size="12" font-weight="bold" fill="#4A5568">🧩 核心結構與條件</text>
        ${renderSvgTextLines(l1, 145, 158, 12, "#2D3748")}

        <rect x="15" y="225" width="260" height="90" rx="10" fill="#FFF" stroke="#CBD5E0" stroke-width="2"/>
        <rect x="15" y="225" width="260" height="28" rx="10" fill="#F7FAFC"/>
        <text x="145" y="244" text-anchor="middle" font-size="12" font-weight="bold" fill="#2B6CB0">⚡ 作用邏輯與機制</text>
        ${renderSvgTextLines(l2, 145, 278, 12, "#2D3748")}
      </svg>
    `;
  } else if (type === 'compare') {
    return `
      <svg viewBox="0 0 290 350" class="diagram-svg">
        <rect x="15" y="15" width="260" height="130" rx="10" fill="#FFF" stroke="#DE5B37" stroke-width="2"/>
        <rect x="15" y="15" width="260" height="32" rx="10" fill="#FFF5F2"/>
        <text x="145" y="36" text-anchor="middle" font-size="13" font-weight="bold" fill="#DE5B37">✦ 現行模式 / 原理</text>
        ${renderSvgTextLines(l1, 145, 88, 12, "#2D3748")}

        <path d="M 130 145 L 130 175 M 160 175 L 160 145" stroke="#DE5B37" stroke-width="2" fill="none"/>
        <polygon points="130,175 125,167 135,167" fill="#DE5B37"/>
        <polygon points="160,145 155,153 165,153" fill="#DE5B37"/>

        <rect x="15" y="175" width="260" height="130" rx="10" fill="#FFF" stroke="#2B6CB0" stroke-width="2"/>
        <rect x="15" y="175" width="260" height="32" rx="10" fill="#EBF8FF"/>
        <text x="145" y="196" text-anchor="middle" font-size="13" font-weight="bold" fill="#2B6CB0">✦ 本課突破 / 特性</text>
        ${renderSvgTextLines(l2, 145, 248, 12, "#2D3748")}
      </svg>
    `;
  } else {
    return `
      <svg viewBox="0 0 290 350" class="diagram-svg">
        <circle cx="145" cy="70" r="50" fill="#FFF5F2" stroke="#DE5B37" stroke-width="2.5"/>
        <circle cx="145" cy="70" r="40" fill="#DE5B37"/>
        <text x="145" y="81" text-anchor="middle" font-size="32" fill="#FFF">${escapeHtml(icon)}</text>

        <path d="M 145 120 L 145 145 M 145 225 L 145 240" stroke="#CBD5E0" stroke-width="2"/>

        <rect x="15" y="145" width="260" height="80" rx="10" fill="#FFF" stroke="#CBD5E0" stroke-width="2"/>
        <rect x="15" y="145" width="260" height="26" rx="10" fill="#FFF5F2"/>
        <text x="145" y="162" text-anchor="middle" font-size="12" font-weight="bold" fill="#DE5B37">📐 定義與條件</text>
        ${renderSvgTextLines(l1, 145, 194, 12, "#2D3748")}

        <rect x="15" y="240" width="260" height="80" rx="10" fill="#FFF" stroke="#CBD5E0" stroke-width="2"/>
        <rect x="15" y="240" width="260" height="26" rx="10" fill="#EBF8FF"/>
        <text x="145" y="257" text-anchor="middle" font-size="12" font-weight="bold" fill="#2B6CB0">🚀 應用與效益</text>
        ${renderSvgTextLines(l2, 145, 289, 12, "#2D3748")}
      </svg>
    `;
  }
}

function formatMarkdown(text) {
  if (!text) return '';
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
  safe = safe.replace(/`(.*?)`/g, '<code>$1</code>');
  return safe;
}

function showSlide(index) {
  state.activeSlide = index;
  const s = state.deck.slides[index];
  $$('.slide-thumb').forEach((t, i) => t.classList.toggle('active', i === index));
  $('#slideStage').dataset.page = String(index + 1).padStart(2, '0');

  const iconStr = extractEmoji(s.icon);
  const dynamicSvg = renderDynamicDiagram(s, index);

  const visualCardHtml = `
    <div class="visual-diagram-container">
      ${dynamicSvg}
    </div>
  `;

  $('#slideStage').innerHTML = `
    <div class="slide-header-wrap">
      <h2><span class="slide-title-icon">${escapeHtml(iconStr)}</span> ${escapeHtml(s.title)}</h2>
    </div>
    <div class="slide-content-grid has-visual">
      <div class="slide-bullets-wrap">
        <ul>${s.bullets.map(b => `<li>${formatMarkdown(b)}</li>`).join('')}</ul>
      </div>
      ${visualCardHtml}
    </div>
  `;
  $('#speakerNotes').textContent = s.speaker_notes;
  renderMath($('#slideStage'));
  renderMath($('#speakerNotes'));
  if (s.source_pages && s.source_pages.length) {
    $('#pageRef').textContent = state.lang === 'en' ? `Page ${s.source_pages.join(', ')}` : `教材第 ${s.source_pages.join('、')} 頁`;
  } else {
    $('#pageRef').textContent = t('deck.page_ref');
  }
}

function addUserMessage(text) { const el = document.createElement('div'); el.className = 'message user'; el.innerHTML = `<div>${escapeHtml(text)}</div>`; $('#messages').append(el); scrollMessages(); }
function addAssistantMessage(data) {
  const el = document.createElement('div'); el.className = 'message assistant'; const sources = data.sources.slice(0, 3).map(s => `<div class="source"><b>第 ${s.page} 頁</b><p>${escapeHtml(s.excerpt)}</p></div>`).join('');
  const providerLabel = data.mode === 'gemini' ? 'Gemini' : (data.mode === 'openai' ? 'OpenAI' : 'Ollama');
  const formattedAnswer = formatMarkdown(data.answer).replace(/\n/g, '<br>');
  el.innerHTML = `<span class="bot-avatar">✦</span><div><p>${formattedAnswer}</p><div class="source-list"><span>回答依據 · ${providerLabel} RAG</span>${sources}</div></div>`; $('#messages').append(el); scrollMessages();
  renderMath(el);
}
function scrollMessages() { const m = $('#messages'); m.scrollTop = m.scrollHeight }
function escapeHtml(value) { const d = document.createElement('div'); d.textContent = value; return d.innerHTML }

$('#chatForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!state.user) {
    toast('請先登入帳號以開始問答', true);
    openAuthModal('login');
    return;
  }
  const input = $('#questionInput'); const question = input.value.trim(); if (!question || !state.document) return; addUserMessage(question); input.value = ''; $('#sendBtn').disabled = true;
  const enable_web_search = $('#qaWebSearch') ? $('#qaWebSearch').checked : false;
  const typing = document.createElement('div'); typing.className = 'message assistant'; typing.innerHTML = '<span class="bot-avatar">✦</span><div><p>正在檢索教材與分析中…</p></div>'; $('#messages').append(typing); scrollMessages();
  try {
    const data = await api('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document_id: state.document.id, question, enable_web_search }) });
    typing.remove();
    addAssistantMessage(data);
    await fetchCurrentUser();
  } catch (err) { typing.remove(); toast(err.message, true) } finally { $('#sendBtn').disabled = false }
});
$('#questionInput').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#chatForm').requestSubmit() } });
$$('#workspace .suggestions button').forEach(btn => btn.addEventListener('click', () => { if (!state.document) return toast('請先上傳教材', true); $('#questionInput').value = btn.textContent; $('#chatForm').requestSubmit() }));
$('#pptDownload').addEventListener('click', () => toast('正在下載 PowerPoint 簡報'));
$('#scriptDownload').addEventListener('click', () => toast('正在下載逐頁演講稿'));

// ── AI 提供者 (Provider) 切換與 UI 更新 ──
function updateProviderUI(info) {
  if (!info) return;
  state.provider = info.provider;
  if ($('#providerSelect')) $('#providerSelect').value = info.provider;
  const badges = {
    'gemini': state.lang === 'en' ? 'Gemini Cloud' : 'Gemini 雲端',
    'openai': state.lang === 'en' ? 'OpenAI Cloud' : 'OpenAI 雲端',
    'ollama_cloud': state.lang === 'en' ? 'Ollama Cloud' : 'Ollama 雲端',
    'ollama_local': state.lang === 'en' ? 'Ollama Local' : 'Ollama 本機'
  };
  const providerLabels = {
    'gemini': state.lang === 'en' ? 'Gemini Cloud' : 'Gemini 雲端',
    'openai': state.lang === 'en' ? 'OpenAI Cloud' : 'OpenAI 雲端',
    'ollama_cloud': state.lang === 'en' ? 'Ollama Cloud' : 'Ollama 雲端',
    'ollama_local': state.lang === 'en' ? 'Ollama Local' : 'Ollama 本機'
  };
  if ($('#providerBadge')) $('#providerBadge').textContent = badges[info.provider] || 'Gemini';
  if ($('#modeText')) $('#modeText').textContent = providerLabels[info.provider] || info.provider_label || badges[info.provider] || (state.lang === 'en' ? 'AI Ready' : 'AI 就緒');
}

// 頁面加載時拉取當前服務資訊與登入狀態
fetch('/api/health')
  .then(r => r.json())
  .then(x => updateProviderUI(x))
  .catch(() => { if ($('#modeText')) $('#modeText').textContent = state.lang === 'en' ? 'Disconnected' : '服務未連線'; });

$('#providerSelect')?.addEventListener('change', async (e) => {
  const newProvider = e.target.value;
  const oldProvider = state.provider;
  try {
    const data = await api('/api/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: newProvider })
    });
    updateProviderUI(data);
    const labelKey = `opt.provider.${data.provider || newProvider}`;
    const label = t(labelKey) || newProvider;
    toast(state.lang === 'en' ? `Switched AI provider to: ${label}` : `已切換 AI 模型提供者為：${label}`);
  } catch (err) {
    if ($('#providerSelect')) $('#providerSelect').value = oldProvider;
    toast(err.message, true);
  }
});

fetchCurrentUser();



// === 管理員控制台 (Admin Modal) 與 個人設定 (Profile Modal) 邏輯 ===

function updateAdminUI() {
  const isAdmin = !!(state.user && state.user.role === 'admin');
  $$('.admin-only').forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  if (isAdmin) {
    fetchPendingCount();
  } else {
    closeAdminModal();
    const adminView = $('#adminView');
    if (adminView && adminView.classList.contains('active')) {
      switchView('workspace');
    }
  }
}

async function fetchPendingCount() {
  try {
    const data = await api('/api/admin/users/pending');
    const count = data.pending_users ? data.pending_users.length : 0;
    if ($('#pendingBadge')) $('#pendingBadge').textContent = count;
    if ($('#pendingTabCount')) $('#pendingTabCount').textContent = count;
  } catch (e) {
    // 靜默處理
  }
}

function openAdminModal(tab = 'pending') {
  if (!state.user || state.user.role !== 'admin') {
    toast('僅限管理員存取', true);
    return;
  }
  switchAdminTab(tab);
  const modal = $('#adminModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAdminModal() {
  const modal = $('#adminModal');
  if (modal) modal.classList.add('hidden');
}

function switchAdminTab(tab) {
  const isPending = tab === 'pending';
  if ($('#tabPendingUsersBtn')) $('#tabPendingUsersBtn').classList.toggle('active', isPending);
  if ($('#tabAllUsersBtn')) $('#tabAllUsersBtn').classList.toggle('active', !isPending);
  if ($('#pendingUsersTab')) $('#pendingUsersTab').classList.toggle('hidden', !isPending);
  if ($('#allUsersTab')) $('#allUsersTab').classList.toggle('hidden', isPending);

  if (isPending) {
    fetchPendingUsers();
  } else {
    fetchAllUsers();
  }
}

async function fetchPendingUsers() {
  const tbody = $('#pendingUsersTbody');
  if (!tbody) return;
  const isEn = state.lang === 'en';
  tbody.innerHTML = `<tr><td colspan="4" class="text-center muted">${isEn ? 'Loading...' : '載入中…'}</td></tr>`;

  try {
    const data = await api('/api/admin/users/pending');
    const users = data.pending_users || [];
    fetchPendingCount();

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center muted">${isEn ? 'No pending account registrations' : '尚無待審核之帳號'}</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><b>${escapeHtml(u.username)}</b></td>
        <td><span class="role-chip ${u.role}">${u.role === 'admin' ? (isEn ? 'Admin' : '管理員') : (isEn ? 'User' : '一般用戶')}</span></td>
        <td>${escapeHtml(u.created_at || (isEn ? 'Recent' : '最近'))}</td>
        <td>
          <button class="btn-sm btn-approve" data-review="approve" data-user="${escapeHtml(u.username)}">${isEn ? '✓ Approve' : '✓ 核准'}</button>
          <button class="btn-sm btn-reject" data-review="reject" data-user="${escapeHtml(u.username)}">${isEn ? '✗ Reject' : '✗ 拒絕'}</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${isEn ? 'Load failed' : '載入失敗'}: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function formatLastLoginTime(timestamp) {
  if (!timestamp) return state.lang === 'en' ? 'Never' : '尚未上記錄';
  try {
    const d = new Date(timestamp.replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return timestamp;
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return state.lang === 'en' ? 'Just now' : '剛剛';
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return state.lang === 'en' ? `${mins}m ago` : `${mins} 分鐘前`;
    }
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return state.lang === 'en' ? `${hours}h ago` : `${hours} 小時前`;
    }
    return timestamp.slice(0, 16);
  } catch (e) {
    return timestamp;
  }
}

async function fetchAllUsers() {
  const tbody = $('#allUsersTbody');
  const cardsWrapper = $('#allUsersCards');
  if (!tbody) return;
  const isEn = state.lang === 'en';
  tbody.innerHTML = `<tr><td colspan="8" class="text-center muted">${isEn ? 'Loading...' : '載入中…'}</td></tr>`;
  if (cardsWrapper) cardsWrapper.innerHTML = `<div class="text-center muted">${isEn ? 'Loading...' : '載入中…'}</div>`;

  try {
    const data = await api('/api/admin/users/list');
    let users = data.users || [];

    // 依據「管理員優先」+「上次上線時間 (新到舊)」進行排序
    users.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;

      const timeA = a.last_login_at ? new Date(a.last_login_at.replace(' ', 'T') + 'Z').getTime() : 0;
      const timeB = b.last_login_at ? new Date(b.last_login_at.replace(' ', 'T') + 'Z').getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;

      return a.id - b.id;
    });

    const total = users.length;
    const pending = users.filter(u => u.status === 'pending').length;
    const admins = users.filter(u => u.role === 'admin').length;
    if ($('#metricTotalUsers')) $('#metricTotalUsers').textContent = total;
    if ($('#metricPendingUsers')) $('#metricPendingUsers').textContent = pending;
    if ($('#metricAdminUsers')) $('#metricAdminUsers').textContent = admins;

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center muted">${isEn ? 'No user records found' : '系統尚無用戶紀錄'}</td></tr>`;
      if (cardsWrapper) cardsWrapper.innerHTML = `<div class="text-center muted">${isEn ? 'No user records found' : '系統尚無用戶紀錄'}</div>`;
      return;
    }

    const tableRows = [];
    const mobileCards = [];

    users.forEach(u => {
      let actionButtons = '';
      if (u.status === 'pending') {
        actionButtons = `
          <button class="btn-sm btn-approve" data-review="approve" data-user="${escapeHtml(u.username)}">${isEn ? '✓ Approve' : '✓ 核准'}</button>
          <button class="btn-sm btn-reject" data-review="reject" data-user="${escapeHtml(u.username)}">${isEn ? '✗ Reject' : '✗ 拒絕'}</button>
          <button class="btn-sm btn-reject" data-deleteuser="${escapeHtml(u.username)}">${isEn ? 'Delete' : '刪除'}</button>
        `;
      } else {
        actionButtons = `
          ${u.role === 'user' ? `<button class="btn-sm btn-action" data-role="admin" data-user="${escapeHtml(u.username)}">${isEn ? 'Promote Admin' : '升為管理員'}</button>` : `<button class="btn-sm btn-warning" data-role="user" data-user="${escapeHtml(u.username)}">${isEn ? 'Demote User' : '降為用戶'}</button>`}
          <button class="btn-sm btn-action" data-resetpass="${escapeHtml(u.username)}">${isEn ? 'Reset Pass' : '重置密碼'}</button>
          <button class="btn-sm btn-reject" data-deleteuser="${escapeHtml(u.username)}">${isEn ? 'Delete' : '刪除'}</button>
        `;
      }

      const tierKey = u.tier || (u.role === 'admin' ? 'admin' : 'teacher_pro');
      const tierSelect = u.role === 'admin'
        ? `<span style="font-size:11px; font-weight:600; color:#d97706;">${isEn ? '👑 Unlimited' : '👑 無限版'}</span>`
        : `
        <select class="admin-tier-select" data-user="${escapeHtml(u.username)}" style="font-size:11px; padding:2px 6px; border-radius:6px; border:1px solid var(--line); background:var(--paper);">
          <option value="teacher_trial" ${tierKey === 'teacher_trial' ? 'selected' : ''}>${isEn ? '🎓 Trial' : '🎓 試用版'}</option>
          <option value="teacher_pro" ${tierKey === 'teacher_pro' ? 'selected' : ''}>${isEn ? '⭐ Pro' : '⭐ 專業版'}</option>
          <option value="institution" ${tierKey === 'institution' ? 'selected' : ''}>${isEn ? '🏫 Institution' : '🏫 機構版'}</option>
        </select>
      `;

      const roleBadge = u.role === 'admin' ? (isEn ? '👑 Admin' : '👑 管理員') : (isEn ? 'User' : '用戶');
      const statusBadge = u.status === 'approved'
        ? (isEn ? 'Approved' : '已開通')
        : (u.status === 'pending' ? (isEn ? '⏳ Pending' : '⏳ 待審核') : (isEn ? 'Rejected' : '已拒絕'));

      const qs = u.quota_summary || { deck_today: 0, deck_limit: 3, ask_today: 0, ask_limit: 10, deck_total: 0, ask_total: 0, is_unlimited: false };
      
      const dailyUsageHtml = `
        <div style="font-size:11px; line-height:1.4;">
          <div>📊 ${isEn ? 'Decks' : '簡報'}: <b>${qs.deck_today}</b> / ${qs.is_unlimited ? '∞' : qs.deck_limit} ${isEn ? 'items' : '份'}</div>
          <div>💬 ${isEn ? 'Q&A' : '提問'}: <b>${qs.ask_today}</b> / ${qs.is_unlimited ? '∞' : qs.ask_limit} ${isEn ? 'times' : '次'}</div>
        </div>
      `;

      const totalUsageHtml = `
        <div style="font-size:11px; line-height:1.4; color: var(--muted);">
          <div>📊 ${isEn ? 'Decks' : '簡報'}: <b>${qs.deck_total}</b> ${isEn ? 'total' : '份'}</div>
          <div>💬 ${isEn ? 'Q&A' : '提問'}: <b>${qs.ask_total}</b> ${isEn ? 'total' : '次'}</div>
        </div>
      `;

      const lastLoginHtml = `<span style="font-size:11px; color: var(--muted);">${formatLastLoginTime(u.last_login_at)}</span>`;

      tableRows.push(`
        <tr>
          <td>${u.id}</td>
          <td>
            <b>${escapeHtml(u.username)}</b>
            <div style="margin-top: 4px; display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
              <span class="status-chip ${u.status}">${statusBadge}</span>
              <span class="role-chip ${u.role}">${roleBadge}</span>
            </div>
          </td>
          <td>${tierSelect}</td>
          <td>${dailyUsageHtml}</td>
          <td>${totalUsageHtml}</td>
          <td>${lastLoginHtml}</td>
          <td><span style="font-size:11px; color:var(--muted);">${escapeHtml(u.created_at || '-')}</span></td>
          <td>${actionButtons}</td>
        </tr>
      `);

      mobileCards.push(`
        <div class="admin-user-card">
          <div class="user-card-header">
            <div>
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <b class="username">${escapeHtml(u.username)}</b>
                <small class="user-id">#${u.id}</small>
                <div style="margin-left: 2px;">${tierSelect}</div>
              </div>
            </div>
            <div class="badges">
              <span class="status-chip ${u.status}">${statusBadge}</span>
              <span class="role-chip ${u.role}">${roleBadge}</span>
            </div>
          </div>
          <div class="user-card-body">
            <div class="info-item">
              <span class="lbl">${isEn ? 'Daily Usage' : '今日使用 / 限額'}</span>
              <div>${dailyUsageHtml}</div>
            </div>
            <div class="info-item">
              <span class="lbl">${isEn ? 'Cumulative' : '累計總使用量'}</span>
              <div>${totalUsageHtml}</div>
            </div>
            <div class="info-item">
              <span class="lbl">${isEn ? 'Last Active' : '上次上線時間'}</span>
              <div>${lastLoginHtml}</div>
            </div>
            <div class="info-item">
              <span class="lbl">${isEn ? 'Created At' : '帳號建立時間'}</span>
              <div style="font-size:11px; color:var(--muted);">${escapeHtml(u.created_at || '-')}</div>
            </div>
          </div>
          <div class="user-card-actions">
            ${actionButtons}
          </div>
        </div>
      `);
    });

    tbody.innerHTML = tableRows.join('');
    if (cardsWrapper) cardsWrapper.innerHTML = mobileCards.join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${isEn ? 'Load failed' : '載入失敗'}: ${escapeHtml(err.message)}</td></tr>`;
    if (cardsWrapper) cardsWrapper.innerHTML = `<div class="text-center text-danger">${isEn ? 'Load failed' : '載入失敗'}: ${escapeHtml(err.message)}</div>`;
  }
}

// 代理管理員對話框內的變更層級 (Tier) 動作
$('#adminView')?.addEventListener('change', async (e) => {
  const select = e.target.closest('.admin-tier-select');
  if (select) {
    const username = select.dataset.user;
    const tier = select.value;
    try {
      const res = await api('/api/admin/users/tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, tier })
      });
      toast(res.message || '用戶層級更新成功');
      fetchAllUsers();
    } catch (err) {
      toast(err.message, true);
    }
  }
});

// 代理管理員對話框內的按鈕動作
$('#adminView')?.addEventListener('click', async (e) => {


  const reviewBtn = e.target.closest('[data-review]');
  if (reviewBtn) {
    const action = reviewBtn.dataset.review;
    const username = reviewBtn.dataset.user;
    try {
      const res = await api('/api/admin/users/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action })
      });
      toast(res.message);
      fetchAllUsers();
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  const roleBtn = e.target.closest('[data-role]');
  if (roleBtn) {
    const role = roleBtn.dataset.role;
    const username = roleBtn.dataset.user;
    try {
      const res = await api('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role })
      });
      toast(res.message);
      fetchAllUsers();
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  const resetBtn = e.target.closest('[data-resetpass]');
  if (resetBtn) {
    const username = resetBtn.dataset.resetpass;
    const promptMsg = state.lang === 'en' ? `Enter new password for user [${username}]:` : `請輸入為使用者 [${username}] 設定的新密碼：`;
    const newPassword = prompt(promptMsg);
    if (!newPassword) return;
    if (newPassword.length < 4) {
      toast(state.lang === 'en' ? 'New password must be at least 4 characters' : '新密碼長度至少需 4 個字元', true);
      return;
    }
    try {
      const res = await api('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, new_password: newPassword })
      });
      toast(res.message);
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }

  const deleteBtn = e.target.closest('[data-deleteuser]');
  if (deleteBtn) {
    const username = deleteBtn.dataset.deleteuser;
    const confirmMsg = state.lang === 'en' ? `Are you sure you want to delete user [${username}]? This action cannot be undone.` : `確定要刪除使用者 [${username}] 嗎？此操作無法復原。`;
    if (!confirm(confirmMsg)) return;
    try {
      const res = await api(`/api/admin/users/${username}`, { method: 'DELETE' });
      toast(res.message);
      fetchAllUsers();
    } catch (err) {
      toast(err.message, true);
    }
    return;
  }
});

// Admin nav button now uses data-view='admin' with switchView
$('#closeAdminModalBtn')?.addEventListener('click', closeAdminModal);
$('#tabPendingUsersBtn')?.addEventListener('click', () => switchAdminTab('pending'));
$('#tabAllUsersBtn')?.addEventListener('click', () => switchAdminTab('all'));

// --- 新增帳號 (管理員開通) Modal 邏輯 ---
function openCreateUserModal() {
  const modal = $('#createUserModal');
  if (modal) {
    modal.classList.remove('hidden');
    $('#createUsernameInput').value = '';
    $('#createPasswordInput').value = '';
    if ($('#createUserError')) $('#createUserError').classList.add('hidden');
  }
}

function closeCreateUserModal() {
  const modal = $('#createUserModal');
  if (modal) modal.classList.add('hidden');
}

$('#openCreateUserModalBtn')?.addEventListener('click', openCreateUserModal);
$('#closeCreateUserModalBtn')?.addEventListener('click', closeCreateUserModal);
$('#createUserModal')?.addEventListener('click', (e) => {
  if (e.target === $('#createUserModal')) closeCreateUserModal();
});

$('#createRoleSelect')?.addEventListener('change', (e) => {
  const isAdmin = e.target.value === 'admin';
  const tierWrapper = $('#createTierWrapper');
  if (tierWrapper) {
    tierWrapper.style.display = isAdmin ? 'none' : 'block';
  }
});

$('#createUserAdminForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = $('#createUsernameInput').value.trim();
  const password = $('#createPasswordInput').value.trim();
  const role = $('#createRoleSelect').value;
  const tier = $('#createTierSelect').value;
  const errEl = $('#createUserError');

  if (errEl) errEl.classList.add('hidden');

  try {
    const res = await api('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role, tier })
    });
    toast(res.message || '帳號建立成功');
    closeCreateUserModal();
    fetchAllUsers();
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } else {
      toast(err.message, true);
    }
  }
});

// --- 個人設定 Modal 與修改密碼邏輯 ---

function openProfileModal() {
  if (!state.user) {
    openAuthModal('login');
    return;
  }
  const textEl = $('#profileModalUserText');
  if (textEl) textEl.innerHTML = `目前的登入帳號：<b>${escapeHtml(state.user.username)}</b> (${state.user.role === 'admin' ? '👑 管理員' : '一般用戶'})`;
  if ($('#changePassError')) $('#changePassError').classList.add('hidden');
  if ($('#changePassSuccess')) $('#changePassSuccess').classList.add('hidden');
  const modal = $('#profileModal');
  if (modal) modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = $('#profileModal');
  if (modal) modal.classList.add('hidden');
}

$('#closeProfileModalBtn')?.addEventListener('click', closeProfileModal);
$('#profileModal')?.addEventListener('click', (e) => {
  if (e.target === $('#profileModal')) closeProfileModal();
});

$('#profileLogoutBtn')?.addEventListener('click', () => {
  closeProfileModal();
  logoutUser(true);
});

$('#changePasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPassword = $('#oldPasswordInput').value;
  const newPassword = $('#newPasswordInput').value;
  const errorEl = $('#changePassError');
  const successEl = $('#changePassSuccess');

  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  try {
    const res = await api('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    successEl.textContent = res.message;
    successEl.classList.remove('hidden');
    $('#oldPasswordInput').value = '';
    $('#newPasswordInput').value = '';
    toast(state.lang === 'en' ? 'Password changed successfully' : '密碼已成功修改');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});

// 頁面初始化語系
setLanguage(state.lang);

// === Agent Ops Command Center Logic (Chat Stream UX) ===
const DEPT_WELCOME_CONFIGS = {
  academic: {
    avatar: '🎓',
    title: { 'zh-TW': '💡 歡迎與教務小老師對話', 'en': '💡 Welcome to Academic & Lesson Planning Tutor' },
    desc: { 'zh-TW': '請下達備課或教學任務（例如：「設計牛頓運動定律 45 分鐘教案」、「出 5 題高中生物題」或「生成逐頁演講稿」）。', 'en': 'Enter lesson plan or teaching tasks (e.g. "Design a 45-min Physics plan", "Generate 5 Biology quiz questions").' },
    suggestions: [
      { text: '🎓 45 分鐘教案設計', query: '請幫我設計一份 45 分鐘國中物理「牛頓第二運動定律」的備課教案與觀念大綱' },
      { text: '📝 5 題生物選擇題與解析', query: '請幫我出 5 題關於「光合作用與呼吸作用」的高中生物選擇題，包含解答與觀念解析' },
      { text: '🎤 簡報逐頁演講稿', query: '請幫我生成這份簡報的逐頁演講稿與備課講義' }
    ]
  },
  marketing: {
    avatar: '🚀',
    title: { 'zh-TW': '🚀 歡迎與營銷推廣負責人對話', 'en': '🚀 Welcome to Marketing & Promotion Lead' },
    desc: { 'zh-TW': '請下達推廣或文案任務（例如：「撰寫微課教學 FB 貼文」、「梳理課程核心賣點」或「撰寫教學心得文章」）。', 'en': 'Enter marketing tasks (e.g. "Write an FB promo post", "Summarize course pitch features").' },
    suggestions: [
      { text: '📱 FB / Threads 社群推廣貼文', query: '請幫我產出一篇介紹微課教學與防幻覺 AI 助手的 FB 社群推廣文案' },
      { text: '🎯 梳理課程亮點與賣點', query: '請幫我梳理這份數位課程的核心賣點與亮點介紹' },
      { text: '✍️ 撰寫教學心得體驗文章', query: '請幫我撰寫一篇分享翻轉課堂實務心得的教學經驗文章' }
    ]
  },
  operations: {
    avatar: '🏫',
    title: { 'zh-TW': '🏫 歡迎與教務行政特助對話', 'en': '🏫 Welcome to Ops & Institution Admin' },
    desc: { 'zh-TW': '請下達行政或權限查詢任務（例如：「查詢學校團體合約」、「檢視團隊席位配額」或「查詢個人每日限額」）。', 'en': 'Enter admin tasks (e.g. "Check school contract terms", "View team seat allocation").' },
    suggestions: [
      { text: '🏫 查詢機構與學校團體合約', query: '查詢學校與機構團體授權合約與成員開通方式' },
      { text: '📊 檢視團隊席位分配與權限', query: '檢視團隊成員席位分配與權限開通規則' },
      { text: '📋 查詢個人每日配額與等級', query: '查詢我目前的會員等級與每日使用配額' }
    ]
  },
  devops: {
    avatar: '🛠️',
    title: { 'zh-TW': '🛠️ 歡迎與技術維護工程師對話', 'en': '🛠️ Welcome to DevOps & Maintenance Engineer' },
    desc: { 'zh-TW': '請下達維護或診斷任務（例如：「排查 Railway 部署狀態」、「診斷 Linux OOM 記憶體效能」或「檢視 JWT 驗證」）。', 'en': 'Enter devops tasks (e.g. "Check Railway deploy health", "Diagnose Linux Kernel OOM memory").' },
    suggestions: [
      { text: '🛠️ 排查 Railway 雲端部署狀態', query: '排查本機與 Railway 雲端部署運行狀態與環境設定' },
      { text: '⚡ 診斷 Linux Kernel OOM 效能', query: '診斷 Linux Kernel OOM 記憶體排查與系統效能最佳化' },
      { text: '🔑 檢視 JWT 驗證與過期機制', query: '檢視系統 JWT 身份驗證機制與 Token 過期設定' }
    ]
  }
};

function switchAgentDeptWelcome(deptKey) {
  const lang = state.lang || 'zh-TW';
  const container = $('#agentMessages');

  // 若重複點擊當前已鎖定的部門，則切換取消指定分流，回到全域智慧導航模式
  if (state.activeDept === deptKey) {
    state.activeDept = null;
    renderDeptActiveIndicators();

    if (container) {
      const sysMsgEl = document.createElement('div');
      sysMsgEl.className = 'message assistant system-dept-switch';
      sysMsgEl.style.borderLeft = '4px solid #10b981';
      sysMsgEl.style.background = 'rgba(16, 185, 129, 0.05)';
      sysMsgEl.innerHTML = `
        <span class="bot-avatar" style="background: #10b981;">🌐</span>
        <div>
          <div class="agent-msg-meta">
            <span class="agent-dept-chip" style="background: rgba(16, 185, 129, 0.2); color: #059669;">🌐 ${lang === 'en' ? 'Omni-Routing Mode' : '全域智慧導航模式'}</span>
          </div>
          <p style="margin: 4px 0 0 0; color: var(--fg); font-weight: 500;">
            ${lang === 'en' ? 'Department restriction cleared. Orchestrator will now auto-route all queries dynamically.' : '已取消指定部門分流！系統現已切換回【全域智慧導航模式】，將自動辨識問題意圖並分發給最適切的部門。'}
          </p>
        </div>
      `;
      container.appendChild(sysMsgEl);
      container.scrollTop = container.scrollHeight;
    }
    toast(lang === 'en' ? 'Switched to Omni-Routing Mode' : '已取消指定分流，回到全域智慧導航模式！');
    return;
  }

  // 否則，鎖定指定部門
  state.activeDept = deptKey;
  renderDeptActiveIndicators();
  const cfg = DEPT_WELCOME_CONFIGS[deptKey] || DEPT_WELCOME_CONFIGS.academic;
  if (!container) return;

  const titleText = cfg.title[lang] || cfg.title['zh-TW'];
  const descText = cfg.desc[lang] || cfg.desc['zh-TW'];
  const sugHtml = cfg.suggestions.map(s => `<button type="button" class="agent-sug-btn" data-query="${escapeHtml(s.query)}">${escapeHtml(s.text)}</button>`).join('');

  // 建立接續對話的部門切換指示卡片 (不覆蓋歷史訊息，直接接續對話流)
  const sysMsgEl = document.createElement('div');
  sysMsgEl.className = 'message assistant system-dept-switch';
  sysMsgEl.style.borderLeft = '4px solid #6366f1';
  sysMsgEl.style.background = 'rgba(99, 102, 241, 0.05)';
  sysMsgEl.innerHTML = `
    <span class="bot-avatar" style="background: #6366f1;">${cfg.avatar}</span>
    <div>
      <div class="agent-msg-meta">
        <span class="agent-dept-chip" style="background: rgba(99, 102, 241, 0.2); color: #4f46e5;">🎯 ${escapeHtml(titleText)}</span>
      </div>
      <p style="margin: 4px 0 8px 0; color: var(--fg); font-weight: 500;">${escapeHtml(descText)}</p>
      <div class="suggestions" style="margin-top: 8px;">${sugHtml}</div>
    </div>
  `;

  container.appendChild(sysMsgEl);
  container.scrollTop = container.scrollHeight;

  const deptNames = {
    academic: lang === 'en' ? '🎓 Academic Tutor' : '🎓 教務小老師',
    marketing: lang === 'en' ? '🚀 Marketing Lead' : '🚀 營銷推廣負責人',
    operations: lang === 'en' ? '🏫 Ops Admin' : '🏫 教務行政特助',
    devops: lang === 'en' ? '🛠️ DevOps Engineer' : '🛠️ 技術維護工程師'
  };
  const label = deptNames[deptKey] || deptNames.academic;
  toast(lang === 'en' ? `Connected to ${label}` : `已切換至【${label}】專屬對話視窗！`);
}

document.addEventListener('click', (e) => {
  const deptBtn = e.target.closest('.dept-chat-btn');
  if (deptBtn && deptBtn.dataset.dept) {
    if (deptBtn.disabled) return;
    switchAgentDeptWelcome(deptBtn.dataset.dept);
  }

  const btn = e.target.closest('.agent-sug-btn, .skill-chip-btn');
  if (btn && btn.dataset.query) {
    const input = $('#agentQueryInput');
    if (input) input.value = btn.dataset.query;
    dispatchAgentTask(btn.dataset.query);
  }

  const copyBtn = e.target.closest('.agent-copy-btn');
  if (copyBtn && copyBtn.dataset.copy) {
    navigator.clipboard.writeText(copyBtn.dataset.copy).then(() => {
      toast(state.lang === 'en' ? 'Copied to clipboard!' : '已複製內容至剪貼簿！');
    });
  }
});

$('#agentForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#agentQueryInput');
  const query = input?.value?.trim();
  if (query) {
    dispatchAgentTask(query);
    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }
  }
});

$('#agentQueryInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $('#agentForm')?.requestSubmit();
  }
});

['agentQueryInput', 'questionInput'].forEach(id => {
  const el = $(`#${id}`);
  if (el) {
    el.addEventListener('input', () => {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    });
  }
});

async function dispatchAgentTask(query) {
  const isEn = state.lang === 'en';
  if (!state.user) {
    toast(isEn ? 'Please log in to use the AI Agent Assistant' : '請先登入帳號以開始問答與使用備課助手', true);
    openAuthModal('login');
    return;
  }

  if (!state.agentHistory) state.agentHistory = [];

  const container = $('#agentMessages');
  const sendBtn = $('#agentSendBtn');
  const queryInput = $('#agentQueryInput');
  const platform = 'FB / 社群媒體';

  if (queryInput) queryInput.value = '';
  if (!container) return;

  // 紀錄對話歷程 (User Turn)
  state.agentHistory.push({ role: 'user', content: query });

  // 1. Append User Message Bubble
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'message user';
  userMsgEl.innerHTML = `<div><b>${escapeHtml(query)}</b></div>`;
  container.appendChild(userMsgEl);

  // 2. Append Assistant Loading Bubble
  const assistantMsgEl = document.createElement('div');
  assistantMsgEl.className = 'message assistant';
  assistantMsgEl.innerHTML = `
    <span class="bot-avatar">✦</span>
    <div>
      <div class="agent-msg-meta">
        <span class="agent-dept-chip">${isEn ? '⏳ Dispatching...' : '⏳ 正在分發...'}</span>
      </div>
      <p style="color: var(--muted); margin: 0;">${isEn ? 'Orchestrator is routing task to the target department and executing Skill...' : 'Orchestrator 正在將指令導航至對應部門並調用 Skill 處理，請稍候...'}</p>
    </div>
  `;
  container.appendChild(assistantMsgEl);
  container.scrollTop = container.scrollHeight;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const res = await api('/api/agent/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        platform,
        target_department: state.activeDept || 'academic',
        history: state.agentHistory.slice(-10)
      })
    });

    const dept = res.department ? res.department.toUpperCase() : 'GENERAL';
    const skill = res.matched_skill || 'general';
    const data = res.data || {};
    const text = (typeof data === 'object' ? (data.output_text || data.copywriting || JSON.stringify(data, null, 2)) : String(data)) || res.message || (isEn ? 'Task completed.' : '任務完成。');

    // 紀錄對話歷程 (Assistant Turn)
    state.agentHistory.push({ role: 'assistant', content: text });

    const deptLabels = {
      'ACADEMIC': isEn ? '🎓 Academic & Teaching' : '🎓 教務教學部',
      'OPERATIONS': isEn ? '📋 Operations & Admin' : '📋 營運與行政部',
      'DEVOPS': isEn ? '🛠️ DevOps & Infra' : '🛠️ 技術維護部',
      'MARKETING': isEn ? '🚀 Marketing & Sales' : '🚀 市場與營銷部'
    };
    const deptLabel = deptLabels[dept] || (isEn ? `🎯 Dept: ${dept}` : `🎯 部門: ${dept}`);

    // 3. Replace Loading with Final Assistant Response Bubble
    const showPptxBtn = (dept === 'ACADEMIC' || dept === 'GENERAL');
    assistantMsgEl.innerHTML = `
      <span class="bot-avatar">✦</span>
      <div>
        <div class="agent-msg-meta">
          <span class="agent-dept-chip">${deptLabel}</span>
          <span class="agent-skill-chip">⚡ Skill: ${skill}</span>
        </div>
        <p class="agent-output-text" style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(text)}</p>
        <div class="agent-action-bar" style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="agent-action-btn agent-copy-btn" data-copy="${escapeHtml(text)}">${isEn ? '📋 Copy Content' : '📋 複製內容'}</button>
          ${showPptxBtn ? `<button type="button" class="agent-action-btn agent-pptx-btn" data-query="${escapeHtml(query)}">${isEn ? '📄 Import to Material Parsing' : '📄 導入教材解析'}</button>` : ''}
        </div>
      </div>
    `;

    renderMath(assistantMsgEl);

    toast(isEn ? `Task completed by ${deptLabel}` : `Agent 任務已由 ${deptLabel} 順利完成`);
    await fetchCurrentUser();
  } catch (err) {
    assistantMsgEl.innerHTML = `
      <span class="bot-avatar" style="background: #f87171; color: #fff;">!</span>
      <div>
        <div class="agent-msg-meta">
          <span class="agent-dept-chip" style="background: rgba(239, 68, 68, 0.1); color: #dc2626;">${isEn ? '🔴 Dispatch Failed' : '🔴 處理失敗'}</span>
        </div>
        <p style="color: #dc2626; margin: 0;">❌ ${isEn ? 'Error:' : '錯誤：'}${escapeHtml(err.message)}</p>
      </div>
    `;
    toast(err.message, true);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    container.scrollTop = container.scrollHeight;
  }
}

function extractCleanDocTitle(query, content) {
  // 1. 優先匹配專有名詞引號內的主題（如：「牛頓第二運動定律」、「光合作用與呼吸作用」）
  const quoteMatch = (query || '').match(/[「『"']([^「」『』"']{2,25})[」』"']/);
  if (quoteMatch && quoteMatch[1].trim()) {
    return quoteMatch[1].trim();
  }

  // 2. 掃描 AI 產出內容的前 8 列，萃取 Markdown 大綱標題 (# 主題 或 **主題**)
  if (content) {
    const lines = content.split('\n').slice(0, 8);
    for (let line of lines) {
      line = line.trim();
      const headerMatch = line.match(/^(?:#+\s*|\*\*)([^\n\*#]{2,30})(?:\*\*|\n)?/);
      if (headerMatch && headerMatch[1].trim()) {
        let t = headerMatch[1].trim().replace(/[\\/:*?"<>|]/g, '');
        t = t.replace(/^(備課教案|教案大綱|教案|備課大綱|課程大綱|教學主題)[:：\s]*/g, '');
        if (t.length >= 2 && t.length <= 25 && !t.includes('請幫我')) return t;
      }
    }
  }

  // 3. 提問動詞與贅字剝離演算法
  let clean = (query || 'AI_備課教案').trim();
  clean = clean.replace(/^(請|幫我|請幫我|需要|設計|撰寫|產出|產生|寫一篇|出\s*\d+\s*題|關於|查詢)+/g, '');
  clean = clean.replace(/(的一份|一份|關於)+/g, '');
  clean = clean.replace(/(的備課教案與觀念大綱|的備課教案|的教案大綱|教案大綱|教案|的宣傳文案|推廣文案|的教學心得文章|教學經驗文章|選擇題與解析|選擇題|大綱)$/g, '');
  clean = clean.replace(/[「」『』""'']/g, '');

  clean = clean.trim();
  if (clean.length > 20) {
    clean = clean.split(/(的|與|及|包含|包含解答)/)[0];
  }

  return clean.slice(0, 20).trim() || 'AI_備課教材';
}

// 處理 Agent 產出卡片的操作按鈕 (將生成結果當成教材導入，切換至教材解析頁面並顯示解析等待畫面)
document.addEventListener('click', async (e) => {
  const pptxBtn = e.target.closest('.agent-pptx-btn');
  if (pptxBtn) {
    const isEn = state.lang === 'en';
    const topic = pptxBtn.getAttribute('data-query') || 'AI_備課教案';
    const msgBox = pptxBtn.closest('.message');
    const content = msgBox ? msgBox.querySelector('.agent-output-text')?.textContent || '' : '';

    if (!content) {
      switchView('workspace');
      toast(isEn ? 'Switched to Material Parsing' : '已切換至【📄 教材解析】！');
      return;
    }

    // 1. 先切換至【📄 教材解析】頁面
    switchView('workspace');

    // 2. 觸發標準教材解析中的全螢幕/等待動畫畫面
    loading(
      true,
      isEn ? 'Parsing & Indexing Material...' : '正在解析與索引備課教材中...',
      isEn ? 'AI is chunking markdown content, extracting LaTeX formulas, and indexing knowledge vector database...' : '系統正在切割 Markdown 教案段落、建立 LaTeX 數學公式與轉譯知識向量庫，請稍候...'
    );

    try {
      // 3. 提取精簡標題，呼叫後端 API 將生成結果導入為 Document
      const cleanTitle = extractCleanDocTitle(topic, content);
      const doc = await api('/api/documents/import_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle, content: content })
      });

      // 4. 設定已上傳/解析完成的 Document 狀態
      setDocument(doc);

      const fileCard = $('#fileCard');
      if (fileCard) fileCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      toast(isEn
        ? '🎉 Material imported successfully! Proceed with standard parsing and lesson design.'
        : '🎉 已將生成結果成功導入為教材！已為您完成解析並進入教材工作區。'
      );
    } catch (err) {
      toast(err.message || (isEn ? 'Import failed' : '導入教材失敗'), true);
    } finally {
      loading(false);
    }
    return;
  }
});


