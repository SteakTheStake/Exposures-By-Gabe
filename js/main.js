// Initialize Feather Icons
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    loadDynamicContent();
    initializeNavigation();
    initializeScrollEffects();
    initializeImageModal();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    // Handle smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                    
                    // Update active navigation link
                    updateActiveNavLink(targetId.substring(1));
                }
            }
        });
    });
    
    // Handle scroll spy for navigation
    window.addEventListener('scroll', throttle(handleScrollSpy, 100));
}

// Update active navigation link
function updateActiveNavLink(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activeSection}`) {
            link.classList.add('active');
        }
    });
}

// Handle scroll spy
function handleScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100; // Offset for navbar
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            updateActiveNavLink(sectionId);
        }
    });
}

// Initialize scroll effects
function initializeScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        observer.observe(item);
    });
    
    // Observe sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Image modal functionality
function initializeImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// Open image modal
function openModal(galleryItem) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    
    const img = galleryItem.querySelector('img');
    const title = galleryItem.querySelector('h3').textContent;
    const category = galleryItem.querySelector('p').textContent;
    
    modalImage.src = img.src;
    modalImage.alt = img.alt;
    modalTitle.textContent = title;
    modalCategory.textContent = category;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add fade-in animation
    modal.classList.add('fade-in');
}

// Close image modal
function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    modal.classList.remove('fade-in');
}

// Scroll to gallery section
function scrollToGallery() {
    const gallerySection = document.getElementById('gallery');
    const offsetTop = gallerySection.offsetTop - 70;
    
    window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
    
    updateActiveNavLink('gallery');
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('mobile-active');
}

// Utility function: Throttle
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Utility function: Debounce
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Handle lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    }
}

// Load dynamic content from admin changes
function loadDynamicContent() {
    try {
        const contentData = localStorage.getItem('portfolioContent');
        if (!contentData) return;
        
        const content = JSON.parse(contentData);
        
        // Update hero section
        if (content.hero) {
            const heroTitle = document.querySelector('.hero-title');
            const heroSubtitle = document.querySelector('.hero-subtitle');
            if (heroTitle && content.hero.title) heroTitle.textContent = content.hero.title;
            if (heroSubtitle && content.hero.subtitle) heroSubtitle.textContent = content.hero.subtitle;
        }
        
        // Update about section
        if (content.about) {
            const aboutDescriptions = document.querySelectorAll('.about-description');
            if (aboutDescriptions.length >= 2) {
                if (content.about.paragraph1) aboutDescriptions[0].textContent = content.about.paragraph1;
                if (content.about.paragraph2) aboutDescriptions[1].textContent = content.about.paragraph2;
            }
        }
        
        // Update contact section
        if (content.contact) {
            const contactItems = document.querySelectorAll('.contact-item span');
            if (contactItems.length >= 3) {
                if (content.contact.email) contactItems[0].textContent = content.contact.email;
                if (content.contact.instagram) contactItems[1].textContent = content.contact.instagram;
                if (content.contact.status) contactItems[2].textContent = content.contact.status;
            }
        }
        
        // Update portrait image
        if (content.images && content.images.portrait) {
            const aboutPlaceholder = document.querySelector('.about-placeholder');
            if (aboutPlaceholder) {
                aboutPlaceholder.innerHTML = `<img src="${content.images.portrait}" alt="Portrait" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        }
        
        // Update logo (if there's a logo display area)
        if (content.images && content.images.logo) {
            const navTitle = document.querySelector('.nav-title');
            if (navTitle) {
                navTitle.innerHTML = `<img src="${content.images.logo}" alt="Logo" style="height: 40px; width: auto;">`;
            }
        }
        
    } catch (error) {
        console.error('Error loading dynamic content:', error);
    }
}

// Initialize on load
window.addEventListener('load', function() {
    initializeLazyLoading();
    
    // Add loaded class to body for animations
    document.body.classList.add('loaded');
});

// Handle window resize
window.addEventListener('resize', debounce(function() {
    // Update any size-dependent calculations
    handleScrollSpy();
}, 250));

// Gallery filtering is now handled by gallery-manager.js

// Performance monitoring (optional)
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}
