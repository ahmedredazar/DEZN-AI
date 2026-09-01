/* =========================
   DEZN AI — Frontend Logic
========================= */

const chatEl = document.getElementById("chat");
const welcomeEl = document.getElementById("welcome");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const newChatBtn = document.getElementById("newChat");
const clearChatBtn = document.getElementById("clearChat");
const historyEl = document.getElementById("history");

let messages = [];
let isLoading = false;
let currentChatId = null;

/* =========================
   INIT
========================= */

function init() {
  loadHistory();
  autoResizeTextarea();
  bindEvents();
}

function bindEvents() {
  formEl.addEventListener("submit", handleSubmit);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formEl.requestSubmit();
    }
  });

  inputEl.addEventListener("input", autoResizeTextarea);

  newChatBtn.addEventListener("click", startNewChat);
  clearChatBtn.addEventListener("click", clearCurrentChat);

  document.querySelectorAll(".suggestions button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt;
      if (prompt) {
        inputEl.value = prompt;
        formEl.requestSubmit();
      }
    });
  });
}

/* =========================
   TEXTAREA AUTO-RESIZE
========================= */

function autoResizeTextarea() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + "px";
}

/* =========================
   CHAT HANDLING
========================= */

async function handleSubmit(e) {
  e.preventDefault();
  if (isLoading) return;

  const text = inputEl.value.trim();
  if (!text) return;

  // Hide welcome
  if (welcomeEl) welcomeEl.style.display = "none";

  // Add user message
  addMessage("user", text);
  messages.push({ role: "user", content: text });

  inputEl.value = "";
  autoResizeTextarea();
  setLoading(true);

  // Create typing indicator
  const typingId = showTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    removeTyping(typingId);

    if (!response.ok) {
      throw new Error(data.error || "حدث خطأ في الاتصال");
    }

    const aiText = data.text || "لم أستطع توليد رد.";
    addMessage("assistant", aiText);
    messages.push({ role: "assistant", content: aiText });

    // Save to history
    saveCurrentChat();
  } catch (err) {
    removeTyping(typingId);
    addMessage("assistant", `⚠️ ${err.message}`);
  } finally {
    setLoading(false);
    inputEl.focus();
  }
}

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";

  if (role === "user") {
    avatar.textContent = "U";
  } else {
    const img = document.createElement("img");
    img.src = "/assets/dezn.svg";
    img.alt = "DEZN";
    avatar.appendChild(img);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatEl.appendChild(div);

  // Scroll to bottom
  chatEl.scrollTop = chatEl.scrollHeight;
}

function showTyping() {
  const id = "typing-" + Date.now();
  const div = document.createElement("div");
  div.className = "message assistant";
  div.id = id;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  const img = document.createElement("img");
  img.src = "/assets/dezn.svg";
  img.alt = "DEZN";
  avatar.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;

  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function setLoading(state) {
  isLoading = state;
  sendBtn.disabled = state;
  inputEl.disabled = state;
}

/* =========================
   HISTORY (localStorage)
========================= */

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("dezn_chats") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem("dezn_chats", JSON.stringify(list));
}

function saveCurrentChat() {
  if (!messages.length) return;

  const history = getHistory();
  const title = messages[0]?.content?.slice(0, 40) || "محادثة جديدة";

  if (currentChatId) {
    const idx = history.findIndex((c) => c.id === currentChatId);
    if (idx !== -1) {
      history[idx].messages = messages;
      history[idx].title = title;
      history[idx].updated = Date.now();
    }
  } else {
    currentChatId = "chat_" + Date.now();
    history.unshift({
      id: currentChatId,
      title,
      messages: [...messages],
      updated: Date.now(),
    });
  }

  // Keep only last 30 chats
  saveHistory(history.slice(0, 30));
  renderHistory();
}

function loadHistory() {
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  historyEl.innerHTML = "";

  history.forEach((chat) => {
    const item = document.createElement("div");
    item.className = "history-item" + (chat.id === currentChatId ? " active" : "");
    item.textContent = chat.title;
    item.title = chat.title;

    item.addEventListener("click", () => {
      loadChat(chat.id);
    });

    historyEl.appendChild(item);
  });
}

function loadChat(id) {
  const history = getHistory();
  const chat = history.find((c) => c.id === id);
  if (!chat) return;

  currentChatId = id;
  messages = [...chat.messages];

  // Clear UI
  chatEl.innerHTML = "";
  if (welcomeEl) welcomeEl.style.display = "none";

  messages.forEach((m) => addMessage(m.role, m.content));
  renderHistory();
}

function startNewChat() {
  currentChatId = null;
  messages = [];
  chatEl.innerHTML = "";
  if (welcomeEl) {
    chatEl.appendChild(welcomeEl);
    welcomeEl.style.display = "block";
  }
  renderHistory();
  inputEl.focus();
}

function clearCurrentChat() {
  if (!confirm("هل تريد مسح المحادثة الحالية؟")) return;
  startNewChat();
}

/* =========================
   START
========================= */

init();
