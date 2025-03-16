let deferredPrompt;
const dbName = 'TcCoinBlockchainDB';
let db;
let tcBalance = 0;
let trustLevel = 0;
let username = '';
let blocks = [];
let messages = [];
let users = JSON.parse(localStorage.getItem('users')) || [];
const timeRewardInterval = 60000; // 1 minute

// IndexedDB Setup
const request = indexedDB.open(dbName, 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore('blocks', { keyPath: 'index' });
    db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
};
request.onsuccess = (e) => {
    db = e.target.result;
    loadData();
};
request.onerror = (e) => console.error('IndexedDB error:', e);

// Load Data
function loadData() {
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
    tcBalance = parseInt(localStorage.getItem('tcBalance')) || 0;
    trustLevel = parseInt(localStorage.getItem('trustLevel')) || 0;
    username = localStorage.getItem('username') || '';
    document.getElementById('tcBalance').textContent = `Tc Balance: ${tcBalance}`;
    document.getElementById('trustLevel').textContent = `Trust Level: ${trustLevel}`;
    document.getElementById('usernameDisplay').textContent = username || 'Set your username';
}

// PWA Setup
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        document.getElementById('installBtn').style.display = 'inline-block';
    }
});
window.addEventListener('appinstalled', () => {
    document.getElementById('installBtn').style.display = 'none';
});
function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => document.getElementById('installBtn').style.display = 'none');
    } else alert('Install not available');
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}
function showProfile() { showSection('profileSection'); }
function showFeed() { showSection('feedSection'); updateLeaderboard(); }
function showGroups() { showSection('groupsSection'); updateMessages(); }

// Blockchain Logic
function createBlock(action, amount, trust = trustLevel, data = {}) {
    const index = blocks.length;
    const timestamp = new Date().toISOString();
    const previousHash = index > 0 ? blocks[index - 1].hash : '0';
    const blockData = { index, timestamp, action, amount, trustLevel: trust, previousHash, data };
    blockData.hash = calculateHash(blockData);
    blockData.signature = 'mock-signature-' + index;
    blocks.push(blockData);
    const tx = db.transaction('blocks', 'readwrite');
    tx.objectStore('blocks').put(blockData);
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
    document.getElementById('tcBalance').textContent = `Tc Balance: ${tcBalance}`;
    document.getElementById('trustLevel').textContent = `Trust Level: ${trustLevel}`;
    alert(`Earned ${amount} Tc for ${action}! Trust Level: ${trustLevel}`);
}

// Troanary Spin Wheel
function spinWheel() {
    const wheel = document.getElementById('wheel');
    wheel.classList.add('spinning');
    const reward = Math.floor(Math.random() * 20) + 1;
    setTimeout(() => {
        wheel.classList.remove('spinning');
        earnTc(reward, 'spin');
    }, 2000);
}

// Time-Based Rewards
setInterval(() => {
    if (document.visibilityState === 'visible') {
        earnTc(1, 'time');
    }
}, timeRewardInterval);

// Wallet & Transactions
function setUsername() {
    const newUsername = document.getElementById('usernameInput').value.trim();
    if (newUsername) {
        username = newUsername;
        localStorage.setItem('username', username);
        document.getElementById('usernameDisplay').textContent = username;
        users = users.filter(u => u !== username);
        users.push(username);
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function sendTc() {
    const amount = parseInt(prompt('Enter amount to send:'));
    const toUser = prompt('Enter username to send to:');
    if (amount && amount <= tcBalance && toUser && users.includes(toUser)) {
        tcBalance -= amount;
        createBlock('send', -amount, trustLevel, { to: toUser });
        localStorage.setItem('tcBalance', tcBalance);
        document.getElementById('tcBalance').textContent = `Tc Balance: ${tcBalance}`;
        alert(`Sent ${amount} Tc to ${toUser}!`);
    } else alert('Invalid amount, username, or insufficient balance');
}

function receiveTc() {
    const amount = Math.floor(Math.random() * 10) + 1;
    earnTc(amount, 'receive');
}

function generateQR() {
    const qrCode = document.getElementById('qrCode');
    qrCode.innerHTML = '';
    const qrData = JSON.stringify({ username, balance: tcBalance });
    const canvas = document.createElement('canvas');
    qrCode.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    // Mock QR code generation (simplified visual)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            if (Math.random() > 0.5) {
                ctx.fillRect(i * 10, j * 10, 8, 8);
            }
        }
    }
}

function bluetoothSync() {
    alert('Bluetooth sync coming soon! For now, use QR codes or username search.');
}

// Feed & Leaderboard
function updateFeed() {
    const feed = document.getElementById('feedContent');
    feed.innerHTML = blocks.map(b => `<p>${b.timestamp}: ${b.action} ${b.amount} Tc (Trust: ${b.trustLevel})</p>`).join('');
}

function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = users.map(u => `<li>${u}: Trust Level ${trustLevel}</li>`).join('');
}

// Groups & Messages
function searchUser() {
    const query = document.getElementById('searchUser').value.trim();
    if (query && users.includes(query)) {
        alert(`Found user: ${query}`);
    } else alert('User not found');
}

function postMessage() {
    const message = document.getElementById('groupMessage').value.trim();
    if (message) {
        const msg = { text: message, timestamp: new Date().toISOString(), sender: username };
        messages.push(msg);
        const tx = db.transaction('messages', 'readwrite');
        tx.objectStore('messages').add(msg);
        document.getElementById('groupMessage').value = '';
        updateMessages();
    }
}

function updateMessages() {
    const groupList = document.getElementById('groupList');
    groupList.innerHTML = messages.map(m => `<li>${m.timestamp} - ${m.sender}: ${m.text}</li>`).join('');
}

// Sharing
function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Tc Coin Blockchain',
            text: 'Join me on Tc Coin Blockchain! Earn Tc through time and trust.',
            url: window.location.href
        }).then(() => earnTc(5, 'share')).catch(() => alert('Share failed'));
    } else navigator.clipboard.writeText(window.location.href).then(() => earnTc(5, 'share'));
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Tc-Coin-Blockchain/service-worker.js');
}
