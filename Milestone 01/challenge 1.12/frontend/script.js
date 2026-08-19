const messages = [];

const chatDisplay = document.getElementById('chatDisplay');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const backendUrl = window.CHAT_API_URL || (window.location.protocol === 'file:' ? 'http://localhost:3000' : '');

function renderMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    messageDiv.textContent = content;
    chatDisplay.appendChild(messageDiv);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    messageInput.disabled = isLoading;
    sendBtn.textContent = isLoading ? 'Thinking…' : 'Send';
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || sendBtn.disabled) return;

    messages.push({ role: 'user', content: text });
    renderMessage('user', text);
    messageInput.value = '';
    setLoading(true);

    try {
        const response = await fetch(`${backendUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'The backend could not complete the request.');
        }

        messages.push({ role: 'assistant', content: data.reply });
        renderMessage('assistant', data.reply);
    } catch (error) {
        renderMessage('assistant', `Error: ${error.message}`);
    } finally {
        setLoading(false);
        messageInput.focus();
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
