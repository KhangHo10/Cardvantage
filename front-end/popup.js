// State management
let currentUser = null;
let cards = [];
let isAuthenticated = false;
let isDarkMode = true; // Default to dark mode

// DOM elements - will be set after DOM loads
let landingPage, cardManagementPage, loginBtn, logoutBtn;
let userAvatar, userName, addCardBtn, addCardForm;
let cardNameInput, saveCardBtn, cancelCardBtn, cardsList, emptyState;
let themeToggle, themeToggleMgmt, getRecommendationBtn;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    loadThemePreference();
    checkAuthStatus();
    setupEventListeners();
    setupMessageListener();
});

// Initialize DOM elements
function initializeDOM() {
    landingPage = document.getElementById('landing-page');
    cardManagementPage = document.getElementById('card-management');
    loginBtn = document.getElementById('login-btn');
    logoutBtn = document.getElementById('logout-btn');
    userAvatar = document.getElementById('user-avatar');
    userName = document.getElementById('user-name');
    addCardBtn = document.getElementById('add-card-btn');
    addCardForm = document.getElementById('add-card-form');
    cardNameInput = document.getElementById('card-name');
    saveCardBtn = document.getElementById('save-card-btn');
    cancelCardBtn = document.getElementById('cancel-card-btn');
    cardsList = document.getElementById('cards-list');
    emptyState = document.getElementById('empty-state');
    themeToggle = document.getElementById('theme-toggle');
    themeToggleMgmt = document.getElementById('theme-toggle-mgmt');
    getRecommendationBtn = document.getElementById('get-recommendation-btn');
}

// Theme management functions
function loadThemePreference() {
    chrome.storage.local.get(['isDarkMode'], (result) => {
        isDarkMode = result.isDarkMode !== undefined ? result.isDarkMode : true;
        applyTheme();
        updateToggleStates();
    });
}

function applyTheme() {
    const body = document.body;
    if (isDarkMode) {
        body.classList.remove('light-mode');
    } else {
        body.classList.add('light-mode');
    }
}

function updateToggleStates() {
    if (themeToggle) {
        themeToggle.checked = isDarkMode;
    }
    if (themeToggleMgmt) {
        themeToggleMgmt.checked = isDarkMode;
    }
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
    updateToggleStates();
    
    // Save theme preference
    chrome.storage.local.set({ isDarkMode: isDarkMode }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving theme preference:', chrome.runtime.lastError);
        }
    });
}

// Event listeners
function setupEventListeners() {
    if (!loginBtn || !logoutBtn || !addCardBtn || !saveCardBtn || !cancelCardBtn || !cardNameInput) {
        console.error('Some DOM elements are missing');
        return;
    }
    
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    logoutBtn.addEventListener('click', handleLogout);
    addCardBtn.addEventListener('click', showAddCardForm);
    saveCardBtn.addEventListener('click', saveCard);
    cancelCardBtn.addEventListener('click', hideAddCardForm);
    
    // New event listener for get recommendation button
    if (getRecommendationBtn) {
        getRecommendationBtn.addEventListener('click', handleGetRecommendation);
    }
    
    // Theme toggle event listeners
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
    
    if (themeToggleMgmt) {
        themeToggleMgmt.addEventListener('change', toggleTheme);
    }
    
    // Handle Enter key in card name input
    cardNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveCard();
        }
    });
}

// New function to handle manual recommendation request
async function handleGetRecommendation() {
    if (cards.length === 0) {
        alert('Please add at least one credit card to get recommendations.');
        return;
    }

    // Show loading state
    const originalText = getRecommendationBtn.textContent;
    getRecommendationBtn.textContent = 'Getting Recommendation...';
    getRecommendationBtn.disabled = true;

    try {
        // Get current website info
        const websiteInfo = await getCurrentWebsite();
        if (!websiteInfo) {
            alert('Unable to get current website information. Please make sure you\'re on a valid website.');
            return;
        }

        // Replace Map-based cache with chrome.storage.local

        // Create a cache key based on website domain and current cards
        const cacheKey = createCacheKey(websiteInfo.domain, cards);
        let recommendation = await getCache(cacheKey);

        if (recommendation) {
            console.log("Cache hit for:", websiteInfo.domain);
        } else {
            recommendation = await analyzeWebsiteForRecommendations(websiteInfo, cards);
            setCache(cacheKey, recommendation);
            console.log("Cache miss for:", websiteInfo.domain);
        }
        console.log('Recommendation:', recommendation);

        if (recommendation && recommendation.recommendations && recommendation.recommendations.length > 0) {
            showRecommendations(websiteInfo, recommendation);
            // Update button text to show success
            getRecommendationBtn.textContent = 'Get New Recommendation';
        } else {
            // Remove any existing recommendations
            removeRecommendation();
            alert('No suitable card recommendations found for this website.');
        }
    } catch (error) {
        console.error('Error getting recommendation:', error);
        alert('Failed to get recommendation. Please try again.');
    } finally {
        // Restore button state
        getRecommendationBtn.textContent = originalText;
        getRecommendationBtn.disabled = false;
    }
}

