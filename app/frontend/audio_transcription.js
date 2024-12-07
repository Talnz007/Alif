const BASE_URL = 'http://127.0.0.1:8000/api/v1';

let audioFile = null;
let conversationContext = []; // To maintain conversation history

async function handleAudioUpload(event) {
    const fileInput = document.getElementById('audio-upload');
    audioFile = fileInput.files[0];

    if (!audioFile) {
        alert('Please select a file!');
        return;
    }

    document.getElementById('audio-details').innerText = `File: ${audioFile.name}`;
    document.getElementById('audio-player').style.display = 'block';
    document.getElementById('audio-player').src = URL.createObjectURL(audioFile);

    document.getElementById('start-transcription').disabled = false;
}

async function uploadAudio() {
    if (!audioFile) {
        alert('Please upload an audio file first.');
        return;
    }

    const formData = new FormData();
    formData.append('file', audioFile);

    updateProgressBar();
    const startButton = document.getElementById('start-transcription');
    startButton.disabled = true;

    try {
        const response = await fetch(`${BASE_URL}/transcribe`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            // Create Download Button
            createDownloadButton(data.data.transcription);

            // Add transcription summary to conversation context
            conversationContext.push({
                role: 'system',
                content: `Transcription summary: ${data.data.transcription}`
            });

            // Send initial summary to chatbot
            await sendInitialChatToBot(data.data.transcription);

            focusOnChat();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Transcription error:', error);
    } finally {
        resetProgressBar();
        startButton.disabled = false;
    }
}

async function sendInitialChatToBot(transcription) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML += `<p><strong>Bot:</strong> Audio transcription complete. I'm ready to answer questions about the transcript!</p>`;

    // Fetch and display YouTube recommendations
    await fetchYouTubeRecommendations(transcription);
}

async function fetchYouTubeRecommendations(query) {
    try {
        const response = await fetch(`${BASE_URL}/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (data.success) {
            displayYouTubeRecommendations(data.videos);
        } else {
            console.error('Failed to fetch YouTube recommendations:', data.message);
        }
    } catch (error) {
        console.error('Error fetching YouTube recommendations:', error);
    }
}

function displayYouTubeRecommendations(videos) {
    const recommendationsDiv = document.getElementById('recommendations');
    recommendationsDiv.innerHTML = '<h3>Recommended Watch:</h3>';

    if (videos.length === 0) {
        recommendationsDiv.innerHTML += '<p>No recommendations found.</p>';
        return;
    }

    videos.forEach((video, index) => {
        const videoLink = document.createElement('a');
        videoLink.href = video.url;
        videoLink.target = '_blank';
        videoLink.textContent = `${index + 1}. ${video.title}`;
        recommendationsDiv.appendChild(videoLink);
        recommendationsDiv.appendChild(document.createElement('br'));
    });
}

async function sendChat() {
    const chatInput = document.getElementById('chat-input');
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
        conversationContext.push({
            role: 'user',
            content: query
        });

        const response = await fetch(`${BASE_URL}/chat`, {
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

        // Add a check for valid response structure
        if (data && data.success && data.response) {
            const botResponse = data.response;  // Adjusted here
            chatMessages.innerHTML += `<p class="bot-message"><strong>Bot:</strong> ${botResponse}</p>`;

            conversationContext.push({
                role: 'assistant',
                content: botResponse
            });

            // Scroll to the bottom after bot message
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Fetch YouTube recommendations for the query
            await fetchYouTubeRecommendations(query);
        } else {
            console.error("Invalid response format:", data);
            alert(data.message || 'Chatbot processing failed');
        }

    } catch (error) {
        console.error('Chat error:', error);
        alert('Communication with chatbot failed');
    }
}


function createDownloadButton(transcription) {
    const downloadButton = document.getElementById('download-pdf');
    downloadButton.style.display = 'inline-block'; // Show the button
    downloadButton.onclick = () => downloadAsPDF(transcription); // Attach the function
}

function downloadAsPDF(transcription) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 10;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 10;

    // Split text into lines that fit the width of the PDF
    const lines = doc.splitTextToSize(transcription, 180); // Adjust 180 based on your layout
    let cursorY = margin;

    lines.forEach((line) => {
        if (cursorY + lineHeight > pageHeight - margin) {
            doc.addPage(); // Add a new page if the text exceeds the current page
            cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
    });

    doc.save('audio_transcription.pdf');
}

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default behavior (like form submission)
            sendChat(); // Call the function
        }
    });
});
