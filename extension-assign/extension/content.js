/**
 * Extracts email content from Gmail and sends it to the extension.
 * Looks for subject, sender, and body content using Gmail's DOM structure.
 * Sends extracted data to popup and stores in chrome.storage.
 */
function extractEmailContent() {
    console.log("Starting email extraction...");
    
    // Extract key email components using Gmail's CSS selectors
    const subject = document.querySelector('h2.hP')?.innerText.trim();
    const sender = document.querySelector('span.gD')?.innerText.trim(); 
    const bodyElement = document.querySelector('div.a3s');

    let body = "";
    if (bodyElement) {
        body = bodyElement.innerText.trim();
    }

    if (subject || sender || body) {
        const emailData = { subject, sender, body };
        
        // Log extracted data for debugging
        console.log("Successfully extracted email data:");
        console.log("Subject:", subject);
        console.log("Sender:", sender); 
        console.log("Body preview:", body.substring(0, 100) + "...");

        // Store data locally as backup
        chrome.storage.local.set({ emailData }, () => {
            console.log("Saved to chrome.storage.local");
        });

        // Send data to extension popup
        chrome.runtime.sendMessage({ emailData }, (response) => {
            console.log("Sent message to popup, response:", response);
        });
    } else {
        console.error("Failed to extract email content. Please ensure you're viewing a Gmail message.");
    }
}

// Wait for page load before attempting extraction
window.addEventListener("load", () => {
    console.log("Content script loaded, waiting 3s for Gmail to fully render...");
    setTimeout(extractEmailContent, 3000);
});
