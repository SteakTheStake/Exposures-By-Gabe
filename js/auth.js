// Authentication configuration
const AUTH_CONFIG = {
    // Base64 encoded passwords (in a real app, this would be more secure)
    passwords: {
        'upload123': btoa('upload123'), // Default password
        'portfolio': btoa('portfolio'),
        'secret': btoa('secret')
    },
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    storageKey: 'portfolioAuth'
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    initializeAuth();
});

// Initialize authentication system
function initializeAuth() {
    const isAuthenticated = checkAuthStatus();
    
    if (isAuthenticated) {
        showUploadInterface();
    } else {
        showPasswordOverlay();
    }
    
    // Set up form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', authenticateUser);
    }
    
    // Set up logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Check if user is currently authenticated
function checkAuthStatus() {
    try {
        const authData = localStorage.getItem(AUTH_CONFIG.storageKey);
        
        if (!authData) {
            return false;
        }
        
        const parsed = JSON.parse(authData);
        const now = Date.now();
        
        // Check if session has expired
        if (now > parsed.expiry) {
            localStorage.removeItem(AUTH_CONFIG.storageKey);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem(AUTH_CONFIG.storageKey);
        return false;
    }
}

// Authenticate user with password
function authenticateUser(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('passwordInput');
    const authError = document.getElementById('authError');
    const password = passwordInput.value.trim();
    
    // Clear previous error
    authError.textContent = '';
    authError.style.display = 'none';
    
    if (!password) {
        showAuthError('Please enter a password');
        return false;
    }
    
    // Check if password is valid
    const encodedPassword = btoa(password);
    const isValidPassword = Object.values(AUTH_CONFIG.passwords).includes(encodedPassword);
    
    if (isValidPassword) {
        // Set authentication session
        const authData = {
            authenticated: true,
            timestamp: Date.now(),
            expiry: Date.now() + AUTH_CONFIG.sessionDuration,
            passwordHash: encodedPassword // Store which password was used
        };
        
        try {
            localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(authData));
            showUploadInterface();
            passwordInput.value = ''; // Clear password field
        } catch (error) {
            console.error('Error storing auth data:', error);
            showAuthError('Authentication failed. Please try again.');
        }
    } else {
        showAuthError('Invalid password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
    }
    
    return false;
}

// Show authentication error
function showAuthError(message) {
    const authError = document.getElementById('authError');
    authError.textContent = message;
    authError.style.display = 'block';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        authError.style.display = 'none';
    }, 5000);
}

// Show password overlay
function showPasswordOverlay() {
    const passwordOverlay = document.getElementById('passwordOverlay');
    const uploadInterface = document.getElementById('uploadInterface');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (passwordOverlay) {
        passwordOverlay.style.display = 'flex';
    }
    
    if (uploadInterface) {
        uploadInterface.style.display = 'none';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
    
    // Focus on password input
    setTimeout(() => {
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.focus();
        }
    }, 100);
}

// Show upload interface
function showUploadInterface() {
    const passwordOverlay = document.getElementById('passwordOverlay');
    const uploadInterface = document.getElementById('uploadInterface');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (passwordOverlay) {
        passwordOverlay.style.display = 'none';
    }
    
    if (uploadInterface) {
        uploadInterface.style.display = 'block';
        uploadInterface.classList.add('fade-in');
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
    }
    
    // Initialize upload functionality
    if (typeof initializeUpload === 'function') {
        initializeUpload();
    }
}

// Logout user
function logout() {
    try {
        localStorage.removeItem(AUTH_CONFIG.storageKey);
        showPasswordOverlay();
        
        // Clear any uploaded images from session
        if (typeof clearUploadSession === 'function') {
            clearUploadSession();
        }
        
        // Show success message
        setTimeout(() => {
            const authError = document.getElementById('authError');
            if (authError) {
                authError.textContent = 'Successfully logged out';
                authError.style.color = '#48bb78'; // Success color
                authError.style.display = 'block';
                
                setTimeout(() => {
                    authError.style.display = 'none';
                    authError.style.color = '#f56565'; // Reset to error color
                }, 3000);
            }
        }, 100);
        
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Extend session if user is active
function extendSession() {
    const authData = localStorage.getItem(AUTH_CONFIG.storageKey);
    
    if (authData) {
        try {
            const parsed = JSON.parse(authData);
            parsed.expiry = Date.now() + AUTH_CONFIG.sessionDuration;
            localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(parsed));
        } catch (error) {
            console.error('Error extending session:', error);
        }
    }
}

// Monitor user activity to extend session
let activityTimer;
function resetActivityTimer() {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        if (checkAuthStatus()) {
            extendSession();
        }
    }, 5 * 60 * 1000); // Extend session every 5 minutes of activity
}

// Set up activity monitoring
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetActivityTimer, true);
});

// Check session periodically
setInterval(() => {
    if (!checkAuthStatus() && document.getElementById('uploadInterface').style.display !== 'none') {
        logout();
    }
}, 60 * 1000); // Check every minute

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && checkAuthStatus()) {
        extendSession();
    }
});

// Security utilities
const SecurityUtils = {
    // Simple XSS protection for displayed text
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Validate file types
    isValidImageType: function(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        return validTypes.includes(file.type);
    },
    
    // Validate file size (in bytes)
    isValidFileSize: function(file, maxSize = 10 * 1024 * 1024) { // 10MB default
        return file.size <= maxSize;
    },
    
    // Generate a simple hash for file identification
    generateFileHash: function(file) {
        return btoa(file.name + file.size + file.lastModified).replace(/[^a-zA-Z0-9]/g, '');
    }
};

// Export for use in other modules
window.AuthModule = {
    checkAuthStatus,
    logout,
    extendSession,
    SecurityUtils
};
