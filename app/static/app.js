const state = { document: null, deck: null, activeSlide: 0, user: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message, error = false) {
  const el = $('#toast'); el.querySelector('p').textContent = message; el.querySelector('span').textContent = error ? '!' : '✓';
  el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3200);
}

function loading(show, title = '正在讀懂你的教材', copy = '整理章節與核心概念…') {
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
    const isUnlimited = user.quota && user.quota.is_unlimited;
    const remaining = user.quota ? user.quota.remaining : 0;
    const limit = user.quota ? user.quota.daily_limit : 20;
    const quotaLabel = isUnlimited ? '無限配額' : `剩餘: ${remaining}/${limit}`;
    const roleBadge = user.role === 'admin' ? '管理員' : '一般用戶';

    container.innerHTML = `
      <div class="auth-user-chip">
        <strong>👤 ${escapeHtml(user.username)}</strong>
        <small>${quotaLabel}</small>
        <button class="auth-logout-btn" id="logoutBtn" type="button">登出</button>
      </div>
    `;

    // 更新側邊欄 Profile 卡片
    $('#quotaBadge').textContent = isUnlimited ? 'UNLIMITED' : 'DAILY';
    if (isUnlimited) {
      $('#quotaBar').style.width = '100%';
      $('#quotaText').innerHTML = `<strong>∞</strong> / 管理員無限額度`;
    } else {
      const usedPct = Math.min(100, Math.round((user.quota.used_count / limit) * 100));
      $('#quotaBar').style.width = `${usedPct}%`;
      $('#quotaText').innerHTML = `<strong>${remaining}</strong> / ${limit} 次剩餘`;
    }
    $('#userAvatar').textContent = user.username.charAt(0).toUpperCase();
    $('#userProfileInfo').innerHTML = `${escapeHtml(user.username)}<small>${roleBadge}</small>`;
  } else {
    container.innerHTML = `<button class="auth-btn" id="openAuthBtn" type="button">登入 / 註冊</button>`;

    // 重置側邊欄 Profile 卡片
    $('#quotaBadge').textContent = '未登入';
    $('#quotaBar').style.width = '0%';
    $('#quotaText').innerHTML = `<strong>-</strong> / 請先登入`;
    $('#userAvatar').textContent = '客';
    $('#userProfileInfo').innerHTML = `訪客用戶<small>點擊登入帳號</small>`;
  }
  updateAdminUI();
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
  if (notify) toast('已成功登出');
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

// 事件委派：點擊登入按鈕、登出按鈕或側邊欄
document.addEventListener('click', (e) => {
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
      openProfileModal();
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
      throw new Error(data.detail || '登入失敗');
    }

    localStorage.setItem('auth_token', data.access_token);
    await fetchCurrentUser();
    closeAuthModal();
    toast(`登入成功！歡迎回來，${data.username}`);
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
      throw new Error(data.detail || '註冊失敗');
    }

    successEl.textContent = data.message || '註冊成功！請等待管理員核准開通。';
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
  $('#settingStatus').textContent = '✓ 已完成解析'; $('#fileName').textContent = doc.name;
  $('#fileMeta').textContent = `${doc.pages} 頁 · ${(doc.size_bytes / 1024 / 1024).toFixed(1)} MB · ${doc.chunks} 個知識片段`;
  $('#questionInput').disabled = false; $('#sendBtn').disabled = false;
  $('#chatDoc').innerHTML = `<span>PDF</span><div><b>${escapeHtml(doc.name)}</b><small>${doc.pages} 頁 · 已建立索引</small></div>`;
  $('#modeText').textContent = doc.provider_label;
  const steps = $$('.step'); steps[0].classList.add('done'); steps[1].classList.add('active');
  toast('教材已完成解析，可以開始設計課程');
}

