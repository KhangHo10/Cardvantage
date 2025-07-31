// State management
let currentUser = null;
let cards = [];

// DOM elements - will be set after DOM loads
let landingPage, cardManagementPage, loginBtn, logoutBtn;
let userAvatar, userName, addCardBtn, addCardForm;
let cardNameInput, saveCardBtn, cancelCardBtn, cardsList, emptyState;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    checkAuthStatus();
    setupEventListeners();
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
}

// Event listeners
function setupEventListeners() {
    if (!loginBtn || !logoutBtn || !addCardBtn || !saveCardBtn || !cancelCardBtn || !cardNameInput) {
        console.error('Some DOM elements are missing, cannot set up event listeners');
        return;
    }
    
    
    
    logoutBtn.addEventListener('click', handleLogout);
    addCardBtn.addEventListener('click', showAddCardForm);
    saveCardBtn.addEventListener('click', saveCard);
    cancelCardBtn.addEventListener('click', hideAddCardForm);
    
    // Handle Enter key in card name input
    cardNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveCard();
        }
    });
}

// Authentication functions
function checkAuthStatus() {
    // Check if Chrome APIs are available
    if (!chrome || !chrome.storage) {
        console.error('Chrome storage API not available');
        alert('Chrome extension APIs not available. Please reload the extension.');
        return;
    }
    
    chrome.storage.local.get(['user', 'cards'], (result) => {
        if (result.user) {
            currentUser = result.user;
            cards = result.cards || [];
            showCardManagement();
        } else {
            showLanding();
        }
    });
}

function handleLogin() {
    console.log('handleLogin function called');
    
    // Check if Chrome APIs are available
    if (!chrome || !chrome.storage) {
        console.error('Chrome APIs not available');
        alert('Chrome extension APIs not available. Please reload the extension.');
        return;
    }
    
    // Check if Chrome identity API is available
    if (!chrome.identity) {
        console.error('Chrome identity API not available');
        alert('Authentication not available. Please check if the extension is properly loaded.');
        return;
    }
    
    console.log('Starting authentication...');
    
    // Try to get a token with interaction
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
            console.error('Auth error:', chrome.runtime.lastError);
            console.error('Error message:', chrome.runtime.lastError.message);
            
            // If OAuth2 is not configured, show a helpful message
            if (chrome.runtime.lastError.message.includes('bad client id') || 
                chrome.runtime.lastError.message.includes('invalid client') ||
                chrome.runtime.lastError.message.includes('OAuth2 not granted')) {
                
                console.log('OAuth2 configuration issue detected - using demo mode');
                alert('OAuth2 not configured yet. Using demo mode for now.\n\nYou can set up real authentication later.');
                
                // Fallback to demo user with generic info
                currentUser = {
                    id: 'demo-user-' + Date.now(),
                    name: 'Demo User',
                    email: 'demo@example.com',
                    picture: 'https://via.placeholder.com/32x32/667eea/ffffff?text=U'
                };
                
                chrome.storage.local.set({ user: currentUser }, () => {
                    console.log('Demo user data saved, showing card management');
                    showCardManagement();
                });
            } else {
                console.log('Other authentication error');
                alert(`Authentication failed: ${chrome.runtime.lastError.message}\n\nPlease check the console for more details.`);
            }
            return;
        }
        
        if (token) {
            console.log('Token received, fetching user profile...');
            console.log('Token length:', token.length);
            fetchUserProfile(token);
        } else {
            console.error('No token received');
            alert('Authentication failed: No token received');
        }
    });
}


function fetchUserProfile(token) {
    console.log('Fetching user profile...');
    
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
        console.log('User profile received:', userInfo);
        
        currentUser = {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture
        };
        
        chrome.storage.local.set({ user: currentUser }, () => {
            console.log('User data saved, showing card management');
            showCardManagement();
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
            // Revoke the token
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, {
                method: 'POST'
            });
            
            chrome.identity.removeCachedAuthToken({ token: token });
        }
        
        // Clear local storage
        chrome.storage.local.clear(() => {
            currentUser = null;
            cards = [];
            showLanding();
        });
    });
}

// Page navigation
function showLanding() {
    landingPage.classList.remove('hidden');
    cardManagementPage.classList.add('hidden');
}

function showCardManagement() {
    landingPage.classList.add('hidden');
    cardManagementPage.classList.remove('hidden');
    
    if (currentUser) {
        if (userAvatar) userAvatar.src = currentUser.picture;
        if (userName) userName.textContent = currentUser.name;
    }
    
    renderCards();
    
    // Analyze current website for recommendations
    if (cards.length > 0) {
        getCurrentWebsite().then(websiteInfo => {
            if (websiteInfo) {
                const recommendation = analyzeWebsiteForRecommendations(websiteInfo);
                if (recommendation && recommendation.recommendedCard) {
                    showRecommendation(websiteInfo, recommendation);
                }
            }
        });
    }
}

function showRecommendation(websiteInfo, recommendation) {
    // Create or update recommendation display
    let recommendationDisplay = document.getElementById('recommendation-display');
    if (!recommendationDisplay) {
        recommendationDisplay = document.createElement('div');
        recommendationDisplay.id = 'recommendation-display';
        recommendationDisplay.className = 'recommendation-display';
        document.querySelector('.card-section').insertBefore(recommendationDisplay, document.querySelector('.cards-list'));
    }
    
    recommendationDisplay.innerHTML = `
        <div class="recommendation-card">
            <div class="recommendation-header">
                <div class="recommendation-icon">🎯</div>
                <div class="recommendation-title">
                    <strong>Best Card for ${websiteInfo.domain}</strong>
                    <span class="recommendation-category">${recommendation.category}</span>
                </div>
            </div>
            <div class="recommendation-content">
                <div class="recommended-card">
                    <div class="card-icon">💳</div>
                    <div class="card-details">
                        <div class="card-name">${escapeHtml(recommendation.recommendedCard.name)}</div>
                        <div class="recommendation-reason">${recommendation.reason}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
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
        hideAddCardForm();
        renderCards();
    });
}

function deleteCard(cardId) {
    cards = cards.filter(card => card.id !== cardId);
    
    chrome.storage.local.set({ cards: cards }, () => {
        renderCards();
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
function analyzeWebsiteForRecommendations(websiteInfo) {
    if (!websiteInfo) return null;
    
    // This is a placeholder for the recommendation logic
    // In a real implementation, you would:
    // 1. Check the website domain against known merchant categories
    // 2. Compare with user's card reward categories
    // 3. Return the best card for that purchase
    
    const domain = websiteInfo.domain.toLowerCase();
    
    // Simple example logic
    if (domain.includes('amazon') || domain.includes('amzn')) {
        return {
            recommendedCard: cards.find(card => card.name.toLowerCase().includes('amazon')) || cards[0],
            reason: 'Amazon purchases often have special rewards',
            category: 'Online Shopping'
        };
    } else if (domain.includes('restaurant') || domain.includes('food')) {
        return {
            recommendedCard: cards.find(card => card.name.toLowerCase().includes('dining')) || cards[0],
            reason: 'Restaurant purchases typically earn dining rewards',
            category: 'Dining'
        };
    } else if (domain.includes('gas') || domain.includes('fuel')) {
        return {
            recommendedCard: cards.find(card => card.name.toLowerCase().includes('gas')) || cards[0],
            reason: 'Gas station purchases earn fuel rewards',
            category: 'Gas'
        };
    }
    
    return {
        recommendedCard: cards[0],
        reason: 'General purchase - using your default card',
        category: 'General'
    };
}

// Handle extension updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        checkAuthStatus();
    }
});