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

    // Load images from the GitHub repository /Img folder
    async loadImagesFromRepository() {
        // GitHub repository configuration
        const githubConfig = {
            username: 'SteakTheStake',
            repository: 'Exposures-By-Gabe',
            branch: 'main',
            folder: 'Img'
        };

        // Known images in the repository - add your image filenames here
        const knownImages = [
            'DSC_0696-2.jpg'
            // Add more image filenames here as you upload them to your repository
        ];

        let imageCounter = 1;
        const detectedImages = [];

        // Process known images
        for (const filename of knownImages) {
            try {
                const githubUrl = `https://raw.githubusercontent.com/${githubConfig.username}/${githubConfig.repository}/refs/heads/${githubConfig.branch}/${githubConfig.folder}/${filename}`;
                
                // Test if image exists
                const response = await fetch(githubUrl, { method: 'HEAD' });
                if (response.ok) {
                    const imageData = await this.loadImageWithMetadata(githubUrl, filename, imageCounter);
                    detectedImages.push(imageData);
                    imageCounter++;
                }
            } catch (error) {
                console.log(`Could not load image: ${filename}`);
            }
        }

        // Process each detected image and merge with stored metadata
        this.images = detectedImages.map(img => {
            const metadata = this.imageMetadata[img.filename] || {};
            return {
                id: img.filename,
                filename: img.filename,
                url: img.url, // Use the GitHub URL directly
                alt: img.alt,
                title: metadata.title || img.title,
                tags: metadata.tags || img.defaultTags,
                category: metadata.category || (img.defaultTags[0] || 'photography'),
                captureDate: img.captureDate
            };
        });
    }

    // Get GitHub repository configuration
    getGithubConfig() {
        return {
            username: 'SteakTheStake',
            repository: 'Exposures-By-Gabe',
            branch: 'main',
            folder: 'Img'
        };
    }

    // Add a new image to the known images list
    addImageToGallery(filename) {
        const config = this.getGithubConfig();
        const githubUrl = `https://raw.githubusercontent.com/${config.username}/${config.repository}/refs/heads/${config.branch}/${config.folder}/${filename}`;
        
        // This could be extended to automatically update the known images list
        console.log(`Add this image to the knownImages array in loadImagesFromRepository(): ${filename}`);
        return githubUrl;
    }

    // Load image and extract metadata
    async loadImageWithMetadata(imageUrl, filename, imageNumber) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Try to extract EXIF data (this is limited in browsers)
                const captureDate = this.extractDateFromImage(img, filename);
                const title = captureDate ? this.formatDateTitle(captureDate) : `Image Number: ${imageNumber}`;
                
                resolve({
                    filename: filename,
                    url: imageUrl, // Store the full GitHub URL
                    alt: `${title} photograph`,
                    title: title,
                    captureDate: captureDate,
                    defaultTags: this.generateTagsFromFilename(filename),
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            
            img.onerror = () => {
                // If image fails to load, still create entry
                resolve({
                    filename: filename,
                    url: imageUrl,
                    alt: `Image Number: ${imageNumber} photograph`,
                    title: `Image Number: ${imageNumber}`,
                    captureDate: null,
                    defaultTags: ['photography'],
                    width: 0,
                    height: 0
                });
            };
            
            img.src = imageUrl;
        });
    }

    // Extract date from image (limited without EXIF library)
    extractDateFromImage(img, filename) {
        // Try to extract date from filename patterns
        const datePatterns = [
            /(\d{4})(\d{2})(\d{2})/,  // YYYYMMDD
            /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
            /(\d{4})_(\d{2})_(\d{2})/, // YYYY_MM_DD
            /IMG_(\d{4})(\d{2})(\d{2})/, // IMG_YYYYMMDD
            /DSC(\d{4})(\d{2})(\d{2})/   // DSCYYYYMMDD
        ];

        for (const pattern of datePatterns) {
            const match = filename.match(pattern);
            if (match) {
                const year = parseInt(match[1]);
                const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
                const day = parseInt(match[3]);
                
                if (year >= 1900 && year <= new Date().getFullYear() && 
                    month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                    return new Date(year, month, day);
                }
            }
        }

        return null;
    }

    // Format date for title display
    formatDateTitle(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
                    <p>Add image filenames to the <code>knownImages</code> array in gallery-manager.js to display them from your GitHub repository.</p>
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