// Listen for messages from background script
function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'storageChanged') {
            // Refresh auth status when storage changes
            checkAuthStatus();
        }
    });
}

// Authentication functions
function checkAuthStatus() {
    if (!chrome || !chrome.storage) {
        console.error('Chrome storage API not available');
        return;
    }
    
    chrome.storage.local.get(['user', 'cards', 'isAuthenticated'], (result) => {
        cards = result.cards || [];
        
        if (result.user && result.isAuthenticated) {
            currentUser = result.user;
            isAuthenticated = true;
            showCardManagement();
        } else {
            // Don't automatically check for cached tokens - require explicit login
            isAuthenticated = false;
            currentUser = null;
            showLanding();
        }
    });
}

function handleLogin() {
    if (!chrome || !chrome.storage) {
        console.error('Chrome APIs not available');
        alert('Chrome extension APIs not available. Please reload the extension.');
        return;
    }
    
    if (!chrome.identity) {
        console.error('Chrome identity API not available');
        alert('Authentication not available. Please check if the extension is properly loaded.');
        return;
    }
    
    // Always clear any cached tokens to force email/password input
    chrome.identity.getAuthToken({ interactive: false }, (cachedToken) => {
        if (cachedToken) {
            chrome.identity.removeCachedAuthToken({ token: cachedToken }, () => {
                performInteractiveAuth();
            });
        } else {
            performInteractiveAuth();
        }
    });
}

function performInteractiveAuth() {
    // Show loading state
    if (loginBtn) {
        loginBtn.textContent = 'Signing in...';
        loginBtn.disabled = true;
    }
    
    // Force interactive auth which will prompt for email/password
    chrome.identity.getAuthToken({ 
        interactive: true
    }, (token) => {
        // Restore button state
        if (loginBtn) {
            loginBtn.textContent = 'Sign in';
            loginBtn.disabled = false;
        }
        
        if (chrome.runtime.lastError) {
            console.error('Auth error:', chrome.runtime.lastError.message);
            
            // Handle specific OAuth2 errors
            const errorMessage = chrome.runtime.lastError.message;
            if (errorMessage.includes('bad client id') || 
                errorMessage.includes('invalid client') ||
                errorMessage.includes('OAuth2 not granted')) {
                
            } else {
                console.error('Authentication error:', errorMessage);
                alert(`Authentication failed: ${errorMessage}\n\nPlease check your OAuth2 configuration.`);
            }
            return;
        }
        
        if (token) {
            console.log('Token received successfully, fetching user profile...');
            fetchUserProfile(token);
        } else {
            console.error('No token received from OAuth2');
            alert('Authentication failed: No token received. Please try again.');
        }
    });
}

function fetchUserProfile(token) {
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(userInfo => {
        currentUser = {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture
        };
        
        chrome.storage.local.set({ 
            user: currentUser, 
            isAuthenticated: true 
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Error saving user data:', chrome.runtime.lastError);
            } else {
                isAuthenticated = true;
                showCardManagement();
            }
        });
    })
    .catch(error => {
        console.error('Error fetching user profile:', error);
        alert(`Failed to fetch user profile: ${error.message}`);
    });
}

function handleLogout() {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, {
                method: 'POST'
            });
            chrome.identity.removeCachedAuthToken({ token: token });
        }
        
        chrome.storage.local.remove(['user', 'isAuthenticated'], () => {
            currentUser = null;
            isAuthenticated = false;
            showLanding();
        });
    });
}

// Page navigation - UPDATED: Removed automatic recommendation call
async function showCardManagement() {
    try {
        if (!landingPage || !cardManagementPage) {
            console.error('Page elements not found!');
            return;
        }

        // swap pages
        landingPage.classList.add('hidden');
        cardManagementPage.classList.remove('hidden');
        document.querySelector('#card-management .header-controls')
            ?.classList.add('user-logged-in');

        if (currentUser) {
            userAvatar.src = currentUser.picture;
            userName.textContent = currentUser.name;
        }

        updateToggleStates();
        renderCards();

        // Remove automatic recommendation call - now it's manual only
        console.log('Card management page loaded. User can now click "Get Recommendation" button.');

    } catch (err) {
        console.error('Error in showCardManagement:', err);
    }
}

