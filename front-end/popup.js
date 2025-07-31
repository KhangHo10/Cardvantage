// State management
let currentUser = null;
let cards = [];
let isAuthenticated = false;

// DOM elements - will be set after DOM loads
let landingPage, cardManagementPage, loginBtn, logoutBtn;
let userAvatar, userName, addCardBtn, addCardForm;
let cardNameInput, saveCardBtn, cancelCardBtn, cardsList, emptyState;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
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
    
    // Handle Enter key in card name input
    cardNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveCard();
        }
    });
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
                
                console.log('OAuth2 configuration issue, using demo mode');
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

// Page navigation
function showCardManagement() {
    try {
        if (!landingPage || !cardManagementPage) {
            console.error('Page elements not found!');
            return;
        }
        
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
            }).catch(error => {
                console.error('Error getting website info:', error);
            });
        }
    } catch (error) {
        console.error('Error in showCardManagement:', error);
    }
}

function showLanding() {
    landingPage.classList.remove('hidden');
    cardManagementPage.classList.add('hidden');
    
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
            
            // Refresh recommendations after adding a new card
            getCurrentWebsite().then(websiteInfo => {
                if (websiteInfo) {
                    const recommendation = analyzeWebsiteForRecommendations(websiteInfo);
                    if (recommendation && recommendation.recommendedCard) {
                        showRecommendation(websiteInfo, recommendation);
                    }
                }
            });
        }
    });
}

function deleteCard(cardId) {
    cards = cards.filter(card => card.id !== cardId);
    
    chrome.storage.local.set({ cards: cards }, () => {
        renderCards();
        
        // Refresh recommendations after deleting a card
        if (cards.length > 0) {
            getCurrentWebsite().then(websiteInfo => {
                if (websiteInfo) {
                    const recommendation = analyzeWebsiteForRecommendations(websiteInfo);
                    if (recommendation && recommendation.recommendedCard) {
                        showRecommendation(websiteInfo, recommendation);
                    } else {
                        // Remove recommendation if no suitable card found
                        removeRecommendation();
                    }
                }
            });
        } else {
            // Remove recommendation if no cards left
            removeRecommendation();
        }
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
    
    // Check if we have any cards
    if (cards.length === 0) {
        return null;
    }
    
    // This is a placeholder for the recommendation logic
    // In a real implementation, you would:
    // 1. Check the website domain against known merchant categories
    // 2. Compare with user's card reward categories
    // 3. Return the best card for that purchase
    
    const domain = websiteInfo.domain.toLowerCase();
    
    // Simple example logic
    if (domain.includes('amazon') || domain.includes('amzn')) {
        const amazonCard = cards.find(card => card.name.toLowerCase().includes('amazon'));
        if (amazonCard) {
            return {
                recommendedCard: amazonCard,
                reason: 'Amazon purchases often have special rewards',
                category: 'Online Shopping'
            };
        }
    } else if (domain.includes('restaurant') || domain.includes('food')) {
        const diningCard = cards.find(card => card.name.toLowerCase().includes('dining'));
        if (diningCard) {
            return {
                recommendedCard: diningCard,
                reason: 'Restaurant purchases typically earn dining rewards',
                category: 'Dining'
            };
        }
    } else if (domain.includes('gas') || domain.includes('fuel')) {
        const gasCard = cards.find(card => card.name.toLowerCase().includes('gas'));
        if (gasCard) {
            return {
                recommendedCard: gasCard,
                reason: 'Gas station purchases earn fuel rewards',
                category: 'Gas'
            };
        }
    }
    
    // Default to first card if no specific match found
    if (cards.length > 0) {
        return {
            recommendedCard: cards[0],
            reason: 'General purchase - using your default card',
            category: 'General'
        };
    }
    
    return null;
}

// Handle extension updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        checkAuthStatus();
    }
});