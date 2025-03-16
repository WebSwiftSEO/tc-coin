// Global Variables
let deferredPrompt;
const dbName = 'TcCoinDB';
let db;
let tcBalance = parseInt(localStorage.getItem('tcBalance')) || 0;
let trustLevel = parseInt(localStorage.getItem('trustLevel')) || 0;
let username = localStorage.getItem('username') || '';
let blocks = JSON.parse(localStorage.getItem('blocks')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
const timeRewardInterval = 60000; // 1 minute

// IndexedDB Setup
const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = (event) => {
    db = event.target.result;
    const blockStore = db.createObjectStore('blocks', { keyPath: 'index', autoIncrement: true });
    const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
    blockStore.createIndex('byTimestamp', 'timestamp');
    messageStore.createIndex('byTimestamp', 'timestamp');
    console.log('Database upgraded and stores created');
};

request.onsuccess = (event) => {
    db = event.target.result;
    console.log('Database opened successfully');

    document.addEventListener('DOMContentLoaded', () => {
        loadData();
    });
};

request.onerror = (event) => {
    console.error('IndexedDB error:', event.target.errorCode);
};

// Load Data
function loadData() {
    if (db) {
        const tx = db.transaction(['blocks', 'messages'], 'readonly');
        const blockStore = tx.objectStore('blocks');
        const messageStore = tx.objectStore('messages');

        blockStore.getAll().onsuccess = (e) => {
            blocks = e.target.result;
            updateFeed();
        };

        messageStore.getAll().onsuccess = (e) => {
            messages = e.target.result;
            updateMessages();
        };
    }

    const tcBalanceElement = document.getElementById('tcBalance');
    const trustLevelElement = document.getElementById('trustLevel');
    const usernameDisplayElement = document.getElementById('usernameDisplay');
    const installBtn = document.getElementById('installBtn');

    if (tcBalanceElement) tcBalanceElement.textContent = `Tc Balance: ${tcBalance}`;
    if (trustLevelElement) trustLevelElement.textContent = `Trust Level: ${trustLevel}`;
    if (usernameDisplayElement) usernameDisplayElement.textContent = username || 'Set your username';
    if (installBtn) installBtn.style.display = 'inline-flex'; // Show install button
}

// PWA Setup
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'inline-flex';
});

window.addEventListener('appinstalled', () => {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'none';
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') console.log('User accepted the install prompt');
            deferredPrompt = null;

            const installBtn = document.getElementById('installBtn');
            if (installBtn) installBtn.style.display = 'none';
        }).catch((error) => console.error('Install prompt failed:', error));
    } else {
        alert('PWA installation is not available at this time.');
    }
}

// Modal Navigation
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

function openProfile() {
    closeAllModals();
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'block';
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
}

function openFeed() {
    closeAllModals();
    const modal = document.getElementById('feedModal');
    if (modal) modal.style.display = 'block';
    updateLeaderboard();
    updateFeed();
}

function closeFeedModal() {
    const modal = document.getElementById('feedModal');
    if (modal) modal.style.display = 'none';
}

function openGroups() {
    closeAllModals();
    const modal = document.getElementById('groupsModal');
    if (modal) modal.style.display = 'block';
    updateMessages();
}

function closeGroupsModal() {
    const modal = document.getElementById('groupsModal');
    if (modal) modal.style.display = 'none';
}

function showInfoModal() {
    closeAllModals();
    const modal = document.getElementById('infoModal');
    if (modal) modal.style.display = 'block';
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) modal.style.display = 'none';
    });
};

// Blockchain Logic
function createBlock(action, amount, trust = trustLevel, data = {}) {
    const index = blocks.length;
    const timestamp = new Date().toISOString();
    const previousHash = index > 0 ? blocks[index - 1].hash : '0';

    const blockData = { index, timestamp, action, amount, trustLevel: trust, previousHash, data };
    blockData.hash = calculateHash(blockData);
    blockData.signature = `mock-signature-${index}`;

    blocks.push(blockData);

    if (db) {
        const tx = db.transaction('blocks', 'readwrite');
        tx.objectStore('blocks').put(blockData);
        tx.oncomplete = () => console.log('Block saved to IndexedDB');
        tx.onerror = (e) => console.error('Error saving block:', e.target.error);
    }

    localStorage.setItem('blocks', JSON.stringify(blocks));
    updateFeed();
    return blockData;
}

function calculateHash(block) {
    return btoa(JSON.stringify(block)).substring(0, 16);
}

function earnTc(amount, action) {
    createBlock(action, amount, trustLevel + 1);

    tcBalance += amount;
    trustLevel = Math.min(10, trustLevel + 1);

    localStorage.setItem('tcBalance', tcBalance);
    localStorage.setItem('trustLevel', trustLevel);

    const tcBalanceElement = document.getElementById('tcBalance');
    const trustLevelElement = document.getElementById('trustLevel');

    if (tcBalanceElement) tcBalanceElement.textContent = `Tc Balance: ${tcBalance}`;
    if (trustLevelElement) trustLevelElement.textContent = `Trust Level: ${trustLevel}`;

    alert(`Earned ${amount} Tc for ${action}! Trust Level: ${trustLevel}`);
}

