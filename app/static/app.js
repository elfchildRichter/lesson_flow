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
    'nav.crumb_create': '建立新課程',
    'nav.crumb_workspace': '工作台',
    'nav.crumb_deck': '簡報檢視',
    'nav.crumb_chat': '教材 AI 助手',
    'nav.crumb_admin': '管理員控制台',
    'nav.crumb_profile': '個人帳號設定',
    'provider.title': '⚡ AI 模型提供者',
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

    'opt.provider.ollama_cloud': 'Ollama 雲端 (Cloud API)',
    'opt.provider.ollama_local': 'Ollama 本機 (Local LLM)',
    'opt.provider.openai': 'OpenAI 雲端 (GPT-4o)',

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
    'nav.crumb_create': 'Create Course',
    'nav.crumb_workspace': 'Workspace',
    'nav.crumb_deck': 'Deck View',
    'nav.crumb_chat': 'Lesson Assistant',
    'nav.crumb_admin': 'Admin Console',
    'nav.crumb_profile': 'Account Settings',
    'provider.title': '⚡ AI Provider',
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

    'opt.provider.ollama_cloud': 'Ollama Cloud (Cloud API)',
    'opt.provider.ollama_local': 'Ollama Local (Local LLM)',
    'opt.provider.openai': 'OpenAI Cloud (GPT-4o)',

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
      { val: 'ollama_cloud', key: 'opt.provider.ollama_cloud' },
      { val: 'ollama_local', key: 'opt.provider.ollama_local' },
      { val: 'openai', key: 'opt.provider.openai' }
    ];
    providerSelect.innerHTML = providerOpts.map(o =>
      `<option value="${o.val}" style="font-size: 12px !important;" ${o.val === selectedVal ? 'selected' : ''}>${t(o.key)}</option>`
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
  const data = new FormData(); data.append('file', file); loading(true, t('loading.read_title'), t('loading.read_copy'));
  try { setDocument(await api('/api/documents', { method: 'POST', body: data })); }
  catch (e) { toast(e.message, true); }
  finally { loading(false); }
}

$('#fileInput').addEventListener('change', e => uploadFile(e.target.files[0]));
const dz = $('#dropzone');
['dragenter','dragover'].forEach(name => dz.addEventListener(name, e => { e.preventDefault(); dz.classList.add('dragging'); }));
['dragleave','drop'].forEach(name => dz.addEventListener(name, e => { e.preventDefault(); dz.classList.remove('dragging'); }));
dz.addEventListener('drop', e => uploadFile(e.dataTransfer.files[0]));
$('#removeFile').addEventListener('click', () => {
  state.document = null;
  $('#settingsPanel').classList.add('locked');
  $('#fileCard').classList.add('hidden');
  $('#generateBtn').disabled = true;
  $('#questionInput').disabled = true;
  $('#sendBtn').disabled = true;
  $('#settingStatus').textContent = t('settings.status_wait');
  $$('.step').forEach((s,i) => { if(i) s.classList.remove('active','done'); });
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
    'admin': t('nav.crumb_admin')
  };
  if ($('#crumb')) $('#crumb').textContent = crumbs[name] || t('nav.crumb_create');
  if (innerWidth < 950) $('.sidebar').classList.remove('open');

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

$('.menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

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
    duration: +$('#duration').value,
    slide_count: +$('#slideCount').value,
    enable_web_search: $('#deckWebSearch') ? $('#deckWebSearch').checked : false,
  };
  try {
    state.deck = await api('/api/decks', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    renderDeck(); $$('.step')[1].classList.add('done'); $$('.step')[2].classList.add('active','done'); $('#deckCount').textContent='1';
    await fetchCurrentUser();
    toast(state.lang === 'en' ? 'Deck and speaker notes are ready!' : '簡報與逐頁講稿已經準備好了'); switchView('deck');
  } catch(e) { toast(e.message,true); } finally { loading(false); }
});

function renderDeck() {
  const d = state.deck;
  const modeText = d.mode === 'ollama'
    ? (state.lang === 'en' ? 'Ollama Local' : 'Ollama 本機生成')
    : (state.lang === 'en' ? 'OpenAI Generated' : 'OpenAI 生成');
  const slideText = state.lang === 'en' ? `${d.slides.length} Slides` : `${d.slides.length} 張投影片`;
  $('#deckTitle').textContent = d.title;
  $('#deckSubtitle').textContent = `${d.subtitle} · ${slideText} · ${modeText}`;
  $('#pptDownload').href = `/api/decks/${d.id}/pptx`;
  $('#scriptDownload').href = `/api/decks/${d.id}/script`;
  $('#pptDownload').classList.remove('disabled');
  $('#scriptDownload').classList.remove('disabled');
  $('#slideList').innerHTML = d.slides.map((s,i) => `<div class="slide-thumb ${i===0?'active':''}" data-index="${i}"><small>${String(i+1).padStart(2,'0')}</small><div class="mini-slide"><b>${escapeHtml(s.title)}</b>${s.bullets.slice(0,3).map(()=>'<i></i>').join('')}</div></div>`).join('');
  $$('.slide-thumb').forEach(t => t.addEventListener('click', () => showSlide(+t.dataset.index)));
  showSlide(0);
}

