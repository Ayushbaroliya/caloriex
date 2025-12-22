let messageInput, sendButton, chatBox;

// Backend URL
const BACKEND_URL = "http://localhost:5000";

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', initAIChat);

function initAIChat() {
    messageInput = document.getElementById('aiInput');
    sendButton = document.getElementById('aiSendBtn');
    chatBox = document.getElementById('aiChatBox');

    // Set up event listeners only if elements exist
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keypress', handleInputKeypress);
        messageInput.focus();
    }

    // If first time opening, setup the AI context
    if (conversationHistory.length === 0) {
        setupAIContext();
    }
}

// This list stores the conversation so the AI remembers what we talked about
let conversationHistory = [];

// ==========================================
// HANDLE INPUT
// ==========================================

function handleInputKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// ==========================================
// MAIN LOGIC
// ==========================================

// This function teaches the AI about the user before the chat starts
function setupAIContext() {
    // Get the data we saved in diet.js
    const savedData = localStorage.getItem("userMetrics");
    const userData = savedData ? JSON.parse(savedData) : null;

    let instructions = "You are a helpful nutrition assistant named 'CalorieX AI'. Keep answers short and encouraging.";

    // If we have user data, add it to the instructions
    if (userData) {
        instructions += `
            The user is a ${userData.age} year old ${userData.gender}.
            Weight: ${userData.weight}kg, Height: ${userData.heightFeet}ft ${userData.heightInches}in.
            Their goal is ${userData.dailyCalories.toFixed(0)} calories per day.
            Protein goal: ${userData.dailyProtein}g. Carbs goal: ${userData.dailyCarbs}g.
            Use this info to give specific advice.
        `;
    }

    // Add these secret instructions to the history (hidden from user)
    conversationHistory.push({
        role: "user",
        parts: [{ text: instructions }]
    });

    // Add a fake reply from AI so it knows to wait for the user next
    conversationHistory.push({
        role: "model",
        parts: [{ text: "Got it. I know the user's details now." }]
    });
}

// This runs when the user tries to send a message
async function sendMessage() {
    const text = messageInput.value.trim();
    
    // If the box is empty, don't do anything
    if (!text || !messageInput || !chatBox || !sendButton) return;

    // 1. Show User's message on the screen
    addMessageToScreen(text, 'user-message');
    
    // Clear the input box and disable it so they can't spam
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;

    // 2. Add User's message to the history list
    conversationHistory.push({
        role: "user",
        parts: [{ text: text }]
    });

    // 3. Show a "Thinking..." bubble
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'ai-message';
    loadingBubble.innerHTML = '<em>Thinking...</em>';
    chatBox.appendChild(loadingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // Call backend proxy instead of Gemini API directly
        const response = await fetch(`${BACKEND_URL}/api/ai-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                conversationHistory: conversationHistory
            })
        });

        const data = await response.json();

        // Remove the "Thinking..." bubble
        if (loadingBubble.parentNode) {
            chatBox.removeChild(loadingBubble);
        }

        if (!response.ok) {
            addMessageToScreen(`Error: ${data.error || 'Failed to get response'}`, '');
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
            return;
        }

        if (data.candidates && data.candidates.length > 0) {
            // Get the AI's reply text
            const aiReply = data.candidates[0].content.parts[0].text;

            // Make **bold** text look nice (simple HTML formatting)
            const cleanReply = aiReply
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');

            // 5. Show AI's message on screen
            addMessageToScreen(cleanReply, '', true);

            // 6. Save AI's message to history
            conversationHistory.push({
                role: "model",
                parts: [{ text: aiReply }]
            });
        } else {
            const errorMsg = data.error?.message || "Sorry, I'm having trouble connecting.";
            addMessageToScreen(errorMsg, '');
        }

    } catch (error) {
        console.error("AI Chat Error:", error);
        // Remove loading bubble if it's still there
        if (loadingBubble.parentNode) {
            chatBox.removeChild(loadingBubble);
        }
        addMessageToScreen("⚠ Error: Please check if backend server is running on " + BACKEND_URL, '');
    }

    // Re-enable the input box
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
}

// Helper function to create the HTML bubbles
function addMessageToScreen(text, className, isHtml = false) {
    if (!chatBox) return;
    
    const div = document.createElement('div');
    div.className = `ai-message ${className}`.trim();
    
    if (isHtml) {
        div.innerHTML = text;
    } else {
        div.textContent = text;
    }
    
    chatBox.appendChild(div);
    // Auto-scroll to the newest message
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 0);
}