const chatEl = document.getElementById("chat");
const input = document.getElementById("input");
const composer = document.getElementById("composer");
const send = document.getElementById("send");
const newChat = document.getElementById("newChat");
const clearChat = document.getElementById("clearChat");
const historyEl = document.getElementById("history");

const STORAGE_KEY = "dezn_chats_v2";
const MAX_CHATS = 30;

let messages = [];
let currentChatId = null;
let chats = loadChats();

function loadChats() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveChats() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(chats.slice(0, MAX_CHATS))
  );
}

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getChatTitle(list) {
  const firstMessage = list.find(
    message => message.role === "user"
  );

  if (!firstMessage) {
    return "New Chat";
  }

  const title = firstMessage.content
    .replace(/\s+/g, " ")
    .trim();

  return title.length > 48
    ? title.slice(0, 48) + "…"
    : title;
}


/* =========================
   SAVE CURRENT CHAT
========================= */

function saveCurrentChat() {

  if (!messages.length) {
    return;
  }

  if (!currentChatId) {
    currentChatId = createId();
  }

  const chatData = {
    id: currentChatId,

    title: getChatTitle(messages),

    messages: messages.map(message => ({
      role: message.role,
      content: message.content
    })),

    updatedAt: Date.now()
  };

  const existingIndex = chats.findIndex(
    chat => chat.id === currentChatId
  );

  if (existingIndex >= 0) {

    // Update existing chat
    chats[existingIndex] = chatData;

  } else {

    // Create new chat
    chats.unshift(chatData);
  }

  chats.sort(
    (a, b) =>
      (b.updatedAt || 0) -
      (a.updatedAt || 0)
  );

  chats = chats.slice(0, MAX_CHATS);

  saveChats();

  renderHistory();
}


/* =========================
   RECENT CHATS
========================= */

function renderHistory() {

  historyEl.innerHTML = "";

  if (!chats.length) {

    const empty = document.createElement("div");

    empty.className = "history-empty";

    empty.textContent = "No recent chats";

    historyEl.appendChild(empty);

    return;
  }

  chats.forEach(chat => {

    const button = document.createElement("button");

    button.type = "button";

    button.className = "history-item";

    button.textContent =
      chat.title || "New Chat";

    button.title =
      chat.title || "New Chat";

    if (chat.id === currentChatId) {

      button.classList.add("active");
    }

    button.addEventListener(
      "click",
      () => {

        currentChatId = chat.id;

        messages = Array.isArray(chat.messages)
          ? chat.messages
          : [];

        renderHistory();

        renderMessages();
      }
    );

    historyEl.appendChild(button);
  });
}


/* =========================
   RENDER CHAT
========================= */

function renderMessages() {

  chatEl.innerHTML = "";

  if (!messages.length) {

    chatEl.innerHTML = `

      <div id="welcome" class="welcome">

        <div class="logo-large">

          <img
            src="/assets/dezn.png"
            alt="DEZN"
          >

        </div>

        <h1>DEZN AI</h1>

        <p>
          Your intelligent assistant, built for DEZN.
        </p>

        <div class="suggestions">

          <button
            type="button"
            data-prompt="Help me build a modern website"
          >
            Build a website
          </button>

          <button
            type="button"
            data-prompt="Explain this concept simply"
          >
            Explain something
          </button>

          <button
            type="button"
            data-prompt="Give me creative ideas for my project"
          >
            Creative ideas
          </button>

          <button
            type="button"
            data-prompt="Help me write professional content"
          >
            Write content
          </button>

        </div>

      </div>
    `;

    bindSuggestions();

    return;
  }


  messages.forEach(message => {

    appendMessage(
      message.role,
      message.content
    );

  });

  scrollToBottom();
}


/* =========================
   ADD MESSAGE
========================= */

