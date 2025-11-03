window.addEventListener('gallery:updated', handleGalleryUpdated);

// Initialize Feather Icons
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    loadDynamicContent();
    initializeNavigation();
    initializeScrollEffects();
    initializeImageModal();
    
    // Initialize gallery
    const galleryManager = new GalleryManager();
    galleryManager.init();
    
    // Make gallery manager globally available for refresh functionality
    window.galleryManager = galleryManager;
    initializeCollectionCards();
    
    // Add refresh button for development/testing
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Gallery';
    refreshButton.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; padding: 10px; background: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer; display: none;';
    refreshButton.onclick = () => galleryManager.refreshGallery();
    document.body.appendChild(refreshButton);
    
    // Show refresh button in development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        refreshButton.style.display = 'block';
    }
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
    
    const source = img.dataset.src || img.src;
    modalImage.src = source;
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

function handleGalleryUpdated(event) {
    const images = event && event.detail && Array.isArray(event.detail.images)
        ? event.detail.images
        : [];
    updateHeroMetrics(images);
    updateHeroPreview(images);
    updateCollectionCounts(images);
}

function updateHeroMetrics(images) {
    const totalImages = images.length;
    const categorySet = new Set();
    const tagFrequency = new Map();

    images.forEach(image => {
        const categoryValue = (image.categoryValue || image.category || '').toString().trim().toLowerCase();
        if (categoryValue) {
            categorySet.add(categoryValue);
        }

        if (Array.isArray(image.tags)) {
            image.tags.forEach(tag => {
                if (!tag) return;
                const normalized = tag.toLowerCase();
                if (normalized === 'photography') return;
                tagFrequency.set(normalized, (tagFrequency.get(normalized) || 0) + 1);
            });
        }
    });

    const stats = {
        images: totalImages,
        categories: categorySet.size,
        tags: tagFrequency.size
    };

    Object.entries(stats).forEach(([key, value]) => {
        const element = document.querySelector(`[data-hero-metric="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    });

    let spotlightTag = null;
    let spotlightCount = 0;
    tagFrequency.forEach((count, tag) => {
        if (count > spotlightCount) {
            spotlightTag = tag;
            spotlightCount = count;
        }
    });

    const highlightElement = document.querySelector('[data-hero-highlight]');
    const highlightCountElement = document.querySelector('[data-hero-highlight-count]');
    const highlightButton = document.querySelector('[data-hero-highlight-button]');

    if (spotlightTag && highlightElement) {
        highlightElement.textContent = capitalizeTag(spotlightTag);
        if (highlightCountElement) {
            highlightCountElement.textContent = spotlightCount;
        }
        if (highlightButton) {
            highlightButton.dataset.tag = spotlightTag;
        }
    } else if (highlightElement) {
        highlightElement.textContent = totalImages > 0 ? 'Gallery' : 'Loading';
        if (highlightCountElement) {
            highlightCountElement.textContent = totalImages;
        }
        if (highlightButton) {
            highlightButton.dataset.tag = 'all';
        }
    }
}

function updateHeroPreview(images) {
    const previewRoot = document.getElementById('heroPreview');
    if (!previewRoot) return;

    if (!images.length) {
        previewRoot.innerHTML = `
            <div class="preview-placeholder">
                <i data-feather="grid"></i>
                <p>Gallery previews appear once images finish loading.</p>
            </div>
        `;
        if (window.feather) {
            feather.replace();
        }
        return;
    }

    const samples = selectHeroSamples(images, 3);
    previewRoot.innerHTML = '';

    samples.forEach(sample => {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'preview-tile subtle-bg elegant-shadow';
        tile.setAttribute('aria-label', `${sample.title} - open collection`);

        const img = document.createElement('img');
        img.src = sample.url;
        img.alt = sample.alt || sample.title || 'Gallery preview';
        img.loading = 'lazy';
        tile.appendChild(img);

        const overlay = document.createElement('div');
        overlay.className = 'preview-overlay';

        const badge = document.createElement('span');
        badge.className = 'preview-badge';
        badge.textContent = capitalizeTag(sample.categoryValue || sample.category || 'Gallery');

        const title = document.createElement('span');
        title.className = 'preview-title';
        title.textContent = sample.title;

        overlay.appendChild(badge);
        overlay.appendChild(title);
        tile.appendChild(overlay);

        tile.addEventListener('click', () => {
            navigateToTag(sample.categoryValue || sample.category || 'all');
        });

        previewRoot.appendChild(tile);
    });

    if (window.feather) {
        feather.replace();
    }
}

function updateCollectionCounts(images) {
    const tagCounts = new Map();
    const aliasMap = {
        portrait: 'portraits',
        portraits: 'portraits',
        landscape: 'landscape',
        landscapes: 'landscape'
    };

    images.forEach(image => {
        if (!Array.isArray(image.tags)) return;
        image.tags.forEach(tag => {
            if (!tag) return;
            const normalized = tag.toLowerCase();
            const canonical = aliasMap[normalized] || normalized;
            tagCounts.set(canonical, (tagCounts.get(canonical) || 0) + 1);
        });
    });

    const cards = document.querySelectorAll('[data-collection-tag]');
    cards.forEach(card => {
        const tag = (card.getAttribute('data-collection-tag') || '').toLowerCase();
        const canonical = aliasMap[tag] || tag;
        const count = tagCounts.get(canonical) || 0;
        const countElement = card.querySelector('[data-collection-count]');
        if (countElement) {
            countElement.textContent = count;
        }
        card.classList.toggle('is-disabled', count === 0);
        if (card instanceof HTMLButtonElement) {
            card.disabled = count === 0;
        }
    });
}

function selectHeroSamples(images, count) {
    if (images.length <= count) {
        return images.slice(0, count);
    }
    const shuffled = images.slice().sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function capitalizeTag(tag) {
    return tag
        .toString()
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

function initializeCollectionCards() {
    const cards = document.querySelectorAll('[data-collection-tag]');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const tag = card.getAttribute('data-collection-tag');
            navigateToTag(tag);
        });
    });

    if (window.galleryManager && typeof window.galleryManager.getAllImages === 'function') {
        const images = window.galleryManager.getAllImages();
        if (Array.isArray(images) && images.length) {
            updateHeroMetrics(images);
            updateHeroPreview(images);
            updateCollectionCounts(images);
        }
    }
}

function navigateToTag(tag) {
    const normalized = tag ? tag.toLowerCase() : 'all';
    if (window.galleryManager && typeof window.galleryManager.filterGallery === 'function') {
        window.galleryManager.filterGallery(normalized);
    }
    scrollToGallery();
}

window.navigateToTag = navigateToTag;

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
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        if (!window.__lazyImageObserver) {
            window.__lazyImageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const source = img.dataset.src;
                        if (source) {
                            img.src = source;
                            img.removeAttribute('data-src');
                        }
                        img.dataset.lazyLoaded = 'true';
                        window.__lazyImageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '200px 0px',
                threshold: 0.01
            });
        }
        
        const observer = window.__lazyImageObserver;
        images.forEach(img => {
            if (img.dataset.lazyLoaded === 'true' || img.dataset.lazyInitialized === 'true') return;
            observer.observe(img);
            img.dataset.lazyInitialized = 'true';
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach(img => {
            if (img.dataset.lazyLoaded === 'true') return;
            const source = img.dataset.src || img.src;
            img.src = source;
            img.removeAttribute('data-src');
            img.dataset.lazyLoaded = 'true';
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
            if (contactItems.length >= 2) {
                if (content.contact.instagram) contactItems[0].textContent = content.contact.instagram;
                if (content.contact.status) contactItems[1].textContent = content.contact.status;
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