function showLanding() {
    landingPage.classList.remove('hidden');
    cardManagementPage.classList.add('hidden');
    
    // Remove logged in user class when showing landing
    const headerControls = document.querySelector('#card-management .header-controls');
    if (headerControls) {
        headerControls.classList.remove('user-logged-in');
    }
    
    // Update theme toggle state on page switch
    updateToggleStates();
    
    // Show card preview if cards exist
    const cardPreview = document.getElementById('card-preview');
    const previewCardsList = document.getElementById('preview-cards-list');
    
    if (cards.length > 0 && cardPreview && previewCardsList) {
        cardPreview.classList.remove('hidden');
        
        // Show first 3 cards as preview
        previewCardsList.innerHTML = '';
        cards.slice(0, 3).forEach(card => {
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card-item';
            previewCard.innerHTML = `
                <div class="preview-card-icon">💳</div>
                <div class="preview-card-name">${escapeHtml(card.name)}</div>
            `;
            previewCardsList.appendChild(previewCard);
        });
        
        if (cards.length > 3) {
            const moreCard = document.createElement('div');
            moreCard.className = 'preview-card-item';
            moreCard.innerHTML = `
                <div class="preview-card-icon">...</div>
                <div class="preview-card-name">+${cards.length - 3} more cards</div>
            `;
            previewCardsList.appendChild(moreCard);
        }
    } else if (cardPreview) {
        cardPreview.classList.add('hidden');
    }
}

function showRecommendations(websiteInfo, recommendation) {
    // Create or update recommendation display
    let recommendationDisplay = document.getElementById('recommendation-display');
    if (!recommendationDisplay) {
        recommendationDisplay = document.createElement('div');
        recommendationDisplay.id = 'recommendation-display';
        recommendationDisplay.className = 'recommendation-display';
        document.querySelector('.card-section').insertBefore(recommendationDisplay, document.querySelector('.cards-list'));
    }
    
    const { category, recommendations } = recommendation;
    const isMultiple = recommendations.length > 1;
    
    recommendationDisplay.innerHTML = `
        <div class="recommendation-card">
            <div class="recommendation-header">
                <div class="recommendation-icon">🎯</div>
                <div class="recommendation-title">
                    <strong>Best Card${isMultiple ? 's' : ''} for ${websiteInfo.domain}</strong>
                    <span class="recommendation-category">${category}</span>
                </div>
            </div>
            <div class="recommendation-content">
                ${recommendations.map((rec, index) => `
                    <div class="recommended-card" data-index="${index}">
                        <div class="card-main-info">
                            <div class="card-icon">💳</div>
                            <div class="card-details">
                                <div class="card-name">${escapeHtml(rec.cardName)}</div>
                                ${rec.rewardRate ? `<div class="reward-rate">${escapeHtml(rec.rewardRate)}</div>` : ''}
                            </div>
                            <button class="expand-btn" data-card-index="${index}" aria-label="Show details">
                                <span class="expand-icon">▼</span>
                            </button>
                        </div>
                        <div class="card-reason hidden" id="reason-${index}">
                            <div class="reason-content">
                                <div class="reason-text">${escapeHtml(rec.reason)}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add event listeners for the expand buttons after creating the HTML
    const expandButtons = recommendationDisplay.querySelectorAll('.expand-btn');
    expandButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cardIndex = this.getAttribute('data-card-index');
            toggleReason(cardIndex);
        });
    });
}

// Update the toggleReason function to be more robust
function toggleReason(index) {
    const reasonElement = document.getElementById(`reason-${index}`);
    const expandBtn = document.querySelector(`[data-card-index="${index}"]`);
    const expandIcon = expandBtn ? expandBtn.querySelector('.expand-icon') : null;
    
    if (!reasonElement || !expandBtn || !expandIcon) {
        console.error('Could not find elements for card index:', index);
        return;
    }
    
    if (reasonElement.classList.contains('hidden')) {
        // Show the reason
        reasonElement.classList.remove('hidden');
        expandIcon.textContent = '▲';
        expandBtn.setAttribute('aria-label', 'Hide details');
        
        // Reset max-height to allow full content to show
        reasonElement.style.maxHeight = 'none';
        reasonElement.style.overflow = 'visible';
    } else {
        // Hide the reason
        // First set a specific height to enable smooth transition
        reasonElement.style.maxHeight = reasonElement.scrollHeight + 'px';
        reasonElement.style.overflow = 'hidden';
        
        // Force a reflow to ensure the height is set
        reasonElement.offsetHeight;
        
        // Then collapse it
        reasonElement.style.maxHeight = '0px';
        expandIcon.textContent = '▼';
        expandBtn.setAttribute('aria-label', 'Show details');
        
        // Add the hidden class after a short delay to ensure smooth animation
        setTimeout(() => {
            reasonElement.classList.add('hidden');
        }, 400);
    }
}

