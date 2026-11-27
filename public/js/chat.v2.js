// ===== CHAT WIDGET (ИИ-ассистент RaptorAI, n8n) =====
// TODO: замените на реальный webhook-адрес вашего workflow в n8n
const CHAT_WEBHOOK_URL = 'https://functions.yandexcloud.net/d4erfg6tb5en26f40a8r?r=chat';

let chatOpened = false;
let chatGatePassed = false;
let chatUserName = '';
let chatUserEmail = '';
let chatPendingImage = null; // dataURL base64
let chatHistoryMessages = [];
const CHAT_STORAGE_KEY = 'raptorai_chat_history';

function saveChatHistory() {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
      name: chatUserName,
      email: chatUserEmail,
      gatePassed: chatGatePassed,
      messages: chatHistoryMessages
    }));
  } catch (e) { /* localStorage unavailable, ignore */ }
}

function restoreChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !data.gatePassed) return;
    chatUserName = data.name || '';
    chatUserEmail = data.email || '';
    chatGatePassed = true;
    document.getElementById('chat-gate').style.display = 'none';
    document.getElementById('chat-body').style.display = 'flex';
    document.getElementById('chat-input-row').style.display = 'flex';
    (data.messages || []).forEach(function(m) {
      appendChatMessage(m.role, m.text, m.imageUrl, m.time, m.cta);
    });
    chatHistoryMessages = data.messages || [];
  } catch (e) { /* corrupted history, ignore */ }
}

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  chatOpened = !chatOpened;
  panel.classList.toggle('open', chatOpened);
  if (chatOpened) document.getElementById('chat-unread-dot').style.display = 'none';
}

function chatSessionId() {
  try {
    let id = localStorage.getItem('raptorai_chat_sid');
    if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('raptorai_chat_sid', id); }
    return id;
  } catch (e) { return 'tmp' + Math.random().toString(36).slice(2, 10); }
}
const CHAT_SESSION_ID = chatSessionId();

// Чат открывается сразу, без имени и email. Контакт агент спрашивает сам по ходу диалога.
function openChatWithoutGate() {
  chatGatePassed = true;
  if (!chatUserName) chatUserName = 'Гость';
  if (!chatUserEmail) chatUserEmail = 'guest-' + CHAT_SESSION_ID + '@chat.raptorai.ru';
  document.getElementById('chat-gate').style.display = 'none';
  document.getElementById('chat-body').style.display = 'flex';
  document.getElementById('chat-input-row').style.display = 'flex';
  const legal = document.getElementById('chat-legal'); if (legal) legal.style.display = 'block';
  if (!chatHistoryMessages.length) {
    appendChatMessage('bot', 'Здравствуйте! Я ИИ-ассистент RaptorAI. Спросите про цены, сроки или примеры работ. Когда захотите точный расчёт, передам вашу задачу менеджеру.');
  }
}
function passChatGate() { openChatWithoutGate(); }

function onChatInputChange() {
  const ta = document.getElementById('chat-text-input');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 90) + 'px';
  updateSendButtonState();
}

function onChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function updateSendButtonState() {
  const text = document.getElementById('chat-text-input').value.trim();
  document.getElementById('chat-send-btn').disabled = !text && !chatPendingImage;
}

function onChatFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type) || file.size > 2 * 1024 * 1024) {
    event.target.value = '';
    appendChatMessage('bot', 'Прикрепите картинку PNG, JPG или WebP до 2 МБ.');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    chatPendingImage = e.target.result;
    document.getElementById('chat-preview-img').src = chatPendingImage;
    document.getElementById('chat-preview').style.display = 'flex';
    updateSendButtonState();
  };
  reader.readAsDataURL(file);
}

function removeChatImage() {
  chatPendingImage = null;
  document.getElementById('chat-file-input').value = '';
  document.getElementById('chat-preview').style.display = 'none';
  updateSendButtonState();
}

function appendChatMessage(role, text, imageUrl, savedTime, showConsultCta) {
  const body = document.getElementById('chat-body');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  if (text) div.appendChild(document.createTextNode(text));
  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    div.appendChild(img);
  }
  const timeStr = savedTime || new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const timeEl = document.createElement('span');
  timeEl.className = 'chat-msg-time';
  timeEl.textContent = timeStr;
  div.appendChild(timeEl);
  body.appendChild(div);

  if (showConsultCta) {
    const cta = document.createElement('a');
    cta.href = '#contact';
    cta.className = 'chat-cta-btn';
    cta.textContent = 'Получить расчёт';
    cta.onclick = function () {
      toggleChat();
      setTimeout(function () {
        const target = document.getElementById('contact');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    };
    body.appendChild(cta);
  }

  body.scrollTop = body.scrollHeight;

  if (!savedTime) {
    chatHistoryMessages.push({ role: role, text: text || '', imageUrl: imageUrl || null, time: timeStr, cta: !!showConsultCta });
    saveChatHistory();
  }
}

function showChatTyping() {
  const body = document.getElementById('chat-body');
  const div = document.createElement('div');
  div.className = 'chat-typing';
  div.id = 'chat-typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}
function hideChatTyping() {
  const el = document.getElementById('chat-typing-indicator');
  if (el) el.remove();
}

async function sendChatMessage() {
  if (!chatGatePassed) return;
  const textInput = document.getElementById('chat-text-input');
  const text = textInput.value.trim();
  const image = chatPendingImage;
  if (!text && !image) return;
  if (text.length > 2000) {
    appendChatMessage('bot', 'Сообщение слишком длинное, сократите его до 2000 символов.');
    return;
  }
  // Лимит на стороне страницы: не чаще раза в 1,5 с и не больше 20 сообщений за 10 минут
  try {
    const now = Date.now();
    const log = JSON.parse(localStorage.getItem('raptorai_chat_rl') || '[]').filter(function (t) { return now - t < 600000; });
    if (log.length >= 20 || (log.length && now - log[log.length - 1] < 1500)) {
      appendChatMessage('bot', 'Слишком много сообщений подряд. Подождите немного и напишите снова.');
      return;
    }
    log.push(now);
    localStorage.setItem('raptorai_chat_rl', JSON.stringify(log));
  } catch (e) { /* localStorage недоступен, лимит пропускаем */ }

  appendChatMessage('user', text, image);
  textInput.value = '';
  textInput.style.height = 'auto';
  removeChatImage();
  updateSendButtonState();
  showChatTyping();

  try {
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: chatUserName,
        email: chatUserEmail,
        session_id: CHAT_SESSION_ID,
        message: text,
        image: image || null,
        source: 'raptorai.ru'
      })
    });
    const data = await response.json();
    hideChatTyping();
    let replyText = data.reply || 'Принял, скоро отвечу подробнее.';
    const hasCta = /\[CTA:CONSULT\]/i.test(replyText);
    replyText = replyText.replace(/\[CTA:CONSULT\]/gi, '').trim();
    appendChatMessage('bot', replyText, null, null, hasCta);
  } catch (err) {
    hideChatTyping();
    appendChatMessage('bot', 'Не получилось отправить сообщение — попробуйте ещё раз чуть позже или напишите нам через форму на сайте.');
  }
}

restoreChatHistory();
if (!chatGatePassed) openChatWithoutGate();
else { const lg = document.getElementById('chat-legal'); if (lg) lg.style.display = 'block'; }

