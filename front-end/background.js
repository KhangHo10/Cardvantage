// Background service worker for CardVantage extension

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('CardVantage extension installed:', details.reason);
    
    // Set up initial storage if needed
    chrome.storage.local.get(['initialized'], (result) => {
        if (!result.initialized) {
            chrome.storage.local.set({
                initialized: true,
                cards: [],
                user: null,
                isAuthenticated: false
            });
        }
    });
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('CardVantage extension started');
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getStorageData':
            chrome.storage.local.get([request.key], (result) => {
                sendResponse(result);
            });
            return true; // Keep message channel open for async response
            
        case 'setStorageData':
            chrome.storage.local.set(request.data, () => {
                sendResponse({ success: true });
            });
            return true;
            
        case 'clearStorage':
            chrome.storage.local.clear(() => {
                sendResponse({ success: true });
            });
            return true;
            
        case 'checkAuthStatus':
            chrome.storage.local.get(['user', 'isAuthenticated'], (result) => {
                sendResponse({ 
                    isAuthenticated: result.isAuthenticated || false,
                    user: result.user || null
                });
            });
            return true;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});

// Handle auth token changes
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
    console.log('Sign-in status changed:', { account, signedIn });
    
    if (!signedIn) {
        // User signed out, clear stored auth data but keep cards
        chrome.storage.local.remove(['user', 'isAuthenticated'], () => {
            console.log('User auth data cleared after sign out');
        });
    }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        // Notify popup if it's open about storage changes
        chrome.runtime.sendMessage({ action: 'storageChanged', changes })
            .catch(() => {
                // Popup not open, ignore error
            });
    }
});