// State management
let currentUser = null;
let cards = [];

// Enhanced merchant categories with reward mappings
const MERCHANT_CATEGORIES = {
    // Online Shopping
    'amazon': { name: 'Amazon', category: 'Online Shopping', defaultReward: 1.0 },
    'amzn': { name: 'Amazon', category: 'Online Shopping', defaultReward: 1.0 },
    'walmart': { name: 'Walmart', category: 'Online Shopping', defaultReward: 1.0 },
    'target': { name: 'Target', category: 'Online Shopping', defaultReward: 1.0 },
    'ebay': { name: 'eBay', category: 'Online Shopping', defaultReward: 1.0 },
    'etsy': { name: 'Etsy', category: 'Online Shopping', defaultReward: 1.0 },
    
    // Dining & Restaurants
    'restaurant': { name: 'Restaurant', category: 'Dining', defaultReward: 2.0 },
    'food': { name: 'Food', category: 'Dining', defaultReward: 2.0 },
    'dining': { name: 'Dining', category: 'Dining', defaultReward: 2.0 },
    'grubhub': { name: 'GrubHub', category: 'Dining', defaultReward: 2.0 },
    'doordash': { name: 'DoorDash', category: 'Dining', defaultReward: 2.0 },
    'ubereats': { name: 'Uber Eats', category: 'Dining', defaultReward: 2.0 },
    'starbucks': { name: 'Starbucks', category: 'Dining', defaultReward: 2.0 },
    'mcdonalds': { name: 'McDonald\'s', category: 'Dining', defaultReward: 2.0 },
    
    // Gas & Fuel
    'gas': { name: 'Gas Station', category: 'Gas', defaultReward: 2.0 },
    'fuel': { name: 'Fuel', category: 'Gas', defaultReward: 2.0 },
    'shell': { name: 'Shell', category: 'Gas', defaultReward: 2.0 },
    'exxon': { name: 'Exxon', category: 'Gas', defaultReward: 2.0 },
    'mobil': { name: 'Mobil', category: 'Gas', defaultReward: 2.0 },
    'chevron': { name: 'Chevron', category: 'Gas', defaultReward: 2.0 },
    
    // Travel
    'hotel': { name: 'Hotel', category: 'Travel', defaultReward: 3.0 },
    'airbnb': { name: 'Airbnb', category: 'Travel', defaultReward: 3.0 },
    'booking': { name: 'Booking.com', category: 'Travel', defaultReward: 3.0 },
    'expedia': { name: 'Expedia', category: 'Travel', defaultReward: 3.0 },
    'kayak': { name: 'Kayak', category: 'Travel', defaultReward: 3.0 },
    'airline': { name: 'Airline', category: 'Travel', defaultReward: 3.0 },
    'delta': { name: 'Delta', category: 'Travel', defaultReward: 3.0 },
    'united': { name: 'United', category: 'Travel', defaultReward: 3.0 },
    'american': { name: 'American Airlines', category: 'Travel', defaultReward: 3.0 },
    
    // Groceries
    'grocery': { name: 'Grocery Store', category: 'Groceries', defaultReward: 2.0 },
    'safeway': { name: 'Safeway', category: 'Groceries', defaultReward: 2.0 },
    'kroger': { name: 'Kroger', category: 'Groceries', defaultReward: 2.0 },
    'wholefoods': { name: 'Whole Foods', category: 'Groceries', defaultReward: 2.0 },
    'traderjoes': { name: 'Trader Joe\'s', category: 'Groceries', defaultReward: 2.0 },
    'sprouts': { name: 'Sprouts', category: 'Groceries', defaultReward: 2.0 },
    
    // Entertainment
    'netflix': { name: 'Netflix', category: 'Entertainment', defaultReward: 1.0 },
    'spotify': { name: 'Spotify', category: 'Entertainment', defaultReward: 1.0 },
    'hulu': { name: 'Hulu', category: 'Entertainment', defaultReward: 1.0 },
    'disney': { name: 'Disney+', category: 'Entertainment', defaultReward: 1.0 },
    'movie': { name: 'Movie Theater', category: 'Entertainment', defaultReward: 1.0 },
    'theater': { name: 'Theater', category: 'Entertainment', defaultReward: 1.0 },
    
    // Drugstores
    'cvs': { name: 'CVS', category: 'Drugstores', defaultReward: 1.0 },
    'walgreens': { name: 'Walgreens', category: 'Drugstores', defaultReward: 1.0 },
    'riteaid': { name: 'Rite Aid', category: 'Drugstores', defaultReward: 1.0 },
    'drugstore': { name: 'Drugstore', category: 'Drugstores', defaultReward: 1.0 },
    
    // Office & Business
    'office': { name: 'Office Supply', category: 'Office', defaultReward: 1.0 },
    'staples': { name: 'Staples', category: 'Office', defaultReward: 1.0 },
    'officedepot': { name: 'Office Depot', category: 'Office', defaultReward: 1.0 },
    'business': { name: 'Business', category: 'Office', defaultReward: 1.0 }
};

