let deferredPrompt;
const blocks = JSON.parse(localStorage.getItem('blocks')) || [];
let tcBalance = parseInt(localStorage.getItem('tcBalance')) || 0;
let chatMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'inline-block';
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

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: 'Tc Coin Blockchain',
            text: 'Join me on Tc Coin Blockchain! Earn Tc through time and trust.',
            url: window.location.href
        }).then(() => earnTc(5, 'share')).catch(() => alert('Share failed, link copied'));
    } else navigator.clipboard.writeText(window.location.href).then(() => earnTc(5, 'share'));
}

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

function showProfile() { showSection('profileSection'); updateBalance(); }
function showFeed() { showSection('feedSection'); }
function showGroups() { showSection('groupsSection'); }

function updateBalance() {
    document.getElementById('tcBalance').textContent = `Tc Balance: ${tcBalance}`;
    localStorage.setItem('tcBalance', tcBalance);
}

function createBlock(action, amount, trustLevel = 1, data = {}) {
    const index = blocks.length;
    const timestamp = new Date().toISOString();
    const previousHash = index > 0 ? blocks[index - 1].hash : '0';
    const blockData = { index, timestamp, action, amount, trustLevel, previousHash, data };
    blockData.hash = calculateHash(blockData);
    blockData.signature = 'mock-signature-' + index; // Placeholder
    blocks.push(blockData);
    localStorage.setItem('blocks', JSON.stringify(blocks));
    updateFeed();
    return blockData;
}

function calculateHash(block) {
    return btoa(JSON.stringify(block)).substring(0, 16);
}

function earnTc(amount, action) {
    const trustLevel = Math.floor(Math.random() * 10) + 1;
    createBlock(action, amount, trustLevel);
    tcBalance += amount;
    updateBalance();
    alert(`Earned ${amount} Tc for ${action}! Trust Level: ${trustLevel}`);
}

function spinWheel() {
    const wheel = document.getElementById('wheel');
    wheel.classList.add('spinning');
    const reward = Math.floor(Math.random() * 20) + 1;
    setTimeout(() => {
        wheel.classList.remove('spinning');
        earnTc(reward, 'spin');
    }, 2000);
}

function sendTc() {
    const amount = prompt('Enter amount to send:');
    if (amount && amount <= tcBalance) {
        tcBalance -= amount;
        createBlock('send', -amount, 5, { to: 'peer' });
        updateBalance();
        alert(`Sent ${amount} Tc!`);
    } else alert('Invalid amount or insufficient balance');
}

function receiveTc() {
    const amount = Math.floor(Math.random() * 10) + 1;
    earnTc(amount, 'receive');
}

function updateFeed() {
    const feed = document.getElementById('feedContent');
    feed.innerHTML = blocks.map(b => `<p>${b.timestamp}: ${b.action} ${b.amount} Tc (Trust: ${b.trustLevel})</p>`).join('');
}

function sendMessage() {
    const message = document.getElementById('chatInput').value;
    if (message) {
        const msg = { text: message, timestamp: new Date().toLocaleTimeString(), sender: 'You' };
        chatMessages.push(msg);
        localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
        document.getElementById('chatInput').value = '';
        updateChat();
    }
}

function updateChat() {
    const chatLog = document.getElementById('chatLog');
    chatLog.innerHTML = chatMessages.map(m => `<li>${m.timestamp} - ${m.sender}: ${m.text}</li>`).join('');
}

function searchGroups() { alert('Search Groups feature coming soon!'); }
function createGroup() { alert('Create Group feature coming soon!'); }

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/Tc-Coin-Blockchain/service-worker.js');
}