// Also update the global toggleReason function (keep this for backward compatibility)
window.toggleReason = toggleReason;

function removeRecommendation() {
    const recommendationDisplay = document.getElementById('recommendation-display');
    if (recommendationDisplay) {
        recommendationDisplay.remove();
    }
}

// Card management functions
function showAddCardForm() {
    addCardForm.classList.remove('hidden');
    cardNameInput.focus();
}

function hideAddCardForm() {
    addCardForm.classList.add('hidden');
    cardNameInput.value = '';
}

function saveCard() {
    const cardName = cardNameInput.value.trim();
    
    if (!cardName) {
        cardNameInput.focus();
        return;
    }
    
    const newCard = {
        id: Date.now().toString(),
        name: cardName,
        dateAdded: new Date().toISOString()
    };
    
    cards.push(newCard);
    
    chrome.storage.local.set({ cards: cards }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving cards:', chrome.runtime.lastError);
        } else {
            hideAddCardForm();
            renderCards();
            
            // Clear cache when cards are modified
            clearCache();
            
            // Don't automatically refresh recommendations after adding a card
            // User needs to click the button manually
        }
    });
}

function deleteCard(cardId) {
    cards = cards.filter(card => card.id !== cardId);
    
    chrome.storage.local.set({ cards: cards }, () => {
        renderCards();
        
        // Clear cache when cards are modified
        clearCache();
        
        // Remove recommendation when a card is deleted
        // since the recommendation might no longer be valid
        removeRecommendation();
    });
}

function renderCards() {
    cardsList.innerHTML = '';
    
    if (cards.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    cards.forEach(card => {
        const cardElement = createCardElement(card);
        cardsList.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-item';
    
    cardDiv.innerHTML = `
        <div class="card-info">
            <div class="card-icon">💳</div>
            <div class="card-name">${escapeHtml(card.name)}</div>
        </div>
        <button class="delete-btn" data-card-id="${card.id}">Delete</button>
    `;
    
    // Add delete functionality
    const deleteBtn = cardDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${card.name}"?`)) {
            deleteCard(card.id);
        }
    });
    
    return cardDiv;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create a unique cache key based on website domain and current cards
function createCacheKey(domain, cards) {
    // Sort cards by name to ensure consistent cache keys regardless of order
    const sortedCards = [...cards].sort((a, b) => a.name.localeCompare(b.name));
    const cardsString = sortedCards.map(card => card.name).join('|');
    return `${domain}|${cardsString}`;
}

// Save to cache
function setCache(key, value) {
    chrome.storage.local.set({ [key]: value });
}

// Get from cache
function getCache(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
}

// Clear cache
function clearCache() {
    chrome.storage.local.get(null, (items) => {
        // Only remove keys that look like recommendation cache keys
        const keysToRemove = Object.keys(items).filter(key => key.includes('|'));
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log('Cache cleared due to card modification');
            });
        }
    });
}

// Get current website for recommendations
function getCurrentWebsite() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                const url = new URL(tabs[0].url);
                resolve({
                    domain: url.hostname,
                    fullUrl: tabs[0].url,
                    title: tabs[0].title
                });
            } else {
                resolve(null);
            }
        });
    });
}

// Analyze website and recommend best card
async function analyzeWebsiteForRecommendations(websiteInfo, cards) {
    if (!websiteInfo || !cards || cards.length === 0) {
        return null;
    }
    
    try {
        // Prepare the request body
        const requestBody = {
            websiteUrl: websiteInfo.domain,
            userCards: cards.map(card => ({ name: card.name })) // This sends only the name property
        };

        console.log('Requesting recommendation with body:', requestBody);
        
        // Make POST request to your API endpoint
        const response = await fetch('http://localhost:8080/api/get-recommendation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API response status:', response.status);
        
        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        
        // Parse the response
        const apiResponse = await response.json();
        
        // Validate the API response structure
        if (!apiResponse.recommendations || !Array.isArray(apiResponse.recommendations)) {
            console.warn('API response missing recommendations array');
            return null;
        }
        
        console.log('API recommendation:', apiResponse);
        return apiResponse;
        
    } catch (error) {
        console.error('Error calling recommendation API:', error);
        
        // Fallback to simple local logic if API fails
        return null;
    }
}

// Handle extension updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        checkAuthStatus();
    }
});