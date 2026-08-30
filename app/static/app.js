const state = {
  document: null,
  deck: null,
  activeSlide: 0,
  user: null,
  provider: null,
  lang: localStorage.getItem('app_lang') || 'zh-TW'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const translations = {
  'zh-TW': {
    'nav.brand': '課伴<small>LESSONFLOW (Alpha)</small>',
    'nav.workspace': '工作台',
    'nav.deck': '我的簡報',
    'nav.chat': '文件問答',
    'nav.profile': '個人帳號設定',
    'nav.admin': '管理員控制台',
    'nav.agent': 'Agent 指揮所',
    'nav.crumb_create': '建立新課程',
    'nav.crumb_workspace': '工作台',
    'nav.crumb_deck': '簡報檢視',
    'nav.crumb_chat': '教材 AI 助手',
    'nav.crumb_admin': '管理員控制台',
    'nav.crumb_agent': 'Agent 指揮所',
    'nav.crumb_profile': '個人帳號設定',
    'agent.eyebrow': '多部門 AI 團隊動態指揮',
    'agent.title': '🤖 Agent 指揮所',
    'agent.subtitle': '整合 CompanyRouter 自適應分流與容錯機制，支援跨部門 AI 團隊動態調度、任務派發與技能監控。',
    'agent.metric_depts': '4 大部門',
    'agent.metric_depts_sub': '教務 · 行政 · 技術 · 行銷',
    'agent.metric_skills': '5 個 Skills',
    'agent.metric_skills_sub': '外掛式動態註冊表 (Registry)',
    'agent.metric_router': 'CompanyRouter',
    'agent.metric_router_sub': '意圖自適應分流與容錯',
    'agent.dept_status_active': '🟢 服務中',
    'agent.dept_academic_title': '教務教學部',
    'agent.dept_academic_role': 'Lesson Flow 小老師',
    'agent.dept_academic_desc': '負責教材解析、問答流調優、簡報大綱與逐頁演講稿生成。',
    'agent.dept_ops_title': '營運與行政部',
    'agent.dept_ops_role': '事務負責人',
    'agent.dept_ops_desc': '負責使用者身份驗證 (JWT)、每日限額 (Quota) 管理與系統規則。',
    'agent.dept_devops_title': '技術維護部',
    'agent.dept_devops_role': '技術維護工程師',
    'agent.dept_devops_desc': '負責 Railway 部署診斷、OOM 記憶體排查、Volume 與 AI Provider 設定。',
    'agent.dept_mkt_title': '市場與營銷部',
    'agent.dept_mkt_role': '營銷推廣負責人',
    'agent.dept_mkt_desc': '負責 SaaS 商業化模式、產品賣點包裝、FB/Threads 社群文案與 SEO。',
    'agent.dept_mkt_platform_label': '文案推廣平台：',
    'agent.welcome_title': '🤖 歡迎使用 Agent 指揮所',
    'agent.welcome_desc': '輸入任何任務指令，CompanyRouter 會自動辨識意圖並分發至教務、行政、技術或行銷部門處理。',
    'agent.sug_1': '🎓 說明牛頓第二定律大綱',
    'agent.sug_2': '📋 查詢每日 Quota 配額',
    'agent.sug_3': '🛠️ 排查 Railway OOM 錯誤',
    'agent.sug_4': '🚀 撰寫 Self-RAG 宣傳文案',
    'agent.placeholder': '向全域 Orchestrator 下達任務指令 (例: \'排查 Railway 部署錯誤\' 或 \'寫一篇 FB 貼文\')...',
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
    'admin.metric_total': '系統總帳號數',
    'admin.metric_pending': '待開通審核',
    'admin.metric_admin': '系統管理員',
    'admin.th_id': 'ID',
    'admin.th_username': '帳號名稱',
    'admin.th_role': '角色',
    'admin.th_status': '審核狀態',
    'admin.th_created': '建立時間',
    'admin.th_actions': '管理操作',
    'admin.loading': '載入中…',

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
    'nav.workspace': 'Workspace',
    'nav.deck': 'My Decks',
    'nav.chat': 'PDF Chat',
    'nav.profile': 'Account Settings',
    'nav.admin': 'Admin Console',
    'nav.agent': 'Agent Ops',
    'nav.crumb_create': 'Create Course',
    'nav.crumb_workspace': 'Workspace',
    'nav.crumb_deck': 'Deck View',
    'nav.crumb_chat': 'Lesson Assistant',
    'nav.crumb_admin': 'Admin Console',
    'nav.crumb_agent': 'Agent Ops Center',
    'nav.crumb_profile': 'Account Settings',
    'agent.eyebrow': 'Multi-Department AI Orchestration',
    'agent.title': '🤖 Agent Ops Command Center',
    'agent.subtitle': 'Integrated with CompanyRouter for adaptive intent routing and fault tolerance across AI team dispatch.',
    'agent.metric_depts': '4 Departments',
    'agent.metric_depts_sub': 'Academic · Ops · DevOps · Marketing',
    'agent.metric_skills': '5 Skills',
    'agent.metric_skills_sub': 'Extensible Skill Registry',
    'agent.metric_router': 'CompanyRouter',
    'agent.metric_router_sub': 'Adaptive Intent Routing & Fallback',
    'agent.dept_status_active': '🟢 Active',
    'agent.dept_academic_title': 'Academic & Teaching',
    'agent.dept_academic_role': 'Lesson Flow Tutor',
    'agent.dept_academic_desc': 'Handles lesson QA, slide deck generation, lecture scripts, and Self-RAG verification.',
    'agent.dept_ops_title': 'Operations & Admin',
    'agent.dept_ops_role': 'Ops Manager',
    'agent.dept_ops_desc': 'Handles JWT user auth, daily quota management, and system governance.',
    'agent.dept_devops_title': 'DevOps & Maintenance',
    'agent.dept_devops_role': 'DevOps Engineer',
    'agent.dept_devops_desc': 'Handles Railway deployments, OOM diagnosis, Volume caching, and AI Provider switching.',
    'agent.dept_mkt_title': 'Marketing & Sales',
    'agent.dept_mkt_role': 'Marketing Lead',
    'agent.dept_mkt_desc': 'Handles SaaS positioning, product pitch copy, social posts (FB/Threads), and SEO.',
    'agent.dept_mkt_platform_label': 'Target Platform:',
    'agent.welcome_title': '🤖 Welcome to Agent Ops Center',
    'agent.welcome_desc': 'Enter any task query. CompanyRouter will automatically classify your intent and route it to the appropriate department.',
    'agent.sug_1': '🎓 Newton\'s 2nd Law Outline',
    'agent.sug_2': '📋 Check My Daily Quota',
    'agent.sug_3': '🛠️ Diagnose Railway OOM Error',
    'agent.sug_4': '🚀 Generate Self-RAG Copywriting',
    'agent.placeholder': 'Dispatch task to Orchestrator (e.g. \'Diagnose Railway OOM error\' or \'Write a promotional post\')...',
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
    'opt.audience.adult': 'Working Adults',
    'opt.audience.general': 'General Public',
    'opt.tone.clear': 'Clear & Easy to Understand',
    'opt.tone.lively': 'Lively & Interactive',
    'opt.tone.rigorous': 'Professional & Rigorous',
    'opt.tone.story': 'Story-driven',

    'opt.provider.gemini': '✨ Gemini Cloud API',
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

    'admin.eyebrow': 'Permissions & User Review',
    'admin.title': '👑 Admin Console',
    'admin.subtitle': 'Review registered accounts, modify permissions, reset passwords and maintain users.',
    'admin.metric_total': 'Total Users',
    'admin.metric_pending': 'Pending Approval',
    'admin.metric_admin': 'System Admins',
    'admin.th_id': 'ID',
    'admin.th_username': 'Username',
    'admin.th_role': 'Role',
    'admin.th_status': 'Status',
    'admin.th_created': 'Created At',
    'admin.th_actions': 'Actions',
    'admin.loading': 'Loading...',

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
    const errorMsg = body.detail || '服務暫時無法使用';

    if (response.status === 401 && token) {
      logoutUser(false);
      openAuthModal('login');
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// --- 身份驗證 UI 與狀態控制 ---

function updateAuthUI(user) {
  state.user = user;
  const container = $('#authHeaderContainer');

  if (user) {
    const q = user.quota || {};
    const deckQ = q.deck || { used_count: 0, daily_limit: 3 };
    const askQ = q.ask || { used_count: 0, daily_limit: 10 };
    const isUnlimited = q.is_unlimited || user.role === 'admin';
    const quotaLabel = isUnlimited
      ? t('quota.unlimited')
      : (state.lang === 'en'
        ? `Decks:${deckQ.used_count}/3 · Q&A:${askQ.used_count}/10`
        : `教材:${deckQ.used_count}/3 · 提問:${askQ.used_count}/10`);
    const roleBadge = user.role === 'admin' ? t('quota.admin') : t('quota.regular');

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
    if ($('#quotaBadge')) $('#quotaBadge').textContent = isUnlimited ? t('quota.admin') : t('quota.active');
    if ($('#deckQuotaText')) $('#deckQuotaText').textContent = isUnlimited ? (state.lang === 'en' ? 'Unlimited' : '無限') : `${deckQ.used_count} / ${deckQ.daily_limit} ${state.lang === 'en' ? '' : '份'}`;
    if ($('#deckQuotaBar')) {
      $('#deckQuotaBar').style.width = isUnlimited ? '100%' : `${Math.min(100, (deckQ.used_count / deckQ.daily_limit) * 100)}%`;
      $('#deckQuotaBar').style.background = isUnlimited ? '#d97706' : 'var(--green)';
    }
    if ($('#askQuotaText')) $('#askQuotaText').textContent = isUnlimited ? (state.lang === 'en' ? 'Unlimited' : '無限') : `${askQ.used_count} / ${askQ.daily_limit} ${state.lang === 'en' ? '' : '次'}`;
    if ($('#askQuotaBar')) {
      $('#askQuotaBar').style.width = isUnlimited ? '100%' : `${Math.min(100, (askQ.used_count / askQ.daily_limit) * 100)}%`;
      $('#askQuotaBar').style.background = isUnlimited ? '#d97706' : 'var(--green)';
    }

    if ($('#userAvatar')) $('#userAvatar').textContent = user.role === 'admin' ? '👑' : user.username.charAt(0).toUpperCase();
    if ($('#userProfileInfo')) $('#userProfileInfo').innerHTML = `${escapeHtml(user.username)}<small>${roleBadge}</small>`;
  } else {
    if (container) container.innerHTML = `<button class="auth-btn" id="openAuthBtn" type="button" data-i18n="topbar.login_reg">${t('topbar.login_reg')}</button>`;

    // 重置側邊欄 Profile 卡片
    if ($('#quotaBadge')) $('#quotaBadge').textContent = t('quota.unlogged');
    if ($('#deckQuotaText')) $('#deckQuotaText').textContent = state.lang === 'en' ? '- / 3' : '- / 3 份';
    if ($('#deckQuotaBar')) $('#deckQuotaBar').style.width = '0%';
    if ($('#askQuotaText')) $('#askQuotaText').textContent = state.lang === 'en' ? '- / 10' : '- / 10 次';
    if ($('#askQuotaBar')) $('#askQuotaBar').style.width = '0%';
    if ($('#userAvatar')) $('#userAvatar').textContent = state.lang === 'en' ? 'G' : '客';
    if ($('#userProfileInfo')) $('#userProfileInfo').innerHTML = `${t('quota.guest')}<small>${t('quota.login_hint')}</small>`;
  }
  updateAdminUI();
  const profileNavBtn = $('#profileNavBtn');
  if (profileNavBtn) {
    if (state.user) profileNavBtn.classList.remove('hidden');
    else profileNavBtn.classList.add('hidden');
  }
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
  if ((name === 'admin' || name === 'agent') && (!state.user || state.user.role !== 'admin')) {
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

function renderMath(element) {
  if (typeof renderMathInElement === 'function' && element) {
    try {
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
$$('.suggestions button').forEach(btn => btn.addEventListener('click', () => { if (!state.document) return toast('請先上傳教材', true); $('#questionInput').value = btn.textContent; $('#chatForm').requestSubmit() }));
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
  $$('.admin-only').forEach(el => {
    if (state.user && state.user.role === 'admin') {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  if (state.user && state.user.role === 'admin') {
    fetchPendingCount();
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
  tbody.innerHTML = '<tr><td colspan="4" class="text-center muted">載入中…</td></tr>';

  try {
    const data = await api('/api/admin/users/pending');
    const users = data.pending_users || [];
    fetchPendingCount();

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center muted">尚無待審核之帳號</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><b>${escapeHtml(u.username)}</b></td>
        <td><span class="role-chip ${u.role}">${u.role === 'admin' ? '管理員' : '一般用戶'}</span></td>
        <td>${escapeHtml(u.created_at || '最近')}</td>
        <td>
          <button class="btn-sm btn-approve" data-review="approve" data-user="${escapeHtml(u.username)}">✓ 核准</button>
          <button class="btn-sm btn-reject" data-review="reject" data-user="${escapeHtml(u.username)}">✗ 拒絕</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">載入失敗: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function fetchAllUsers() {
  const tbody = $('#allUsersTbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">載入中…</td></tr>';

  try {
    const data = await api('/api/users/all');
    const users = data.users || [];

    const total = users.length;
    const pending = users.filter(u => u.status === 'pending').length;
    const admins = users.filter(u => u.role === 'admin').length;
    if ($('#metricTotalUsers')) $('#metricTotalUsers').textContent = total;
    if ($('#metricPendingUsers')) $('#metricPendingUsers').textContent = pending;
    if ($('#metricAdminUsers')) $('#metricAdminUsers').textContent = admins;

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">系統尚無用戶紀錄</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      let actionButtons = '';
      if (u.status === 'pending') {
        actionButtons = `
          <button class="btn-sm btn-approve" data-review="approve" data-user="${escapeHtml(u.username)}">✓ 核准</button>
          <button class="btn-sm btn-reject" data-review="reject" data-user="${escapeHtml(u.username)}">✗ 拒絕</button>
          <button class="btn-sm btn-reject" data-deleteuser="${escapeHtml(u.username)}">刪除</button>
        `;
      } else {
        actionButtons = `
          ${u.role === 'user' ? `<button class="btn-sm btn-action" data-role="admin" data-user="${escapeHtml(u.username)}">升為管理員</button>` : `<button class="btn-sm btn-warning" data-role="user" data-user="${escapeHtml(u.username)}">降為用戶</button>`}
          <button class="btn-sm btn-action" data-resetpass="${escapeHtml(u.username)}">重置密碼</button>
          <button class="btn-sm btn-reject" data-deleteuser="${escapeHtml(u.username)}">刪除</button>
        `;
      }

      return `
        <tr>
          <td>${u.id}</td>
          <td><b>${escapeHtml(u.username)}</b></td>
          <td>
            <span class="role-chip ${u.role}">${u.role === 'admin' ? '👑 管理員' : '用戶'}</span>
          </td>
          <td>
            <span class="status-chip ${u.status}">${u.status === 'approved' ? '已開通' : (u.status === 'pending' ? '⏳ 待審核' : '已拒絕')}</span>
          </td>
          <td>${escapeHtml(u.created_at || '-')}</td>
          <td>
            ${actionButtons}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">載入失敗: ${escapeHtml(err.message)}</td></tr>`;
  }
}

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
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.agent-sug-btn');
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
    if (input) input.value = '';
  }
});

async function dispatchAgentTask(query) {
  const container = $('#agentMessages');
  const sendBtn = $('#agentSendBtn');
  const platform = $('#agentPlatformSelect')?.value || 'FB / 社群媒體';
  const isEn = state.lang === 'en';

  if (!container) return;

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
      body: JSON.stringify({ query, platform })
    });

    const dept = res.department ? res.department.toUpperCase() : 'GENERAL';
    const skill = res.matched_skill || 'general';
    const data = res.data || {};
    const text = (typeof data === 'object' ? (data.output_text || data.copywriting || JSON.stringify(data, null, 2)) : String(data)) || res.message || (isEn ? 'Task completed.' : '任務完成。');

    const deptLabels = {
      'ACADEMIC': isEn ? '🎓 Academic & Teaching' : '🎓 教務教學部',
      'OPERATIONS': isEn ? '📋 Operations & Admin' : '📋 營運與行政部',
      'DEVOPS': isEn ? '🛠️ DevOps & Infra' : '🛠️ 技術維護部',
      'MARKETING': isEn ? '🚀 Marketing & Sales' : '🚀 市場與營銷部'
    };
    const deptLabel = deptLabels[dept] || (isEn ? `🎯 Dept: ${dept}` : `🎯 部門: ${dept}`);

    // 3. Replace Loading with Final Assistant Response Bubble
    assistantMsgEl.innerHTML = `
      <span class="bot-avatar">✦</span>
      <div>
        <div class="agent-msg-meta">
          <span class="agent-dept-chip">${deptLabel}</span>
          <span class="agent-skill-chip">⚡ Skill: ${skill}</span>
        </div>
        <p style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(text)}</p>
        <button type="button" class="agent-copy-btn" data-copy="${escapeHtml(text)}">${isEn ? '📋 Copy Content' : '📋 複製內容'}</button>
      </div>
    `;

    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(assistantMsgEl, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (_) {}
    }

    toast(isEn ? `Task completed by ${deptLabel}` : `Agent 任務已由 ${deptLabel} 順利完成`);
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