// Default card reward structures (common card types)
const DEFAULT_CARD_REWARDS = {
    'Chase Freedom': {
        baseReward: 1.0,
        categories: {
            'Dining': 3.0,
            'Drugstores': 3.0,
            'Groceries': 3.0,
            'Gas': 3.0,
            'Travel': 3.0
        },
        rotatingCategories: ['Dining', 'Drugstores', 'Groceries', 'Gas', 'Travel']
    },
    'Chase Sapphire Preferred': {
        baseReward: 1.0,
        categories: {
            'Dining': 3.0,
            'Travel': 3.0,
            'Online Groceries': 3.0,
            'Streaming Services': 3.0
        }
    },
    'Chase Sapphire Reserve': {
        baseReward: 1.0,
        categories: {
            'Dining': 3.0,
            'Travel': 3.0
        }
    },
    'Amex Gold': {
        baseReward: 1.0,
        categories: {
            'Dining': 4.0,
            'Groceries': 4.0,
            'Travel': 3.0
        }
    },
    'Amex Platinum': {
        baseReward: 1.0,
        categories: {
            'Dining': 1.0,
            'Travel': 5.0
        }
    },
    'Citi Double Cash': {
        baseReward: 2.0,
        categories: {}
    },
    'Discover It': {
        baseReward: 1.0,
        categories: {},
        rotatingCategories: ['Dining', 'Drugstores', 'Groceries', 'Gas', 'Travel', 'Amazon']
    }
};


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
    
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Login button clicked');
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