// Troanary Spin Wheel
function spinForTc() {
    const wheel = document.getElementById('spinWheel');
    if (!wheel) return;

    const spinDegrees = Math.floor(Math.random() * 360) + 720;
    wheel.style.transform = `rotate(${spinDegrees}deg)`;

    const reward = Math.floor(Math.random() * 20) + 1;
    setTimeout(() => earnTc(reward, 'spin'), 3000);
}

// Time-Based Rewards
setInterval(() => {
    if (document.visibilityState === 'visible') earnTc(1, 'time');
}, timeRewardInterval);

// Wallet & Transactions
function setUsername() {
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) return;

    const newUsername = usernameInput.value.trim();

    if (newUsername && !users.includes(newUsername)) {
        username = newUsername;
        localStorage.setItem('username', username);

        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) usernameDisplay.textContent = username;

        users.push(username);
        localStorage.setItem('users', JSON.stringify(users));

        alert(`Username set to ${username}!`);
    } else if (users.includes(newUsername)) {
        alert('Username already taken!');
    } else {
        alert('Please enter a valid username!');
    }
}

function sendTc() {
    const amount = parseInt(prompt('Enter amount to send:'));
    const toUser = prompt('Enter username to send to:');

    if (amount > 0 && amount <= tcBalance && toUser && users.includes(toUser) && toUser !== username) {
        tcBalance -= amount;
        createBlock('send', -amount, trustLevel, { to: toUser });

        localStorage.setItem('tcBalance', tcBalance);

        const tcBalanceElement = document.getElementById('tcBalance');
        if (tcBalanceElement) tcBalanceElement.textContent = `Tc Balance: ${tcBalance}`;

        alert(`Sent ${amount} Tc to ${toUser}!`);
    } else {
        alert('Invalid amount, insufficient balance, or invalid recipient!');
    }
}

function receiveTc() {
    const amount = Math.floor(Math.random() * 10) + 1;
    earnTc(amount, 'receive');
}

function generateQR() {
    const qrCode = document.getElementById('qrCode');
    if (!qrCode) return;

    qrCode.innerHTML = '';
    const qrData = `TcCoin:${username}:${tcBalance}`;

    const canvas = document.createElement('canvas');
    qrCode.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;

    ctx.fillStyle = '#fff';

    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            if (Math.random() > 0.5) ctx.fillRect(i * 10, j * 10, 8, 8);
        }
    }

    console.log('QR Code generated for:', qrData);
}

function bluetoothSync() {
    alert('Bluetooth sync is not yet implemented. Use QR codes or username search.');
}

// Feed & Leaderboard
function updateFeed() {
    const feed = document.getElementById('feedContent');
    if (!feed) {
        console.warn('Feed element not found. Skipping updateFeed.');
        return;
    }

    if (!blocks.length) {
        feed.innerHTML = '<p>No transactions yet.</p>';
        return;
    }

    feed.innerHTML = blocks.map(b => `<p>${b.timestamp}: ${b.action} ${b.amount} Tc (Trust: ${b.trustLevel})</p>`).join('');
}

function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;

    if (!users.length) {
        leaderboard.innerHTML = '<li>No users yet.</li>';
        return;
    }

    leaderboard.innerHTML = users.map(u => `<li>${u}: Trust Level ${trustLevel}</li>`).join('');
}

// Groups & Messages
function searchUser() {
    const queryInput = document.getElementById('searchUser');
    if (!queryInput) return;

    const query = queryInput.value.trim();

    if (query && users.includes(query)) {
        alert(`User ${query} found! You can send Tc to them.`);
    } else {
        alert('User not found!');
    }
}

function postMessage() {
    const messageInput = document.getElementById('groupMessage');
    if (!messageInput) return;

    const message = messageInput.value.trim();

    if (message && username) {
        const msg = {
            id: Date.now(),
            text: message,
            timestamp: new Date().toISOString(),
            sender: username
        };

        messages.push(msg);

        if (db) {
            const tx = db.transaction('messages', 'readwrite');
            tx.objectStore('messages').add(msg);
            tx.oncomplete = () => console.log('Message saved to IndexedDB');
            tx.onerror = (e) => console.error('Error saving message:', e.target.error);
        }

        localStorage.setItem('messages', JSON.stringify(messages));

        messageInput.value = '';
        updateMessages();
    } else {
        alert('Please set a username and enter a message!');
    }
}

function updateMessages() {
    const groupList = document.getElementById('groupList');
    if (!groupList) {
        console.warn('Group list element not found. Skipping updateMessages.');
        return;
    }

    if (!messages.length) {
        groupList.innerHTML = '<li>No messages yet.</li>';
        return;
    }

    groupList.innerHTML = messages.map(m => `<li>${m.timestamp} - ${m.sender}: ${m.text}</li>`).join('');
}

// Sharing
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Tc Coin Blockchain',
            text: 'Join me on Tc Coin Blockchain! Earn Tc through time and trust.',
            url: 'https://webswiftseo.github.io/tc-coin/'
        }).then(() => earnTc(5, 'share'))
        .catch((error) => console.error('Share failed:', error));
    } else {
        navigator.clipboard.writeText('https://webswiftseo.github.io/tc-coin/')
            .then(() => {
                earnTc(5, 'share');
                alert('Link copied to clipboard!');
            })
            .catch((error) => console.error('Clipboard failed:', error));
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/tc-coin/service-worker.js')
        .then((registration) => console.log('Service Worker registered:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
}