function appendMessage(
  role,
  content
) {

  const row =
    document.createElement("div");

  row.className =
    `message ${
      role === "user"
        ? "user"
        : "ai"
    }`;


  const avatar =
    document.createElement("div");

  avatar.className = "avatar";

  avatar.textContent =
    role === "user"
      ? "YOU"
      : "DEZN";


  const bubble =
    document.createElement("div");

  bubble.className = "bubble";

  bubble.textContent = content;


  row.appendChild(avatar);

  row.appendChild(bubble);

  chatEl.appendChild(row);
}


/* =========================
   TYPING INDICATOR
========================= */

function showTyping() {

  document
    .getElementById("typing")
    ?.remove();


  const row =
    document.createElement("div");

  row.id = "typing";

  row.className =
    "message ai";


  row.innerHTML = `

    <div class="avatar">
      DEZN
    </div>

    <div class="bubble">

      <div class="typing">

        <span></span>
        <span></span>
        <span></span>

      </div>

    </div>

  `;


  chatEl.appendChild(row);

  scrollToBottom();
}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

  chatEl.scrollTop =
    chatEl.scrollHeight;
}


/* =========================
   SUGGESTIONS
========================= */

function bindSuggestions() {

  document
    .querySelectorAll("[data-prompt]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          sendMessage(
            button.dataset.prompt
          );

        }
      );

    });
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(
  rawText
) {

  const text =
    String(rawText || "").trim();


  if (
    !text ||
    send.disabled
  ) {

    return;
  }


  // Remove welcome screen
  document
    .getElementById("welcome")
    ?.remove();


  // Add user message
  messages.push({
    role: "user",
    content: text
  });


  appendMessage(
    "user",
    text
  );


  // Clear input
  input.value = "";

  input.style.height =
    "auto";


  // Disable send button
  send.disabled = true;


  // Show typing
  showTyping();


  try {

    const response =
      await fetch(
        "/api/chat",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            messages
          })

        }
      );


    let data;


    try {

      data =
        await response.json();

    } catch {

      throw new Error(
        `Server returned HTTP ${response.status}`
      );

    }


    if (!response.ok) {

      throw new Error(
        data?.error ||
        `Request failed (${response.status})`
      );

    }


    const answer =
      typeof data?.text === "string"
        ? data.text.trim()
        : "";


    if (!answer) {

      throw new Error(
        "The AI returned an empty response."
      );

    }


    // Remove typing indicator
    document
      .getElementById("typing")
      ?.remove();


    // Add AI response
    messages.push({
      role: "assistant",
      content: answer
    });


    appendMessage(
      "assistant",
      answer
    );


    // Save chat
    saveCurrentChat();


  } catch (error) {

    document
      .getElementById("typing")
      ?.remove();


    appendMessage(
      "assistant",

      `حدث خطأ: ${
        error?.message ||
        "تعذر الاتصال بخدمة الذكاء الاصطناعي."
      }`
    );

  } finally {

    send.disabled = false;

    input.focus();

    scrollToBottom();
  }
}


/* =========================
   FORM SUBMIT
========================= */

composer.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    sendMessage(
      input.value
    );

  }
);


/* =========================
   ENTER / SHIFT + ENTER
========================= */

input.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      composer.requestSubmit();

    }

  }
);


/* =========================
   AUTO RESIZE TEXTAREA
========================= */

input.addEventListener(
  "input",
  () => {

    input.style.height =
      "auto";

    input.style.height =
      Math.min(
        input.scrollHeight,
        180
      ) + "px";

  }
);


/* =========================
   NEW CHAT
========================= */

newChat.addEventListener(
  "click",
  () => {

    // Save current chat first
    saveCurrentChat();


    // Reset current chat
    currentChatId = null;

    messages = [];


    renderHistory();

    renderMessages();


    input.focus();

  }
);


/* =========================
   CLEAR CHAT
========================= */

clearChat.addEventListener(
  "click",
  () => {

    messages = [];

    currentChatId = null;


    renderHistory();

    renderMessages();


    input.focus();

  }
);


/* =========================
   INITIALIZE
========================= */

renderHistory();

renderMessages();