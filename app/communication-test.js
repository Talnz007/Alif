// communication-test.js
import fetch from 'node-fetch';
import readline from 'readline'; // To get user input from the console

// Configuration
const BASE_URL = 'http://127.0.0.1:8000/api/v1/auth';

// Helper to prompt user input in the console
const promptInput = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => rl.question(query, (answer) => {
        rl.close();
        resolve(answer.trim());
    }));
};

// Registration Function
async function registerUser() {
    console.log('\n🔍 Testing Registration Endpoint');

    try {
        const username = await promptInput('Enter a username: ');
        const email = await promptInput('Enter an email: ');
        const password = await promptInput('Enter a password: ');

        const userData = {
            username,
            email,
            password,
        };

        console.log('Registration Data:', userData);

        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        console.log('Registration Response Status:', response.status);
        console.log('Registration Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Registration Successful');
        } else {
            console.error('❌ Registration Failed:', data.detail || 'Unknown Error');
        }
    } catch (error) {
        console.error('❌ Registration Error:', error.message);
    }
}

// Login Function
async function loginUser() {
    console.log('\n🔍 Testing Login Endpoint');

    try {
        const username = await promptInput('Enter your username: ');
        const password = await promptInput('Enter your password: ');

        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', username); // Use the username for login
        formData.append('password', password); // Use the plaintext password

        console.log('Login Form Data:', formData.toString());

        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const data = await response.json();
        console.log('Login Response Status:', response.status);
        console.log('Login Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Login Successful');
            console.log('Access Token:', data.access_token);
        } else {
            console.error('❌ Login Failed:', data.detail || 'Unknown Error');
        }
    } catch (error) {
        console.error('❌ Login Error:', error.message);
    }
}

// Main Execution
(async function main() {
    console.log('Select an option:');
    console.log('1. Register');
    console.log('2. Login');

    const option = await promptInput('Enter your choice (1 or 2): ');

    if (option === '1') {
        await registerUser();
    } else if (option === '2') {
        await loginUser();
    } else {
        console.log('Invalid choice. Exiting.');
    }
})();
