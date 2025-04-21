/**
 * Background script for AI Email Reader Extension
 * Handles installation and message passing between content script and server
 */

// Log when extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Email Reader Extension installed.");
});

// Listen for messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);

  // Send email data to server for summarization
  fetch("http://127.0.0.1:5000/summarize", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      // CORS headers for local development
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*", 
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(request.email)
  })
  .then(response => response.json())
  .then(data => {
    console.log("Received summary from server:", data);
  })
  .catch(error => {
    console.error("Error getting summary:", error);
  });

  // Send response back to caller
  sendResponse('success');
  
  // Keep message channel open for async response
  return true;
});
