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
        // Try to detect actual images in the /img directory
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const detectedImages = [];
        
        // Common image filenames to check for
        const possibleImages = [
            'mountain-vista', 'forest-path', 'ocean-waves', 'misty-forest', 
            'rocky-peaks', 'golden-hour', 'landscape', 'nature', 'photography',
            'portrait', 'sunset', 'sunrise', 'beach', 'forest', 'mountain'
        ];

        // Check for actual images in the /img directory
        for (const baseName of possibleImages) {
            for (const ext of imageExtensions) {
                const filename = `${baseName}.${ext}`;
                try {
                    // Test if image exists by attempting to load it
                    const response = await fetch(`img/${filename}`, { method: 'HEAD' });
                    if (response.ok) {
                        detectedImages.push({
                            filename: filename,
                            alt: this.generateAltFromFilename(filename),
                            defaultTags: this.generateTagsFromFilename(filename)
                        });
                    }
                } catch (error) {
                    // Image doesn't exist, continue checking
                }
            }
        }

        // Process each detected image and merge with stored metadata
        this.images = detectedImages.map(img => {
            const metadata = this.imageMetadata[img.filename] || {};
            return {
                id: img.filename,
                filename: img.filename,
                url: `img/${img.filename}`,
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

    // Generate alt text from filename
    generateAltFromFilename(filename) {
        const title = this.generateTitleFromFilename(filename);
        return `${title} photograph`;
    }

    // Generate default tags from filename
    generateTagsFromFilename(filename) {
        const name = filename.replace(/\.[^/.]+$/, '').toLowerCase();
        const tagMap = {
            'mountain': ['landscape', 'mountain'],
            'forest': ['nature', 'forest'],
            'ocean': ['seascape', 'ocean'],
            'beach': ['seascape', 'beach'],
            'sunset': ['landscape', 'sunset'],
            'sunrise': ['landscape', 'sunrise'],
            'nature': ['nature'],
            'landscape': ['landscape'],
            'portrait': ['portrait'],
            'photography': ['photography']
        };

        // Find matching tags
        for (const [keyword, tags] of Object.entries(tagMap)) {
            if (name.includes(keyword)) {
                return tags;
            }
        }

        // Default tags
        return ['photography'];
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
        
        if (imagesToRender.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-gallery" style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <i data-feather="image" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">No Images Found</h3>
                    <p>Add images to the <code>/img</code> folder in your repository to see them here.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem;">Supported formats: JPG, PNG, GIF, WebP</p>
                </div>
            `;
            // Refresh Feather icons
            if (window.feather) {
                feather.replace();
            }
            return;
        }
        
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