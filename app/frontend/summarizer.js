import fetch from 'node-fetch';
import readline from 'readline'; // To get user input from the console

// Configuration
const BASE_URL = 'http://127.0.0.1:8000/api/v1'; // Base API URL
const ENDPOINT = '/summarize/'; // Summarization endpoint

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

// Function to summarize text using the API
async function summarizeText() {
    console.log('\n🔍 Testing Text Summarization Endpoint');

    try {
        const text = await promptInput('Enter the text you want to summarize: ');

        // Prepare the request payload
        const payload = { text };

        console.log('Request Payload:', payload);

        // Make the POST request
        const response = await fetch('http://127.0.0.1:8000/api/v1/summarize/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Summarization Successful');
            console.log('Summary:', data.summary);
        } else {
            console.error('❌ Summarization Failed:', data.detail || 'Unknown Error');
        }
    } catch (error) {
        console.error('❌ Summarization Error:', error.message);
    }
}

// Main Execution
(async function main() {
    console.log('Welcome to the Text Summarization Test!');
    await summarizeText();
})();