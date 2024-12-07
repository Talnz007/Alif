// Sample users data for testing (this can be removed when backend is integrated)

// Login function
function login(event) {
    event.preventDefault(); // Prevent default form submission

    const email = document.getElementById("email").value; // Get email from form
    const password = document.getElementById("password").value; // Get password from form

    const token = localStorage.getItem("token"); // Get JWT token from localStorage if available

    // Send login request to backend
    fetch('http://127.0.0.1:8000/api/v1/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
})
    .then(async (response) => {
        console.log("HTTP Status Code:", response.status); // Log the status code

        const data = await response.json();
        console.log("Response Data:", data); // Log the entire response body

        if (response.ok && data.access_token) {
            alert("Login successful!");
            localStorage.setItem('token', data.access_token); // Save the token
            window.location.href = 'dashboard.html'; // Redirect on success
        } else {
            alert(data.detail || "Login failed. Please try again."); // Show error
        }
    })
    .catch((error) => {
        console.error("Fetch Error:", error); // Log fetch/network issues
        alert("Something went wrong. Please check the console.");
    });


}

// Registration function (for demonstration purposes)
function register(event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById("registerUsername").value;  // Get username from form
    const email = document.getElementById("registerEmail").value;        // Get email from form
    const password = document.getElementById("registerPassword").value;  // Get password from form

    // Send registration request to backend
    fetch('http://127.0.0.1:8000/api/v1/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),  // Send username, email, and password to the backend
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {  // Check for access token in the response
            alert("Registration successful! You can now log in.");
            navigateToLogin();
        } else {
            alert("Registration failed. Please try again.");
        }
    })
    .catch(error => {
        console.error('Error during registration:', error);
        alert("Something went wrong. Please try again later.");
    });
}



// Handle form submission for login
document.getElementById("login-form").addEventListener("submit", login);

// Handle form submission for registration
document.getElementById("register-form").addEventListener("submit", register);

// Navigation functions
function navigateToRegister() {
    window.location.href = 'register.html';  // Redirect to the registration page
}

function navigateToLogin() {
    window.location.href = 'index.html';  // Redirect to the login page
}

function redirectToGitHub() {
    window.location.href = "https://github.com/login";  // Redirect to GitHub login
}

function navigateToDashboard() {
    window.location.href = 'dashboard.html';  // Redirect to the dashboard page after successful login
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