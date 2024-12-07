// Base URL of your backend
const BASE_URL = "http://127.0.0.1:8000/api/v1/auth";

// Utility function to show alerts
const showAlert = (message, type = "error") => {
    const alertBox = document.createElement("div");
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 3000);
};

// Handle Registration
const handleRegister = async (userData) => {
    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Registration successful!", "success");
            console.log("Registration Response:", data);
            window.location.href = "index.html"; // Redirect to login page
        } else {
            showAlert(data.detail || "Registration failed!");
            console.error("Registration Error:", data);
        }
    } catch (error) {
        console.error("Registration Failed:", error.message);
        showAlert("An error occurred during registration.");
    }
};

// Handle Login
const handleLogin = async (credentials) => {
    try {
        const formData = new URLSearchParams();
        formData.append("grant_type", "password");
        formData.append("username", credentials.username); // Using username for login
        formData.append("password", credentials.password);

        const response = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            showAlert("Login successful!", "success");
            console.log("Login Response:", data);
            localStorage.setItem("accessToken", data.access_token); // Save access token
            window.location.href = "Dashboard.html"; // Redirect to Dashboard
        } else {
            showAlert(data.detail || "Login failed!");
            console.error("Login Error:", data);
        }
    } catch (error) {
        console.error("Login Failed:", error.message);
        showAlert("An error occurred during login.");
    }
};

// Add event listeners for form submissions
document.addEventListener("DOMContentLoaded", () => {
    // Login form submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent default form submission
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) {
                showAlert("Please fill in all fields.");
                return;
            }

            await handleLogin({ username, password });
        });
    }

    // Register form submission
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Prevent default form submission
            const username = document.getElementById("reg-username").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const password = document.getElementById("reg-password").value.trim();

            if (!username || !email || !password) {
                showAlert("Please fill in all fields.");
                return;
            }

            await handleRegister({ username, email, password });
        });
    }
});
