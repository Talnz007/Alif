// Backend API Endpoints
const analyzePdfApi = "http://localhost:8000/api/v1/analyze-pdf/";
const chatApi = "http://localhost:8000/api/v1/chat";

// To store the conversation context
let conversationContext = [];

// Handles document upload
function handleDocumentUpload(event) {
    const file = event.target.files[0];
    const detailsElement = document.getElementById("document-details");
    const startButton = document.getElementById("start-summarization");

    if (file && file.name.endsWith(".pdf")) {
        detailsElement.textContent = `Uploaded: ${file.name}`;
        startButton.disabled = false; // Enable the button
    } else {
        detailsElement.textContent = "Invalid file type. Please upload a PDF document.";
        startButton.disabled = true; // Disable the button
    }
}

async function fetchRecommendations(query) {
    const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (data.success) {
        displayRecommendations(data.videos);
    }
}

function displayRecommendations(videos) {
    const container = document.querySelector('#recommendationsContainer');
    container.innerHTML = ""; // Clear previous content
    videos.forEach(video => {
        const videoElement = document.createElement('a');
        videoElement.href = video.url;
        videoElement.textContent = video.title;
        container.appendChild(videoElement);
    });
}



// Start summarizing the document
async function startSummarization() {
    const fileInput = document.getElementById("document-upload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a document first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch(analyzePdfApi, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            const summary = data.analysis;

            // Display the summary to the user
            document.getElementById("document-chat-messages").innerHTML = `
                <p><strong>Summary:</strong></p>
                <p>${summary}</p>
            `;

            // Add summary to conversation context
            conversationContext.push({
                role: "system",
                content: `Document summary: ${summary}`
            });

        } else {
            const error = await response.json();
            alert(`Error: ${error.detail}`);
        }
    } catch (err) {
        console.error("Error during summarization:", err);
        alert("Failed to summarize the document. Please try again.");
    }
}

async function sendDocumentChat(query) {
    const inputBox = document.getElementById("document-chat-input");
    const chatMessages = document.getElementById("document-chat-messages");

    if (!query && inputBox.value.trim() === "") {
        alert("Please type a message");
        return;
    }

    query = query || inputBox.value.trim(); // Use query if provided or take value from input
    inputBox.value = ""; // Clear input box after sending the message

    // Add user's message to the chat UI
    addChatMessage(query, "user");

    try {
        const response = await fetch(chatApi, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, context: conversationContext }),
        });

        if (response.ok) {
            const data = await response.json();
            addChatMessage(data.response, "bot");
        } else {
            const error = await response.json();
            alert(`Error: ${error.detail}`);
        }
    } catch (err) {
        console.error("Error during chat:", err);
        alert("Chat failed. Please try again.");
    }
}



function addChatMessage(message, sender) {
  const chatMessages = document.getElementById("document-chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = `message ${sender}`;
  messageElement.innerHTML = `<strong>${sender === "bot" ? "Bot" : "You"}: </strong> ${message}`;
  chatMessages.appendChild(messageElement);

  // Scroll to the latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send document-related chat


// Add a message to the chat interface


// Handling the user message input and bot reply
async function sendChat() {
    const chatInput = document.getElementById("chat-input");
    const query = chatInput.value.trim();

    if (!query) {
        alert('Please type a message');
        return;
    }

    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML += `<p class="user-message"><strong>You:</strong> ${query}</p>`;

    // Scroll to the bottom immediately after adding the user's message
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Clear input after the message is sent
    chatInput.value = '';

    try {
        // Push user message to conversation context
        conversationContext.push({
            role: 'user',
            content: query
        });

        // Send the chat to the backend
        const response = await fetch(chatApi, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                context: conversationContext
            }),
        });

        const data = await response.json();

        if (data.success) {
            const botResponse = data.data.response;
            chatMessages.innerHTML += `<p class="bot-message"><strong>Bot:</strong> ${botResponse}</p>`;

            // Add bot's response to conversation context
            conversationContext.push({
                role: 'assistant',
                content: botResponse
            });

            // Scroll to the bottom after bot message
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            alert(data.message || 'Chatbot processing failed');
        }
    } catch (error) {
        console.error('Chat error:', error);
        alert('Communication with chatbot failed');
    }
}

// Handling document chat input and submit
function handleDocumentChat(event) {
    if (event.key === "Enter") {
        const inputBox = event.target;
        sendDocumentChat(inputBox.value);
        inputBox.value = ""; // Clear input field after sending message
    }
}


// Drag-and-drop functionality for document upload
const dropZone = document.getElementById("document-drop-zone");

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("active");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("active");
});

document.getElementById("chatInputBox").addEventListener("submit", (event) => {
    event.preventDefault();
    const inputBox = document.getElementById("userInput");
    sendMessageToBot(inputBox.value);
    inputBox.value = ""; // Clear the input box
});


dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("active");

    const file = event.dataTransfer.files[0];
    if (file) {
        document.getElementById("document-upload").files = event.dataTransfer.files;
        handleDocumentUpload({ target: { files: [file] } });
    }
});