// Authentication functions
function checkAuthStatus() {
    // Check if Chrome APIs are available
    if (!chrome || !chrome.storage) {
        console.error('Chrome storage API not available');
        alert('Chrome extension APIs not available. Please reload the extension.');
        return;
    }
    
    chrome.storage.local.get(['user', 'cards'], (result) => {
        console.log('Storage result:', result);
        
        // Always load cards, regardless of user status
        cards = result.cards || [];
        console.log('Cards loaded:', cards);
        
        if (result.user) {
            currentUser = result.user;
            console.log('User found, showing card management');
            showCardManagement();
        } else {
            console.log('No user found, showing landing page');
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
        
        // Only clear user data, keep cards
        chrome.storage.local.remove(['user'], () => {
            currentUser = null;
            // Don't clear cards array - keep them for next login
            console.log('User logged out, cards preserved');
            showLanding();
        });
    });
}

// Page navigation
function showLanding() {
    landingPage.classList.remove('hidden');
    cardManagementPage.classList.add('hidden');
    
    // Show card preview if cards exist
    const cardPreview = document.getElementById('card-preview');
    const previewCardsList = document.getElementById('preview-cards-list');
    
    if (cards.length > 0 && cardPreview && previewCardsList) {
        console.log('Showing card preview on landing page');
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
    
    // Build reward rate display
    const rewardRate = recommendation.rewardRate || 1.0;
    const savings = recommendation.savings || '0.00';
    
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
                        <div class="reward-rate">${rewardRate}% cashback</div>
                        <div class="recommendation-reason">${recommendation.reason}</div>
                        <div class="savings-info">Save $${savings} on a $100 purchase vs. 1% card</div>
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
    console.log('saveCard function called');
    const cardName = cardNameInput.value.trim();
    console.log('Card name:', cardName);
    
    if (!cardName) {
        console.log('No card name provided');
        cardNameInput.focus();
        return;
    }
    
    // Check if this card name matches a known card type
    const knownCardRewards = DEFAULT_CARD_REWARDS[cardName];
    
    const newCard = {
        id: Date.now().toString(),
        name: cardName,
        dateAdded: new Date().toISOString(),
        // If it's a known card, use the default rewards structure
        baseReward: knownCardRewards ? knownCardRewards.baseReward : 1.0,
        categories: knownCardRewards ? { ...knownCardRewards.categories } : {},
        rotatingCategories: knownCardRewards ? [...(knownCardRewards.rotatingCategories || [])] : [],
        isCustom: !knownCardRewards
    };
    console.log('New card object:', newCard);
    
    cards.push(newCard);
    console.log('Cards array after adding:', cards);
    
    chrome.storage.local.set({ cards: cards }, () => {
        console.log('Cards saved to storage');
        if (chrome.runtime.lastError) {
            console.error('Error saving cards:', chrome.runtime.lastError);
        } else {
            console.log('Cards saved successfully');
        }
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
    console.log('renderCards called');
    console.log('Cards array:', cards);
    console.log('Cards list element:', cardsList);
    
    cardsList.innerHTML = '';
    
    if (cards.length === 0) {
        console.log('No cards to display, showing empty state');
        emptyState.classList.remove('hidden');
        return;
    }
    
    console.log('Hiding empty state, showing cards');
    emptyState.classList.add('hidden');
    
    cards.forEach(card => {
        console.log('Creating card element for:', card.name);
        const cardElement = createCardElement(card);
        cardsList.appendChild(cardElement);
    });
    
    console.log('Cards rendered successfully');
}

function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card-item';
    
    // Build reward info display
    let rewardInfo = `${card.baseReward}% base`;
    if (card.categories && Object.keys(card.categories).length > 0) {
        const categoryRewards = Object.entries(card.categories)
            .map(([category, reward]) => `${category}: ${reward}%`)
            .join(', ');
        rewardInfo += ` | ${categoryRewards}`;
    }
    
    cardDiv.innerHTML = `
        <div class="card-info">
            <div class="card-icon">💳</div>
            <div class="card-details">
                <div class="card-name">${escapeHtml(card.name)}</div>
                <div class="card-rewards">${rewardInfo}</div>
            </div>
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
    if (!websiteInfo || cards.length === 0) return null;
    
    const domain = websiteInfo.domain.toLowerCase();
    
    // Find the merchant category for this domain
    let merchantCategory = null;
    let merchantName = null;
    
    // Check if domain matches any known merchant
    for (const [key, merchant] of Object.entries(MERCHANT_CATEGORIES)) {
        if (domain.includes(key)) {
            merchantCategory = merchant.category;
            merchantName = merchant.name;
            break;
        }
    }
    
    // If no specific merchant found, try to infer category from domain
    if (!merchantCategory) {
        if (domain.includes('restaurant') || domain.includes('food') || domain.includes('dining')) {
            merchantCategory = 'Dining';
            merchantName = 'Restaurant';
        } else if (domain.includes('hotel') || domain.includes('airline') || domain.includes('travel')) {
            merchantCategory = 'Travel';
            merchantName = 'Travel';
        } else if (domain.includes('grocery') || domain.includes('supermarket')) {
            merchantCategory = 'Groceries';
            merchantName = 'Grocery Store';
        } else if (domain.includes('gas') || domain.includes('fuel')) {
            merchantCategory = 'Gas';
            merchantName = 'Gas Station';
        } else {
            merchantCategory = 'General';
            merchantName = 'General Purchase';
        }
    }
    
    // Calculate the best card for this purchase
    const bestCard = calculateBestCard(merchantCategory, merchantName);
    
    if (!bestCard) {
        return {
            recommendedCard: cards[0],
            reason: `No specific rewards found for ${merchantName} - using your default card`,
            category: merchantCategory,
            rewardRate: cards[0].baseReward || 1.0
        };
    }
    
    return {
        recommendedCard: bestCard.card,
        reason: bestCard.reason,
        category: merchantCategory,
        rewardRate: bestCard.rewardRate,
        savings: bestCard.savings
    };
}

// Calculate the best card for a specific merchant category
function calculateBestCard(merchantCategory, merchantName) {
    if (cards.length === 0) return null;
    
    let bestCard = null;
    let bestRewardRate = 0;
    let bestReason = '';
    
    cards.forEach(card => {
        let rewardRate = card.baseReward || 1.0;
        let reason = `Base reward rate: ${rewardRate}%`;
        
        // Check if this card has category-specific rewards
        if (card.categories && card.categories[merchantCategory]) {
            rewardRate = card.categories[merchantCategory];
            reason = `${merchantCategory} rewards: ${rewardRate}%`;
        }
        
        // Check for rotating categories (simplified - assumes current quarter)
        if (card.rotatingCategories && card.rotatingCategories.includes(merchantCategory)) {
            // For rotating categories, we'll assume 5% reward (typical for rotating categories)
            rewardRate = 5.0;
            reason = `${merchantCategory} (rotating category): ${rewardRate}%`;
        }
        
        // Update best card if this one has higher rewards
        if (rewardRate > bestRewardRate) {
            bestRewardRate = rewardRate;
            bestCard = card;
            bestReason = reason;
        }
    });
    
    if (!bestCard) return null;
    
    // Calculate potential savings (example: $100 purchase)
    const examplePurchase = 100;
    const baseReward = 1.0; // Assume 1% is the baseline
    const savings = ((bestRewardRate - baseReward) / 100) * examplePurchase;
    
    return {
        card: bestCard,
        rewardRate: bestRewardRate,
        reason: bestReason,
        savings: savings.toFixed(2)
    };
}

// Handle extension updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refresh') {
        checkAuthStatus();
    }
});