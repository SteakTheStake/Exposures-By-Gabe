// Gallery Manager for Repository-based Images
// Handles loading images from /img folder and managing their metadata

class GalleryManager {
    constructor() {
        this.images = [];
        this.imageMetadata = JSON.parse(localStorage.getItem('gallery-metadata') || '{}');
        this.init();
    }

    // Initialize the gallery manager
    async init() {
        await this.loadImagesFromRepository();
        this.renderGallery();
        this.setupFilters();
    }

    // Load images from the repository /img folder
    async loadImagesFromRepository() {
        // For GitHub Pages, we need to maintain a list of images
        // This would be updated when new images are added to the repository
        const repositoryImages = [
            {
                filename: 'mountain-vista.jpg',
                alt: 'Mountain landscape with dramatic sky',
                defaultTags: ['landscape', 'mountain'],
                fallbackUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
            },
            {
                filename: 'forest-path.jpg', 
                alt: 'Winding forest path through tall trees',
                defaultTags: ['nature', 'forest'],
                fallbackUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop'
            },
            {
                filename: 'ocean-waves.jpg',
                alt: 'Ocean waves crashing on rocky shore',
                defaultTags: ['seascape', 'ocean'],
                fallbackUrl: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop'
            },
            {
                filename: 'misty-forest.jpg',
                alt: 'Misty forest with morning fog',
                defaultTags: ['nature', 'forest', 'mist'],
                fallbackUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
            },
            {
                filename: 'rocky-peaks.jpg',
                alt: 'Rocky mountain peaks at sunset',
                defaultTags: ['landscape', 'mountain', 'rock'],
                fallbackUrl: 'https://images.unsplash.com/photo-1464822759844-d150baec843a?w=800&h=600&fit=crop'
            },
            {
                filename: 'golden-hour.jpg',
                alt: 'Golden hour landscape photography',
                defaultTags: ['landscape', 'sunset', 'golden'],
                fallbackUrl: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?w=800&h=600&fit=crop'
            }
        ];

        // Process each image and merge with stored metadata
        this.images = repositoryImages.map(img => {
            const metadata = this.imageMetadata[img.filename] || {};
            return {
                id: img.filename,
                filename: img.filename,
                url: img.fallbackUrl || `img/${img.filename}`,
                alt: img.alt,
                title: metadata.title || this.generateTitleFromFilename(img.filename),
                tags: metadata.tags || img.defaultTags,
                category: metadata.category || (img.defaultTags[0] || 'uncategorized')
            };
        });
    }

    // Generate a human-readable title from filename
    generateTitleFromFilename(filename) {
        return filename
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
    }

    // Save metadata to localStorage
    saveMetadata() {
        const metadata = {};
        this.images.forEach(img => {
            metadata[img.filename] = {
                title: img.title,
                tags: img.tags,
                category: img.category
            };
        });
        localStorage.setItem('gallery-metadata', JSON.stringify(metadata));
        this.imageMetadata = metadata;
    }

    // Update image metadata
    updateImageMetadata(filename, updates) {
        const image = this.images.find(img => img.filename === filename);
        if (image) {
            Object.assign(image, updates);
            this.saveMetadata();
            this.renderGallery();
            this.setupFilters();
        }
    }

    // Get all unique tags
    getAllTags() {
        const tagSet = new Set();
        this.images.forEach(img => {
            if (img.tags) {
                img.tags.forEach(tag => tagSet.add(tag.toLowerCase()));
            }
        });
        return Array.from(tagSet).sort();
    }

    // Filter images by tag
    filterImages(tag) {
        if (tag === 'all') return this.images;
        return this.images.filter(img => 
            img.tags && img.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
    }

    // Render the gallery
    renderGallery(filteredImages = null) {
        const galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;

        const imagesToRender = filteredImages || this.images;
        
        galleryGrid.innerHTML = imagesToRender.map(img => `
            <div class="gallery-item" onclick="openModal(this)" data-tags="${(img.tags || []).join(',')}" data-filename="${img.filename}">
                <div class="item-tags">
                    ${(img.tags || []).map(tag => `<span class="tag-badge">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                <img src="${img.url}" alt="${this.escapeHtml(img.alt)}" loading="lazy">
                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <h3>${this.escapeHtml(img.title)}</h3>
                        <p>${this.escapeHtml(img.category)}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-initialize scroll effects for new items
        if (window.initializeScrollEffects) {
            window.initializeScrollEffects();
        }
    }

    // Setup filter buttons
    setupFilters() {
        const filterButtons = document.getElementById('filterButtons');
        if (!filterButtons) return;

        const allTags = this.getAllTags();
        
        filterButtons.innerHTML = `
            <button class="filter-btn active" onclick="window.galleryManager.filterGallery('all')">All</button>
            ${allTags.map(tag => 
                `<button class="filter-btn" onclick="window.galleryManager.filterGallery('${tag}')">${tag.charAt(0).toUpperCase() + tag.slice(1)}</button>`
            ).join('')}
        `;
    }

    // Filter gallery and update UI
    filterGallery(filterTag) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        // Update active filter button
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase() === filterTag || 
                (filterTag === 'all' && btn.textContent === 'All')) {
                btn.classList.add('active');
            }
        });
        
        // Filter and render images
        const filteredImages = this.filterImages(filterTag);
        this.renderGallery(filteredImages);
        
        // Update scroll effects for visible items
        setTimeout(() => {
            if (window.initializeScrollEffects) {
                window.initializeScrollEffects();
            }
        }, 100);
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get image for admin editing
    getImageByFilename(filename) {
        return this.images.find(img => img.filename === filename);
    }

    // Get all images for admin
    getAllImages() {
        return this.images;
    }
}

// Initialize gallery manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.galleryManager = new GalleryManager();
});

// Export for use in other modules
window.GalleryManager = GalleryManager;