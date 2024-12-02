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
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href === window.location.href) {
        link.classList.add('active');
    }
});


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

/*progress bar dynamics*/
function updateProgress(activity, maxDays) {
    const inputField = document.getElementById(`${activity}-input`);
    const progressBar = document.getElementById(`${activity}-progress`);
    const daysDisplay = document.getElementById(`${activity}-days`);

    // Get the input value
    const inputValue = parseInt(inputField.value, 10);

    // Validate input value
    if (isNaN(inputValue) || inputValue < 0 || inputValue > maxDays) {
        alert(`Please enter a value between 0 and ${maxDays}.`);
        return;
    }

    // Calculate the percentage
    const progressPercentage = (inputValue / maxDays) * 100;

    // Update the progress bar and displayed text
    progressBar.style.width = `${progressPercentage}%`;
    daysDisplay.textContent = inputValue;
}

var tabs = document.querySelectorAll(".lboard_tabs ul li");
var today = document.querySelector(".today");
var month = document.querySelector(".month");
var year = document.querySelector(".year");
var items = document.querySelectorAll(".lboard_item");

tabs.forEach(function(tab){
	tab.addEventListener("click", function(){
		var currenttab = tab.getAttribute("data-li");
		
		tabs.forEach(function(tab){
			tab.classList.remove("active");
		})

		tab.classList.add("active");

		items.forEach(function(item){
			item.style.display = "none";
		})

		if(currenttab == "today"){
			today.style.display = "block";
		}
		else if(currenttab == "month"){
			month.style.display = "block";
		}
		else{
			year.style.display = "block";
		}

	})
})

// Handle file upload
function handleDocumentUpload(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    
    // Check if the uploaded file is a PDF
    if (file && file.type === "application/pdf") {
        const documentDetails = document.getElementById("document-details");
        documentDetails.textContent = `Uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    } else {
        alert("Please upload a valid PDF document.");
        fileInput.value = ""; // Reset the input
    }
}

// Handle chat input on 'Enter' key press
function handleDocumentChat(event) {
    if (event.key === "Enter") {
        sendDocumentChat();
    }
}

// Send a chat message
function sendDocumentChat() {
    const chatInput = document.getElementById("document-chat-input");
    const chatMessages = document.getElementById("document-chat-messages");
    const userMessage = chatInput.value.trim();

    if (userMessage) {
        // Display user's message
        const userBubble = document.createElement("div");
        userBubble.classList.add("chat-bubble", "user");
        userBubble.textContent = userMessage;
        chatMessages.appendChild(userBubble);

        // Clear the input field
        chatInput.value = "";

        // Simulate a bot response
        setTimeout(() => {
            const botBubble = document.createElement("div");
            botBubble.classList.add("chat-bubble", "bot");
            botBubble.textContent = `You asked: "${userMessage}". This is a placeholder response.`;
            chatMessages.appendChild(botBubble);

            // Scroll to the latest message
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }
}
