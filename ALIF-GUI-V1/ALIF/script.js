// Sample users data for testing
const users = [{ email: "test@alif.com", password: "password123" }];

// Login function
function login(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Validate user credentials
    const user = users.find(user => user.email === email && user.password === password);
    if (user) {
        alert("Login successful!");
        // Redirect or proceed with application logic
    } else {
        alert("Invalid credentials. Please try again.");
    }
}

// Registration function (for demonstration purposes)
function register(event) {
    event.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    // Simple check to add a new user (for demonstration purposes)
    users.push({ email, password });
    alert("Registration successful! You can now log in.");
    navigateToLogin(); // Navigate back to login page after registration
}

// Toggle registration/login forms (placeholder)
function toggleForms() {
    alert("Redirecting to registration...");
}

// Navigation functions
function navigateToRegister() {
    window.location.href = 'register.html';
}

function navigateToLogin() {
    window.location.href = 'index.html';
}

function redirectToGitHub() {
    // Redirect to GitHub login page
    window.location.href = "https://github.com/login";
}

function navigateToDashboard(){
    window.location.href= "Dashboard.html";
}
function navigateTo(page) {
    switch (page) {
        case 'home':
            window.location.href= 'Dashboard.html';
            break;
        case 'messages':
            alert("Navigating to Messages");
            break;
        case 'progress':
            window.location.href= 'progress.html';
            break;
        case 'calendar':
            alert("Navigating to Calendar");
            break;
        case 'settings':
            window.location.href= 'settings.html';
            break;
        case 'text-summarization':
            window.location.href='text.html';
            break;
        case 'upload-audio':
            window.location.href= 'audio.html';
            break;
        case 'upload-document':
            window.location.href= 'document.html';
            break;
        case 'badges':
            window.location.href= 'badges.html';
            break;
        case 'study-streak':
            window.location.href= 'streak.html';
            break;
        case 'leadersboard':
            window.location.href= 'leadersboard.html';
            break;

        default:
            console.log("Page not found");
    }
}

// Handle audio upload
function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
        // Display audio file details
        const audioDetails = document.getElementById('audio-details');
        audioDetails.textContent = `File Name: ${file.name} | File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;

        // Set up the audio player
        const audioPlayer = document.getElementById('audio-player');
        audioPlayer.src = URL.createObjectURL(file);
        audioPlayer.style.display = 'block';
        
        // Additional feature: Display audio duration
        audioPlayer.onloadedmetadata = () => {
            audioDetails.textContent += ` | Duration: ${Math.floor(audioPlayer.duration)} seconds`;
        };
    } else {
        alert("Please upload a valid audio file.");
    }
}

// Chat functionality
function handleChat(event) {
    if (event.key === 'Enter') {
        sendChat();
    }
}

function sendChat() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    // Get user message
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    // Display user message
    const userMessageElement = document.createElement('p');
    userMessageElement.classList.add('user-message');
    userMessageElement.textContent = userMessage;
    chatMessages.appendChild(userMessageElement);

    // Generate bot response
    const botMessageElement = document.createElement('p');
    botMessageElement.classList.add('bot-message');
    botMessageElement.textContent = generateBotResponse(userMessage);
    chatMessages.appendChild(botMessageElement);

    // Clear input
    chatInput.value = '';
}



// Get all nav links
const navLinks = document.querySelectorAll('.nav-link');

// Get the current page path
const currentPage = window.location.pathname.split("/").pop(); // Get current filename

// Loop through each nav link and add 'active' class if it matches the current page
navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
    }
});