function showSlide(index) {
  state.activeSlide = index;
  const s = state.deck.slides[index];
  $$('.slide-thumb').forEach((t,i) => t.classList.toggle('active', i === index));
  $('#slideStage').dataset.page = String(index+1).padStart(2,'0');
  $('#slideStage').innerHTML = `<h2>${escapeHtml(s.title)}</h2><ul>${s.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>`;
  $('#speakerNotes').textContent = s.speaker_notes;
  if (s.source_pages.length) {
    $('#pageRef').textContent = state.lang === 'en' ? `Page ${s.source_pages.join(', ')}` : `教材第 ${s.source_pages.join('、')} 頁`;
  } else {
    $('#pageRef').textContent = t('deck.page_ref');
  }
}

function addUserMessage(text) { const el=document.createElement('div'); el.className='message user'; el.innerHTML=`<div>${escapeHtml(text)}</div>`; $('#messages').append(el); scrollMessages(); }
function addAssistantMessage(data) {
  const el=document.createElement('div'); el.className='message assistant'; const sources=data.sources.slice(0,3).map(s=>`<div class="source"><b>第 ${s.page} 頁</b><p>${escapeHtml(s.excerpt)}</p></div>`).join('');
  el.innerHTML=`<span class="bot-avatar">✦</span><div><p>${escapeHtml(data.answer)}</p><div class="source-list"><span>回答依據 · ${data.mode==='ollama'?'Ollama + Hugging Face':'OpenAI'} RAG</span>${sources}</div></div>`; $('#messages').append(el); scrollMessages();
}
function scrollMessages(){const m=$('#messages');m.scrollTop=m.scrollHeight}
function escapeHtml(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}

$('#chatForm').addEventListener('submit', async e=>{
  e.preventDefault();
  if (!state.user) {
    toast('請先登入帳號以開始問答', true);
    openAuthModal('login');
    return;
  }
  const input=$('#questionInput'); const question=input.value.trim(); if(!question||!state.document)return; addUserMessage(question); input.value=''; $('#sendBtn').disabled=true;
  const enable_web_search = $('#qaWebSearch') ? $('#qaWebSearch').checked : false;
  const typing=document.createElement('div');typing.className='message assistant';typing.innerHTML='<span class="bot-avatar">✦</span><div><p>正在檢索教材與分析中…</p></div>';$('#messages').append(typing);scrollMessages();
  try {
    const data=await api('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({document_id:state.document.id,question,enable_web_search})});
    typing.remove();
    addAssistantMessage(data);
    await fetchCurrentUser();
  } catch(err){typing.remove();toast(err.message,true)} finally{$('#sendBtn').disabled=false}
});
$('#questionInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatForm').requestSubmit()}});
$$('.suggestions button').forEach(btn=>btn.addEventListener('click',()=>{if(!state.document)return toast('請先上傳教材',true);$('#questionInput').value=btn.textContent;$('#chatForm').requestSubmit()}));
$('#pptDownload').addEventListener('click',()=>toast('正在下載 PowerPoint 簡報'));
$('#scriptDownload').addEventListener('click',()=>toast('正在下載逐頁演講稿'));

// ── AI 提供者 (Provider) 切換與 UI 更新 ──
function updateProviderUI(info) {
  if (!info) return;
  state.provider = info.provider;
  if ($('#providerSelect')) $('#providerSelect').value = info.provider;
  const badges = {
    'openai': state.lang === 'en' ? 'OpenAI Cloud' : 'OpenAI 雲端',
    'ollama_cloud': state.lang === 'en' ? 'Ollama Cloud' : 'Ollama 雲端',
    'ollama_local': state.lang === 'en' ? 'Ollama Local' : 'Ollama 本機'
  };
  const providerLabels = {
    'openai': state.lang === 'en' ? 'OpenAI Cloud (GPT-4o)' : 'OpenAI 雲端 (GPT-4o)',
    'ollama_cloud': state.lang === 'en' ? 'Ollama Cloud (Cloud API)' : 'Ollama 雲端 (Cloud API)',
    'ollama_local': state.lang === 'en' ? 'Ollama Local (Local LLM)' : 'Ollama 本機 (Local LLM)'
  };
  if ($('#providerBadge')) $('#providerBadge').textContent = badges[info.provider] || 'Ollama';
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
  const adminNavBtn = $('#adminNavBtn') || $('#openAdminModalBtn') || $('.admin-only');
  if (!adminNavBtn) return;
  
  if (state.user && state.user.role === 'admin') {
    adminNavBtn.classList.remove('hidden');
    fetchPendingCount();
  } else {
    adminNavBtn.classList.add('hidden');
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
