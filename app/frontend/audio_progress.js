function updateProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 80) { // Stop at 80% and wait for actual completion
            clearInterval(interval);
        } else {
            width += 10; // Adjust speed
            progressBar.style.width = `${width}%`;
        }
    }, 500); // Update every 0.5 seconds
}

function resetProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = '0%'; // Reset progress bar
}