async function uploadFile(file) {
  if (!state.user) {
    toast('請先登入帳號以使用文件上傳功能', true);
    openAuthModal('login');
    return;
  }
  if (!file || (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf')) return toast('請選擇 PDF 檔案', true);
  const data = new FormData(); data.append('file', file); loading(true);
  try { setDocument(await api('/api/documents', { method: 'POST', body: data })); }
  catch (e) { toast(e.message, true); }
  finally { loading(false); }
}

$('#fileInput').addEventListener('change', e => uploadFile(e.target.files[0]));
const dz = $('#dropzone');
['dragenter','dragover'].forEach(name => dz.addEventListener(name, e => { e.preventDefault(); dz.classList.add('dragging'); }));
['dragleave','drop'].forEach(name => dz.addEventListener(name, e => { e.preventDefault(); dz.classList.remove('dragging'); }));
dz.addEventListener('drop', e => uploadFile(e.dataTransfer.files[0]));
$('#removeFile').addEventListener('click', () => { state.document = null; $('#settingsPanel').classList.add('locked'); $('#fileCard').classList.add('hidden'); $('#generateBtn').disabled = true; $('#questionInput').disabled = true; $('#sendBtn').disabled = true; $('#settingStatus').textContent='等待教材'; $$('.step').forEach((s,i)=>{if(i)s.classList.remove('active','done')}); toast('已從工作台移除教材'); });

function switchView(name) {
  if (name === 'admin' && (!state.user || state.user.role !== 'admin')) {
    toast('僅限管理員存取控制台', true);
    return;
  }
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  if ($(`#${name}View`)) $(`#${name}View`).classList.add('active');
  $('#crumb').textContent = name === 'workspace' ? '建立新課程' : name === 'deck' ? '簡報預覽' : name === 'chat' ? '文件問答' : '管理員控制台';
  if (innerWidth < 950) $('.sidebar').classList.remove('open');

  if (name === 'admin') {
    switchAdminTab('pending');
  }
}
$$('.nav-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
$('.menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

$('#generateBtn').addEventListener('click', async () => {
  if (!state.user) {
    toast('請先登入帳號', true);
    openAuthModal('login');
    return;
  }
  if (!state.document) return;
  loading(true, '正在設計這堂課', '安排教學節奏、投影片與逐頁講稿…');
  const payload = { document_id: state.document.id, audience: $('#audience').value, tone: $('#tone').value, duration: +$('#duration').value, slide_count: +$('#slideCount').value };
  try {
    state.deck = await api('/api/decks', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    renderDeck(); $$('.step')[1].classList.add('done'); $$('.step')[2].classList.add('active','done'); $('#deckCount').textContent='1';
    await fetchCurrentUser();
    toast('簡報與逐頁講稿已經準備好了'); switchView('deck');
  } catch(e) { toast(e.message,true); } finally { loading(false); }
});

function renderDeck() {
  const d = state.deck; $('#deckTitle').textContent=d.title; $('#deckSubtitle').textContent=`${d.subtitle} · ${d.slides.length} 張投影片 · ${d.mode === 'ollama' ? 'Ollama 本機生成' : 'OpenAI 生成'}`;
  $('#pptDownload').href=`/api/decks/${d.id}/pptx`; $('#scriptDownload').href=`/api/decks/${d.id}/script`; $('#pptDownload').classList.remove('disabled'); $('#scriptDownload').classList.remove('disabled');
  $('#slideList').innerHTML=d.slides.map((s,i)=>`<div class="slide-thumb ${i===0?'active':''}" data-index="${i}"><small>${String(i+1).padStart(2,'0')}</small><div class="mini-slide"><b>${escapeHtml(s.title)}</b>${s.bullets.slice(0,3).map(()=>'<i></i>').join('')}</div></div>`).join('');
  $$('.slide-thumb').forEach(t=>t.addEventListener('click',()=>showSlide(+t.dataset.index))); showSlide(0);
}

function showSlide(index) {
  state.activeSlide=index; const s=state.deck.slides[index]; $$('.slide-thumb').forEach((t,i)=>t.classList.toggle('active',i===index));
  $('#slideStage').dataset.page=String(index+1).padStart(2,'0'); $('#slideStage').innerHTML=`<h2>${escapeHtml(s.title)}</h2><ul>${s.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>`;
  $('#speakerNotes').textContent=s.speaker_notes; $('#pageRef').textContent=s.source_pages.length?`教材第 ${s.source_pages.join('、')} 頁`:'講者備註';
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
  const typing=document.createElement('div');typing.className='message assistant';typing.innerHTML='<span class="bot-avatar">✦</span><div><p>正在教材中尋找依據…</p></div>';$('#messages').append(typing);scrollMessages();
  try {
    const data=await api('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({document_id:state.document.id,question})});
    typing.remove();
    addAssistantMessage(data);
    await fetchCurrentUser();
  } catch(err){typing.remove();toast(err.message,true)} finally{$('#sendBtn').disabled=false}
});
$('#questionInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatForm').requestSubmit()}});
$$('.suggestions button').forEach(btn=>btn.addEventListener('click',()=>{if(!state.document)return toast('請先上傳教材',true);$('#questionInput').value=btn.textContent;$('#chatForm').requestSubmit()}));
$('#pptDownload').addEventListener('click',()=>toast('正在下載 PowerPoint 簡報'));
$('#scriptDownload').addEventListener('click',()=>toast('正在下載逐頁演講稿'));

// 頁面加載時拉取當前服務資訊與登入狀態
fetch('/api/health').then(r=>r.json()).then(x=>{$('#modeText').textContent=x.provider_label}).catch(()=>{$('#modeText').textContent='服務未連線'});
fetchCurrentUser();


// === 管理員控制台 (Admin Modal) 與 個人設定 (Profile Modal) 邏輯 ===

function updateAdminUI() {
  const adminNavBtn = $('#openAdminModalBtn');
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

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center muted">系統尚無用戶紀錄</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td><b>${escapeHtml(u.username)}</b></td>
        <td>
          <span class="role-chip ${u.role}">${u.role === 'admin' ? '👑 管理員' : '用戶'}</span>
        </td>
        <td>
          <span class="status-chip ${u.status}">${u.status === 'approved' ? '已開通' : (u.status === 'pending' ? '待審核' : '停用')}</span>
        </td>
        <td>${escapeHtml(u.created_at || '-')}</td>
        <td>
          ${u.role === 'user' ? `<button class="btn-sm btn-action" data-role="admin" data-user="${escapeHtml(u.username)}">升為管理員</button>` : `<button class="btn-sm btn-warning" data-role="user" data-user="${escapeHtml(u.username)}">降為用戶</button>`}
          <button class="btn-sm btn-action" data-resetpass="${escapeHtml(u.username)}">重置密碼</button>
          <button class="btn-sm btn-reject" data-deleteuser="${escapeHtml(u.username)}">刪除</button>
        </td>
      </tr>
    `).join('');
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
      fetchPendingUsers();
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
    const newPassword = prompt(`請輸入為使用者 [${username}] 設定的新密碼：`);
    if (!newPassword) return;
    if (newPassword.length < 4) {
      toast('新密碼長度至少需 4 個字元', true);
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
    if (!confirm(`確定要刪除使用者 [${username}] 嗎？此操作無法復原。`)) return;
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
    toast('密碼已成功修改');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
});
