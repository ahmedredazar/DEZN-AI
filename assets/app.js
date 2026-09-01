const chatEl = document.getElementById("chat");
const input = document.getElementById("input");
const composer = document.getElementById("composer");
const send = document.getElementById("send");
const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");
const historyEl = document.getElementById("history");

let messages = [];
let chats = JSON.parse(localStorage.getItem("dezn_chats") || "[]");

function saveChats() {
  localStorage.setItem("dezn_chats", JSON.stringify(chats.slice(-20)));
}

function renderHistory() {
  historyEl.innerHTML = "";
  chats.slice().reverse().forEach((chat, index) => {
    const btn = document.createElement("button");
    btn.className = "history-item";
    btn.textContent = chat.title || "New chat";
    btn.onclick = () => loadChat(chats.length - 1 - index);
    historyEl.appendChild(btn);
  });
}

function loadChat(index) {
  const chat = chats[index];
  if (!chat) return;
  messages = chat.messages || [];
  renderMessages();
}

function persistCurrentChat() {
  if (!messages.length) return;
  const first = messages.find(m => m.role === "user");
  const title = first ? first.content.slice(0, 42) : "New chat";
  chats.push({ title, messages });
  if (chats.length > 20) chats.shift();
  saveChats();
  renderHistory();
}

function renderMessages() {
  chatEl.innerHTML = "";
  if (!messages.length) {
    chatEl.innerHTML = `
      <div id="welcome" class="welcome">
        <div class="logo-large"><img src="/dezn.png" alt="DEZN"></div>
        <h1>DEZN AI</h1>
        <p>Your intelligent assistant, built for DEZN.</p>
        <div class="suggestions">
          <button data-prompt="Help me build a modern website">Build a website</button>
          <button data-prompt="Explain this concept simply">Explain something</button>
          <button data-prompt="Give me creative ideas for my project">Creative ideas</button>
          <button data-prompt="Help me write professional content">Write content</button>
        </div>
      </div>`;
    bindSuggestions();
    return;
  }

  messages.forEach(m => addMessage(m.role, m.content));
  scrollBottom();
}

function addMessage(role, content) {
  const row = document.createElement("div");
  row.className = `message ${role === "user" ? "user" : "ai"}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "YOU" : "DEZN";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatEl.appendChild(row);
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message ai";
  row.id = "typing";
  row.innerHTML = `
    <div class="avatar">DEZN</div>
    <div class="bubble">
      <div class="typing"><span></span><span></span><span></span></div>
    </div>`;
  chatEl.appendChild(row);
  scrollBottom();
}

function scrollBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendMessage(text) {
  text = text.trim();
  if (!text || send.disabled) return;

  if (!messages.length) {
    const welcome = document.getElementById("welcome");
    if (welcome) welcome.remove();
  }

  messages.push({ role: "user", content: text });
  addMessage("user", text);
  input.value = "";
  input.style.height = "auto";
  send.disabled = true;
  showTyping();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();
    document.getElementById("typing")?.remove();

    if (!response.ok) throw new Error(data.error || "Request failed");

    messages.push({ role: "assistant", content: data.text });
    addMessage("assistant", data.text);
    persistCurrentChat();
  } catch (error) {
    document.getElementById("typing")?.remove();
    addMessage("assistant", "حدث خطأ: " + error.message);
  } finally {
    send.disabled = false;
    input.focus();
    scrollBottom();
  }
}

function bindSuggestions() {
  document.querySelectorAll("[data-prompt]").forEach(btn => {
    btn.onclick = () => sendMessage(btn.dataset.prompt);
  });
}

composer.addEventListener("submit", e => {
  e.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 180) + "px";
});

newChat.onclick = () => {
  if (messages.length) persistCurrentChat();
  messages = [];
  renderMessages();
  input.focus();
};

clearChat.onclick = () => {
  messages = [];
  renderMessages();
  input.focus();
};

renderHistory();
renderMessages();
