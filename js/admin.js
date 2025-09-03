// Admin panel functionality and content management
const ADMIN_CONFIG = {
    // Admin passwords (separate from upload passwords)
    adminPasswords: {
        'admin123': btoa('admin123'),
        'content': btoa('content'),
        'manager': btoa('manager')
    },
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
    storageKey: 'portfolioAdminAuth',
    contentKey: 'portfolioContent'
};

// Content structure for site management
const DEFAULT_CONTENT = {
    hero: {
        title: "Capturing Moments",
        subtitle: "A curated collection of photography that tells stories through light and composition"
    },
    about: {
        paragraph1: "Welcome to my photography portfolio. I'm passionate about capturing the beauty of the natural world and sharing moments that inspire and move people. Each photograph tells a story, whether it's the serene tranquility of a mountain landscape or the dynamic energy of ocean waves.",
        paragraph2: "My work focuses on landscape and nature photography, always seeking to find the extraordinary in the ordinary and to showcase the incredible diversity and beauty of our planet."
    },
    contact: {
        instagram: "@gabe_corr",
        status: "Available for commissions"
    },
    images: {
        logo: null,
        portrait: null
    }
};

// Initialize admin on page load
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    initializeAdmin();
    loadContentIntoForms();
});

// Initialize admin authentication
function initializeAdmin() {
    const isAuthenticated = checkAdminAuthStatus();
    
    if (isAuthenticated) {
        showAdminInterface();
    } else {
        showPasswordOverlay();
    }
}

// Check admin authentication status
function checkAdminAuthStatus() {
    try {
        const authData = localStorage.getItem(ADMIN_CONFIG.storageKey);
        
        if (!authData) {
            return false;
        }
        
        const parsed = JSON.parse(authData);
        const now = Date.now();
        
        // Check if session has expired
        if (now > parsed.expiry) {
            localStorage.removeItem(ADMIN_CONFIG.storageKey);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking admin auth status:', error);
        localStorage.removeItem(ADMIN_CONFIG.storageKey);
        return false;
    }
}

// Authenticate admin user
function authenticateAdmin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('passwordInput');
    const authError = document.getElementById('authError');
    const password = passwordInput.value.trim();
    
    // Clear previous error
    authError.textContent = '';
    authError.style.display = 'none';
    
    if (!password) {
        showAuthError('Please enter the admin password');
        return false;
    }
    
    // Check if password is valid admin password
    const encodedPassword = btoa(password);
    const isValidAdminPassword = Object.values(ADMIN_CONFIG.adminPasswords).includes(encodedPassword);
    
    if (isValidAdminPassword) {
        // Set admin authentication session
        const authData = {
            authenticated: true,
            timestamp: Date.now(),
            expiry: Date.now() + ADMIN_CONFIG.sessionDuration,
            passwordHash: encodedPassword,
            role: 'admin'
        };
        
        try {
            localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(authData));
            showAdminInterface();
            passwordInput.value = '';
        } catch (error) {
            console.error('Error storing admin auth data:', error);
            showAuthError('Authentication failed. Please try again.');
        }
    } else {
        showAuthError('Invalid admin password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
    }
    
    return false;
}

// Show admin interface
function showAdminInterface() {
    const passwordOverlay = document.getElementById('passwordOverlay');
    const adminInterface = document.getElementById('adminInterface');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (passwordOverlay) {
        passwordOverlay.style.display = 'none';
    }
    
    if (adminInterface) {
        adminInterface.style.display = 'block';
        adminInterface.classList.add('fade-in');
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
    }
    
    // Load current content
    loadContentIntoForms();
    loadCurrentImages();
}

