// Add click event listener to summarize button
document.getElementById('summarize').addEventListener('click', async () => {
    
  // Retrieve email data from Chrome storage
  chrome.storage.local.get(['emailData'], async function(result) {
    console.log("Retrieved from storage:", result.emailData);
    
    // If no email data found, use example data for testing
    if (!result.emailData) {
      const exampleEmailData = { 
        body: "IMPORTANT NOTICE: Our Q2 revenue grew 27% to $3.5M. The board meeting on August 10th will discuss expansion into European markets. Please prepare the financial projections for this initiative." 
      };
      
      // Store example data in Chrome storage
      chrome.storage.local.set({ emailData: exampleEmailData }, () => {
        console.log("New test email data set:", exampleEmailData);
      });
      
      result.emailData = exampleEmailData;
    }
    
    const email = result.emailData;
    console.log("Email data being sent to server:", email);
    
    // Validate email data exists
    if (!email || !email.body) {
      document.getElementById('summary').textContent = "No email data found.";
      return;
    }

    // Send email data to background script
    chrome.runtime.sendMessage({email}, function(response) {
      console.log("Received response:", response);
    });
    
    // Get email summary from server
    const summaryResponse = await fetch("http://127.0.0.1:5000/summarize", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email)
    });

    const summaryData = await summaryResponse.json();

    // Convert summary to audio using text-to-speech API
    const audioBlob = await fetch("http://127.0.0.1:5000/tts", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ text: summaryData.summary })
    }).then(res => res.blob());

    // Create download link for audio file
    const url = URL.createObjectURL(audioBlob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.style.display = "block";
  });
});