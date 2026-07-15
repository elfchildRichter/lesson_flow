const state = { document: null, deck: null, activeSlide: 0 };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message, error = false) {
  const el = $('#toast'); el.querySelector('p').textContent = message; el.querySelector('span').textContent = error ? '!' : '✓';
  el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3200);
}

function loading(show, title = '正在讀懂你的教材', copy = '整理章節與核心概念…') {
  $('#loadingTitle').textContent = title; $('#loadingCopy').textContent = copy; $('#loadingOverlay').classList.toggle('hidden', !show);
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || '服務暫時無法使用'); }
  return response.json();
}

function setDocument(doc) {
  state.document = doc;
  $('#settingsPanel').classList.remove('locked'); $('#fileCard').classList.remove('hidden'); $('#generateBtn').disabled = false;
  $('#settingStatus').textContent = '✓ 已完成解析'; $('#fileName').textContent = doc.name;
  $('#fileMeta').textContent = `${doc.pages} 頁 · ${(doc.size_bytes / 1024 / 1024).toFixed(1)} MB · ${doc.chunks} 個知識片段`;
  $('#questionInput').disabled = false; $('#sendBtn').disabled = false;
  $('#chatDoc').innerHTML = `<span>PDF</span><div><b>${escapeHtml(doc.name)}</b><small>${doc.pages} 頁 · 已建立索引</small></div>`;
  $('#modeText').textContent = doc.ai_enabled ? 'AI 模式' : '本機示範模式';
  const steps = $$('.step'); steps[0].classList.add('done'); steps[1].classList.add('active');
  toast('教材已完成解析，可以開始設計課程');
}

async function uploadFile(file) {
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
$('#demoBtn').addEventListener('click', async () => { loading(true, '正在準備範例教材', '建立生成式 AI 課程索引…'); try { setDocument(await api('/api/demo', {method:'POST'})); } catch(e){toast(e.message,true)} finally {loading(false)} });
$('#removeFile').addEventListener('click', () => { state.document = null; $('#settingsPanel').classList.add('locked'); $('#fileCard').classList.add('hidden'); $('#generateBtn').disabled = true; $('#questionInput').disabled = true; $('#sendBtn').disabled = true; $('#settingStatus').textContent='等待教材'; $$('.step').forEach((s,i)=>{if(i)s.classList.remove('active','done')}); toast('已從工作台移除教材'); });

function switchView(name) {
  $$('.view').forEach(v => v.classList.remove('active')); $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === name));
  $(`#${name}View`).classList.add('active'); $('#crumb').textContent = name === 'workspace' ? '建立新課程' : name === 'deck' ? '簡報預覽' : '文件問答';
  if (innerWidth < 950) $('.sidebar').classList.remove('open');
}
$$('.nav-item').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
$('.menu-toggle').addEventListener('click', () => $('.sidebar').classList.toggle('open'));

$('#generateBtn').addEventListener('click', async () => {
  if (!state.document) return;
  loading(true, '正在設計這堂課', '安排教學節奏、投影片與逐頁講稿…');
  const payload = { document_id: state.document.id, audience: $('#audience').value, tone: $('#tone').value, duration: +$('#duration').value, slide_count: +$('#slideCount').value };
  try {
    state.deck = await api('/api/decks', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    renderDeck(); $$('.step')[1].classList.add('done'); $$('.step')[2].classList.add('active','done'); $('#deckCount').textContent='1';
    toast('簡報與逐頁講稿已經準備好了'); switchView('deck');
  } catch(e) { toast(e.message,true); } finally { loading(false); }
});

function renderDeck() {
  const d = state.deck; $('#deckTitle').textContent=d.title; $('#deckSubtitle').textContent=`${d.subtitle} · ${d.slides.length} 張投影片 · ${d.mode === 'ai' ? 'AI 生成' : '本機編排'}`;
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
  el.innerHTML=`<span class="bot-avatar">✦</span><div><p>${escapeHtml(data.answer)}</p><div class="source-list"><span>回答依據 · ${data.mode==='ai'?'AI 整合回答':'本機檢索'}</span>${sources}</div></div>`; $('#messages').append(el); scrollMessages();
}
function scrollMessages(){const m=$('#messages');m.scrollTop=m.scrollHeight}
function escapeHtml(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}

$('#chatForm').addEventListener('submit', async e=>{
  e.preventDefault(); const input=$('#questionInput'); const question=input.value.trim(); if(!question||!state.document)return; addUserMessage(question); input.value=''; $('#sendBtn').disabled=true;
  const typing=document.createElement('div');typing.className='message assistant';typing.innerHTML='<span class="bot-avatar">✦</span><div><p>正在教材中尋找依據…</p></div>';$('#messages').append(typing);scrollMessages();
  try {const data=await api('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({document_id:state.document.id,question})});typing.remove();addAssistantMessage(data)} catch(err){typing.remove();toast(err.message,true)} finally{$('#sendBtn').disabled=false}
});
$('#questionInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatForm').requestSubmit()}});
$$('.suggestions button').forEach(btn=>btn.addEventListener('click',()=>{if(!state.document)return toast('請先上傳教材',true);$('#questionInput').value=btn.textContent;$('#chatForm').requestSubmit()}));
$('#pptDownload').addEventListener('click',()=>toast('正在下載 PowerPoint 簡報'));
$('#scriptDownload').addEventListener('click',()=>toast('正在下載逐頁演講稿'));

fetch('/api/health').then(r=>r.json()).then(x=>{$('#modeText').textContent=x.ai_enabled?'AI 服務已連線':'本機示範模式'}).catch(()=>{$('#modeText').textContent='服務未連線'});
