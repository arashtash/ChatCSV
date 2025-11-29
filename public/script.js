const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

const nameInput = document.getElementById('user-name-input');
const themeSelect = document.getElementById('theme-select');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');

const STORAGE_KEYS = {
  NAME: 'chatcsv-user-name',
  THEME: 'chatcsv-theme',
  HISTORY: 'chatcsv-history',
  INTERESTS: 'chatcsv-interests'
};

let chatHistory = [];
let userInterests = {};


//applying dark and light theme
function applyTheme(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', t === 'dark');

  if (themeSelect) {
    themeSelect.value = t;
  }
}

//saving chat history
function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(chatHistory));
  } catch (e) {
    console.error('Error saving chat history:', e);
  }
}

//saving interests
function saveInterests () {
  try {
    localStorage.setItem(STORAGE_KEYS.INTERESTS, JSON.stringify(userInterests));
  } catch (e) {
    console.error('error saving interests:',  e);
  }
}

//this function handles loading interests from the local storage
function loadInterests() {
  const raw = localStorage.getItem(STORAGE_KEYS.INTERESTS);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object') {
      userInterests = parsed;
    }
  } catch (e) {
    console.error('error parsing interests:', e);
  }
}

//this method looks for simple keywords in the user's message, e.g. joke
function updateInterestsFromMessage(message) {
  const text = (message || '').toLowerCase();
  const keywordsFound = [];

  //push found keyword to the array
  if (text.includes('help')) keywordsFound.push('help');
  if (text.includes('about')) keywordsFound.push('about');
  if (text.includes('joke')) keywordsFound.push('joke');


  keywordsFound.forEach((k) => {
    userInterests[k] = (userInterests[k] || 0) + 1;
  });

  if (keywordsFound.length > 0) {
    saveInterests();
  }

  return keywordsFound;
}

//make a contextual suggestion based on interests
function buildSuggestion(latestKeywords = []) {
  const allKeys = Object.keys(userInterests);
  if (!allKeys.length) return null;

  //only consider keywords that appear at least twice
  const frequentKeys = allKeys.filter(k => userInterests[k] >= 2);
  if (!frequentKeys.length) return null;

  //prefer an interest that appeared in this message (if any)
  const chosen = frequentKeys.find(k => latestKeywords.includes(k)) || frequentKeys[0];

  if (chosen === 'help') {
    return {
      text: 'Since you often ask for help, here is the help page again. 💡',
      redirect: '/pages/help.html'
    };
  }

  if (chosen === 'about') {
    return {
      text: 'You seem curious about who I am! You can revisit the About page anytime. 🙂',
      redirect: '/pages/about.html'
    };
  }

  if (chosen === 'joke') {
    return {
      text: 'I remember you enjoy jokes — type "joke" again whenever you need a laugh! 😄',
      redirect: null
    };
  }

  return null;
}

function appendMessage(text, sender = 'bot', redirectUrl = null, saveToHistory = true) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message', sender === 'user' ? 'message-user' : 'message-bot');

  const textEl = document.createElement('p');
  textEl.textContent = text;
  messageElem.appendChild(textEl);

  if (sender === 'bot' && redirectUrl) {
    const linkEl = document.createElement('a');
    linkEl.href = redirectUrl;
    
    linkEl.textContent = 'Visit this page';
    linkEl.classList.add('message-link');
    linkEl.target = '_blank';

    messageElem.appendChild(linkEl);
  }

  chatWindow.appendChild(messageElem);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (saveToHistory) {
    chatHistory.push({ text, sender, redirect: redirectUrl });
    saveHistory();
  }
}

async function sendMessage(message) {
  //show user message immediately
  appendMessage(message, 'user');
  const keywordsThisMessage = updateInterestsFromMessage(message);

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      appendMessage('Oops, something went wrong on the server.', 'bot');
      return;
    }

    const data = await response.json();
    const botText = data.message || "I didn't catch that.";

    appendMessage(botText, 'bot', data.redirect);

    

    //add a suggestion based on stored interests
    const suggestion = buildSuggestion(keywordsThisMessage);
    if (suggestion) {
      appendMessage(suggestion.text, 'bot', suggestion.redirect);
    }

    //return focus to the input for keyboard users
    userInput.focus();
  } catch (error) {
    console.error(error);
    appendMessage('Unable to reach the server.', 'bot');
  }
}


chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;
  sendMessage(message);
  userInput.value = '';
});

//loading name and theme
function loadSettings() {
  //loae name
  const storedName = localStorage.getItem(STORAGE_KEYS.NAME);

  if (storedName && nameInput) {
    nameInput.value = storedName;
    //greet users who had a chat before
    appendMessage(`Welcome back, ${storedName}!`, 'bot');
  }

  //load theme
  const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  applyTheme(storedTheme || 'light');
}

function loadHistory() {
  const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      chatHistory = parsed;
      chatHistory.forEach(msg => {
        appendMessage(msg.text, msg.sender, msg.redirect, false);
      });
    }
  } catch (e) {
    console.error('Error parsing chat history:', e);
  }
}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const theme = themeSelect.value;

    try {
      localStorage.setItem(STORAGE_KEYS.NAME, name);
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.error('Error saving settings:', e);
    }

    applyTheme(theme);

    if (name) {
      appendMessage(`Nice to meet you, ${name}!`, 'bot');
    }
  });
}

//CLEAR BUTTON
if (clearChatBtn) {
  clearChatBtn.addEventListener('click', () => {
    //remove/reset only our keys
    try {
      localStorage.removeItem(STORAGE_KEYS.NAME);
      localStorage.removeItem(STORAGE_KEYS.THEME);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem(STORAGE_KEYS.INTERESTS);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }

    chatHistory = [];
    userInterests = {};

    chatWindow.innerHTML = '';

    if (nameInput) nameInput.value = '';

    if (themeSelect) themeSelect.value = 'light';
    applyTheme ('light');

    appendMessage ('Chat cleared.', 'bot');
    userInput.focus();
  });
}


window.addEventListener('DOMContentLoaded', () => {
  loadInterests(); //get interest first
  loadHistory();   //restore previous chat messages
  loadSettings();  //greet by name + apply theme

  if (userInput) {
    userInput.focus();
  }

  //if there were any interest in previous convos
  const suggestion = buildSuggestion();

  if (suggestion) {
    appendMessage ('I remember some of the things you were interested in last time.', 'bot', null, false);
  }
});

