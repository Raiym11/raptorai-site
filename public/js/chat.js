// ===== CHAT WIDGET (Дмитрий, n8n) =====
// TODO: замените на реальный webhook-адрес вашего workflow в n8n
const CHAT_WEBHOOK_URL = 'https://n8n.raptorai.ru/webhook/raptorai-chat';
const CHAT_WEBHOOK_SECRET = '6f28d42d47e4ef822578b38add66af30c3c4aba234db8eaf';

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

function passChatGate() {
  const name = document.getElementById('chat-gate-name').value.trim();
  const email = document.getElementById('chat-gate-email').value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !emailOk) {
    document.getElementById('chat-gate-error').style.display = 'block';
    return;
  }
  chatUserName = name;
  chatUserEmail = email;
  chatGatePassed = true;
  document.getElementById('chat-gate').style.display = 'none';
  document.getElementById('chat-body').style.display = 'flex';
  document.getElementById('chat-input-row').style.display = 'flex';
  const greeting = (typeof isNewYearPeriod !== 'undefined' && isNewYearPeriod)
    ? `🎄 С наступающим, ${name}! Я Дмитрий, ИИ-ассистент RaptorAI. Даже под ёлкой продолжаю помогать с автоматизацией — пишите, что нужно, можно прислать и фото или скриншот.`
    : `Привет, ${name}! Я Дмитрий, ИИ-ассистент RaptorAI. Расскажите, что хотите автоматизировать — можно прислать и скриншот или фото, если так понятнее.`;
  appendChatMessage('bot', greeting);
  document.getElementById('chat-text-input').focus();
}

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
    cta.textContent = 'Консультация';
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
        'Content-Type': 'application/json',
        'X-Webhook-Secret': CHAT_WEBHOOK_SECRET
      },
      body: JSON.stringify({
        name: chatUserName,
        email: chatUserEmail,
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