// Show password overlay
function showPasswordOverlay() {
    const passwordOverlay = document.getElementById('passwordOverlay');
    const adminInterface = document.getElementById('adminInterface');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (passwordOverlay) {
        passwordOverlay.style.display = 'flex';
    }
    
    if (adminInterface) {
        adminInterface.style.display = 'none';
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

// Show authentication error
function showAuthError(message) {
    const authError = document.getElementById('authError');
    authError.textContent = message;
    authError.style.display = 'block';
    
    setTimeout(() => {
        authError.style.display = 'none';
    }, 5000);
}

// Logout admin user
function logout() {
    try {
        localStorage.removeItem(ADMIN_CONFIG.storageKey);
        showPasswordOverlay();
        
        // Show success message
        setTimeout(() => {
            const authError = document.getElementById('authError');
            if (authError) {
                authError.textContent = 'Successfully logged out';
                authError.style.color = '#238636';
                authError.style.display = 'block';
                
                setTimeout(() => {
                    authError.style.display = 'none';
                    authError.style.color = '#da3633';
                }, 3000);
            }
        }, 100);
        
    } catch (error) {
        console.error('Error during admin logout:', error);
    }
}

// Load content into forms
function loadContentIntoForms() {
    const content = getSiteContent();
    
    // Load hero content
    document.getElementById('heroTitle').value = content.hero.title;
    document.getElementById('heroSubtitle').value = content.hero.subtitle;
    
    // Load about content
    document.getElementById('aboutText1').value = content.about.paragraph1;
    document.getElementById('aboutText2').value = content.about.paragraph2;
    
    // Load contact content
    document.getElementById('contactInstagram').value = content.contact.instagram;
    document.getElementById('contactStatus').value = content.contact.status;
}

// Get site content from storage or defaults
function getSiteContent() {
    try {
        const storedContent = localStorage.getItem(ADMIN_CONFIG.contentKey);
        if (storedContent) {
            return { ...DEFAULT_CONTENT, ...JSON.parse(storedContent) };
        }
    } catch (error) {
        console.error('Error loading site content:', error);
    }
    return DEFAULT_CONTENT;
}

// Save site content to storage
function saveSiteContent(content) {
    try {
        const currentContent = getSiteContent();
        const updatedContent = { ...currentContent, ...content };
        localStorage.setItem(ADMIN_CONFIG.contentKey, JSON.stringify(updatedContent));
        return true;
    } catch (error) {
        console.error('Error saving site content:', error);
        showAdminResult('Failed to save content changes', false);
        return false;
    }
}

// Update hero content
function updateHeroContent() {
    const title = document.getElementById('heroTitle').value.trim();
    const subtitle = document.getElementById('heroSubtitle').value.trim();
    
    if (!title || !subtitle) {
        showAdminResult('Please fill in all hero fields', false);
        return;
    }
    
    const heroContent = {
        hero: { title, subtitle }
    };
    
    if (saveSiteContent(heroContent)) {
        showAdminResult('Hero section updated successfully', true);
        updateMainSiteContent();
    }
}

// Update about content
function updateAboutContent() {
    const paragraph1 = document.getElementById('aboutText1').value.trim();
    const paragraph2 = document.getElementById('aboutText2').value.trim();
    
    if (!paragraph1 || !paragraph2) {
        showAdminResult('Please fill in all about fields', false);
        return;
    }
    
    const aboutContent = {
        about: { paragraph1, paragraph2 }
    };
    
    if (saveSiteContent(aboutContent)) {
        showAdminResult('About section updated successfully', true);
        updateMainSiteContent();
    }
}

// Update contact content
function updateContactContent() {
    const instagram = document.getElementById('contactInstagram').value.trim();
    const status = document.getElementById('contactStatus').value.trim();
    
    if (!instagram || !status) {
        showAdminResult('Please fill in all contact fields', false);
        return;
    }
    
    const contactContent = {
        contact: { instagram, status }
    };
    
    if (saveSiteContent(contactContent)) {
        showAdminResult('Contact information updated successfully', true);
        updateMainSiteContent();
    }
}

// Handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAdminResult('Please select an image file for the logo', false);
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showAdminResult('Logo file too large. Please use an image under 5MB', false);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const logoData = e.target.result;
        
        // Update current logo display
        const currentLogo = document.getElementById('currentLogo');
        currentLogo.innerHTML = `<img src="${logoData}" alt="Current Logo">`;
        
        // Save logo to content
        const logoContent = {
            images: { ...getSiteContent().images, logo: logoData }
        };
        
        if (saveSiteContent(logoContent)) {
            showAdminResult('Logo updated successfully', true);
        }
    };
    
    reader.readAsDataURL(file);
}

// Handle portrait upload
function handlePortraitUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAdminResult('Please select an image file for the portrait', false);
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showAdminResult('Portrait file too large. Please use an image under 5MB', false);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const portraitData = e.target.result;
        
        // Update current portrait display
        const currentPortrait = document.getElementById('currentPortrait');
        currentPortrait.innerHTML = `<img src="${portraitData}" alt="Current Portrait">`;
        
        // Save portrait to content
        const portraitContent = {
            images: { ...getSiteContent().images, portrait: portraitData }
        };
        
        if (saveSiteContent(portraitContent)) {
            showAdminResult('Portrait updated successfully', true);
        }
    };
    
    reader.readAsDataURL(file);
}

// Load current images
function loadCurrentImages() {
    const content = getSiteContent();
    
    // Load logo
    if (content.images && content.images.logo) {
        const currentLogo = document.getElementById('currentLogo');
        currentLogo.innerHTML = `<img src="${content.images.logo}" alt="Current Logo">`;
    }
    
    // Load portrait
    if (content.images && content.images.portrait) {
        const currentPortrait = document.getElementById('currentPortrait');
        currentPortrait.innerHTML = `<img src="${content.images.portrait}" alt="Current Portrait">`;
    }
}

// Update main site content (for live preview if main site is open)
function updateMainSiteContent() {
    const content = getSiteContent();
    
    // Show helpful message to user about refreshing main site
    const now = new Date().toLocaleTimeString();
    showAdminResult(`Content saved! Refresh the main site to see changes (saved at ${now})`, true);
    
    // Try to update main site if it's in another tab (this won't work due to browser security, but good practice)
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'contentUpdate', content: content }, '*');
        }
    } catch (error) {
        // Security restrictions prevent cross-tab communication
        console.log('Content updated locally:', content);
    }
}

// Show admin result message
function showAdminResult(message, success) {
    const resultsContainer = document.getElementById('adminResults');
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${success ? 'result-success' : 'result-error'}`;
    
    const icon = success ? 'check-circle' : 'x-circle';
    
    resultItem.innerHTML = `
        <i data-feather="${icon}"></i>
        <div>
            <strong>${success ? 'Success' : 'Error'}</strong>
            <p>${message}</p>
        </div>
    `;
    
    resultsContainer.appendChild(resultItem);
    feather.replace();
    
    // Auto-remove result after 8 seconds
    setTimeout(() => {
        if (resultItem.parentNode) {
            resultItem.remove();
        }
    }, 8000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export admin module
window.AdminModule = {
    getSiteContent,
    saveSiteContent,
    updateMainSiteContent,
    checkAdminAuthStatus,
    logout
};