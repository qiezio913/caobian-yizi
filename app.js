// ---------- 存储层：优先 Supabase 云端，未配置则用浏览器本地存储 ----------
const useCloud = !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
let supabaseClient = null;
if (useCloud) {
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

const statusEl = document.getElementById('syncStatus');
statusEl.textContent = useCloud ? '☁️ 云端同步已开启' : '💾 本地存储模式（配置 config.js 后可开启云端同步）';
statusEl.classList.add(useCloud ? 'cloud' : 'local');

// 本地兜底
function localGet(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function localSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

async function fetchDiaries() {
  if (useCloud) {
    const { data, error } = await supabaseClient.from('diaries').select('*').order('date', { ascending: false });
    if (!error) return data;
    console.warn('云端读取失败，改用本地', error);
  }
  return localGet('diaries');
}

async function addDiary(entry) {
  if (useCloud) {
    const { error } = await supabaseClient.from('diaries').insert([entry]);
    if (!error) return;
    console.warn('云端保存失败，改用本地', error);
  }
  const list = localGet('diaries'); list.unshift(entry); localSet('diaries', list);
}

async function deleteDiary(id) {
  if (useCloud && !String(id).startsWith('local-')) {
    await supabaseClient.from('diaries').delete().eq('id', id); return;
  }
  localSet('diaries', localGet('diaries').filter(d => d.id !== id));
}

async function fetchChats() {
  if (useCloud) {
    const { data, error } = await supabaseClient.from('chats').select('*').order('created_at', { ascending: true });
    if (!error) return data;
    console.warn('云端读取失败，改用本地', error);
  }
  return localGet('chats');
}

async function addChat(msg) {
  if (useCloud) {
    const { error } = await supabaseClient.from('chats').insert([msg]);
    if (!error) return;
    console.warn('云端保存失败，改用本地', error);
  }
  const list = localGet('chats'); list.push(msg); localSet('chats', list);
}

// ---------- 页面切换 ----------
function switchTab(tab) {
  document.getElementById('tabDiary').classList.toggle('active', tab === 'diary');
  document.getElementById('tabChat').classList.toggle('active', tab === 'chat');
  document.getElementById('pageDiary').classList.toggle('hidden', tab !== 'diary');
  document.getElementById('pageChat').classList.toggle('hidden', tab !== 'chat');
  if (tab === 'chat') loadChats();
}

// ---------- 日记 ----------
document.getElementById('diaryDate').valueAsDate = new Date();

async function saveDiary() {
  const content = document.getElementById('diaryContent').value.trim();
  if (!content) return alert('写点什么再保存吧 💛');
  const entry = {
    date: document.getElementById('diaryDate').value,
    mood: document.getElementById('moodSelect').value,
    content,
    created_at: new Date().toISOString(),
  };
  if (!useCloud) entry.id = 'local-' + Date.now();
  await addDiary(entry);
  document.getElementById('diaryContent').value = '';
  loadDiaries();
}

async function loadDiaries() {
  const list = await fetchDiaries();
  const el = document.getElementById('diaryList');
  if (!list.length) { el.innerHTML = '<div class="empty">还没有日记，写下第一篇吧 🌱</div>'; return; }
  el.innerHTML = list.map(d => `
    <div class="item">
      <div class="meta">${d.date} · ${d.mood}</div>
      <div class="content">${escapeHtml(d.content)}</div>
      <button class="del" onclick="removeDiary('${d.id}')">✕</button>
    </div>`).join('');
}

async function removeDiary(id) {
  await deleteDiary(id); loadDiaries();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 聊天 ----------
async function loadChats() {
  const list = await fetchChats();
  const el = document.getElementById('chatMessages');
  el.innerHTML = '';
  if (!list.length) {
    appendMsg('bot', '今天怎么样？有什么想说的都可以告诉我');
    return;
  }
  list.forEach(m => appendMsg(m.role, m.content));
}

function appendMsg(role, content) {
  const el = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = content;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  appendMsg('user', text);
  const t1 = { role: 'user', content: text, created_at: new Date().toISOString() };
  if (!useCloud) t1.id = 'local-' + Date.now();
  await addChat(t1);

  // 模拟"正在输入"
  setTimeout(async () => {
    const reply = comfortReply(text);
    appendMsg('bot', reply);
    const t2 = { role: 'bot', content: reply, created_at: new Date().toISOString() };
    if (!useCloud) t2.id = 'local-' + Date.now();
    await addChat(t2);
  }, 600);
}

// 内置安慰机器人：根据关键词给出温柔的回应
function comfortReply(text) {
  const t = text.toLowerCase();
  const rules = [
    { keys: ['累', '疲惫', '忙', '加班'], replies: ['辛苦了，能感觉到你真的付出了很多。今晚好好休息一下，你值得被好好对待 🌙', '累的时候就允许自己慢下来。你已经做得很棒了，不用对自己要求太高。'] },
    { keys: ['难过', '伤心', '哭', '委屈'], replies: ['听着都心疼你。难受的时候不用装坚强，哭一场也没关系 🫂', '抱抱你。这些情绪都是真实的，它们终会慢慢过去的。'] },
    { keys: ['生气', '烦', '讨厌', '气死'], replies: ['换我可能也会生气。先深呼吸，把不满说出来本身就是一种释放。', '有这种感觉很正常。你愿意说出来，已经是很勇敢了。'] },
    { keys: ['焦虑', '担心', '害怕', '紧张'], replies: ['未来的事情其实并没有我们想象的那么可怕。先把眼前的小事做好就够了。', '焦虑说明你在认真生活。但记得，你已经很努力了，会慢慢好起来的。'] },
    { keys: ['孤独', '一个人', '没人'], replies: ['即使现在一个人，也有我一直在听你说 🫶 你并不孤单。', '一个人的时候会觉得世界很安静，但你现在愿意倾诉，说明心里是想找人说话的。我在。'] },
    { keys: ['开心', '高兴', '幸福', '不错', '棒'], replies: ['听到你开心，我也开心 ✨ 这份快乐要好好记住。', '太好了！值得为自己鼓掌一下 👏 继续记录这些美好的小瞬间。'] },
    { keys: ['谢谢', '感谢'], replies: ['不用谢，我一直都在 💛', '能帮上你一点点就好，你随时可以来找我聊天。'] },
    { keys: ['你好', '嗨', '在吗', 'hello'], replies: ['在的呀 🏠 今天想聊点什么？', '你好！我随时都在，今天心情怎么样？'] },
  ];
  for (const r of rules) {
    if (r.keys.some(k => t.includes(k))) return r.replies[Math.floor(Math.random() * r.replies.length)];
  }
  const defaults = [
    '嗯嗯，我在听，请继续说吧。',
    '谢谢你愿意告诉我这些。还有什么想说的吗？',
    '我理解。无论你经历什么，我都会陪着你。',
    '你的感受很重要，我一直都在听着。💛',
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

loadDiaries();
