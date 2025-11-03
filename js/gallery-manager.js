// Gallery Manager for Repository-based Images
// Handles loading images from /img folder and managing their metadata

const GALLERY_CATEGORY_OPTIONS = Object.freeze([
    { value: 'uncategorized', label: 'Uncategorized' },
    { value: 'lofi', label: 'Lofi' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'portraits', label: 'Portraits' },
    { value: 'landscape', label: 'Landscape' },
    { value: 'street', label: 'Street' },
    { value: 'urbex', label: 'Urbex' }
]);

if (typeof window !== 'undefined') {
    window.GALLERY_CATEGORIES = GALLERY_CATEGORY_OPTIONS;
}

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

    // Load images dynamically from the GitHub repository /Img folder
    async loadImagesFromRepository() {
        // GitHub repository configuration
        const githubConfig = {
            username: 'SteakTheStake',
            repository: 'Exposures-By-Gabe',
            branch: 'main',
            folder: 'Img'
        };

        try {
            // Fetch directory contents from GitHub API
            const apiUrl = `https://api.github.com/repos/${githubConfig.username}/${githubConfig.repository}/contents/${githubConfig.folder}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch repository contents');
            }

            const contents = await response.json();
            const detectedImages = [];
            let imageCounter = 1;

            // Filter for image files and process them
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'];
            
            for (const item of contents) {
                // Check if it's a file (not a directory) and has an image extension
                if (item.type === 'file') {
                    const extension = item.name.toLowerCase().split('.').pop();
                    if (imageExtensions.includes(extension)) {
                        // Generate the raw GitHub URL for the image
                        const githubRawUrl = `https://raw.githubusercontent.com/${githubConfig.username}/${githubConfig.repository}/refs/heads/${githubConfig.branch}/${githubConfig.folder}/${item.name}`;
                        
                        try {
                            const imageData = await this.loadImageWithMetadata(githubRawUrl, item.name, imageCounter);
                            detectedImages.push(imageData);
                            imageCounter++;
                        } catch (error) {
                            console.log(`Could not load image: ${item.name}`);
                        }
                    }
                }
            }

            // Process each detected image and merge with stored metadata
            this.images = detectedImages.map(img => {
                const metadata = this.imageMetadata[img.filename] || {};
                const defaultCategoryCandidate = (img.defaultTags && img.defaultTags[0]) || metadata.category;
                const categoryDetails = this.resolveCategory(metadata.category, metadata.categoryValue, defaultCategoryCandidate);
                const baseTags = this.normalizeTags(metadata.tags || img.defaultTags);
                const tags = this.ensureCategoryTag(baseTags, categoryDetails.value);

                return {
                    id: img.filename,
                    filename: img.filename,
                    url: img.url, // Use the GitHub raw URL directly
                    alt: img.alt,
                    title: metadata.title || img.title,
                    tags: tags,
                    category: categoryDetails.label,
                    categoryValue: categoryDetails.value,
                    captureDate: img.captureDate
                };
            });
        } catch (error) {
            console.error('Error loading images from repository:', error);
            this.images = [];
        } finally {
            this.notifyGalleryUpdated();
        }
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

    // Refresh gallery to check for new images
    async refreshGallery() {
        console.log('Refreshing gallery from GitHub repository...');
        await this.loadImagesFromRepository();
        this.renderGallery();
        this.setupFilters();
    }

    // Generate GitHub raw URL for any filename
    generateGithubRawUrl(filename) {
        const config = this.getGithubConfig();
        return `https://raw.githubusercontent.com/${config.username}/${config.repository}/refs/heads/${config.branch}/${config.folder}/${filename}`;
    }

    getCategoryOptions() {
        const shared = window.GALLERY_CATEGORIES;
        if (Array.isArray(shared) && shared.length > 0) {
            return shared;
        }
        return GALLERY_CATEGORY_OPTIONS;
    }

    getDefaultCategory() {
        const options = this.getCategoryOptions();
        return options.find(opt => opt.value === 'uncategorized') || options[0];
    }

    getCategoryOptionByValue(value) {
        if (!value) return null;
        const normalized = value.toString().trim().toLowerCase();
        if (!normalized) return null;
        const options = this.getCategoryOptions();
        return options.find(opt => opt.value === normalized) || null;
    }

    resolveCategory(labelCandidate, valueCandidate, fallbackCandidate) {
        const candidates = [
            valueCandidate,
            labelCandidate,
            fallbackCandidate
        ];

        for (const candidate of candidates) {
            const normalized = this.normalizeCategory(candidate);
            if (normalized) {
                return normalized;
            }
        }

        const defaultCategory = this.getDefaultCategory();
        return defaultCategory ? { ...defaultCategory } : { value: 'uncategorized', label: 'Uncategorized' };
    }

    normalizeCategory(candidate) {
        if (!candidate) return null;
        const text = candidate.toString().trim();
        if (!text) return null;

        const lower = text.toLowerCase();
        const directOption = this.getCategoryOptionByValue(lower);
        if (directOption) {
            return { ...directOption };
        }

        const labelMatch = this.getCategoryOptions().find(opt => opt.label.toLowerCase() === lower);
        if (labelMatch) {
            return { ...labelMatch };
        }

        return {
            value: this.slugifyCategory(text),
            label: this.toTitleCase(text)
        };
    }

    normalizeTags(tags) {
        const normalized = new Set();
        (tags || []).forEach(tag => {
            if (!tag && tag !== 0) return;
            const cleaned = tag.toString().trim().toLowerCase();
            if (cleaned) {
                normalized.add(cleaned);
            }
        });
        return Array.from(normalized);
    }

    ensureCategoryTag(tags, categoryValue) {
        const normalized = new Set(this.normalizeTags(tags));
        if (categoryValue) {
            normalized.add(categoryValue.toString().trim().toLowerCase());
        }
        return Array.from(normalized);
    }

    slugifyCategory(value) {
        return value
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'uncategorized';
    }

    toTitleCase(text) {
        return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    }

    // Build metadata for an image without preloading the full asset
    async loadImageWithMetadata(imageUrl, filename, imageNumber) {
        const captureDate = this.extractDateFromFilename(filename);
        const inferredTitle = this.generateTitleFromFilename(filename);
        const title = captureDate
            ? this.formatDateTitle(captureDate)
            : inferredTitle || `Image Number: ${imageNumber}`;

        return {
            filename: filename,
            url: imageUrl, // Store the full GitHub URL
            alt: this.generateAltFromFilename(filename),
            title: title,
            captureDate: captureDate,
            defaultTags: this.generateTagsFromFilename(filename)
        };
    }

    // Extract date information from a filename
    extractDateFromFilename(filename) {
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
        if (!filename) {
            return ['photography'];
        }

        const baseName = filename.replace(/\.[^/.]+$/, '').toLowerCase();
        const rawTokens = baseName.split(/[^a-z0-9]+/).filter(Boolean);

        const keywordMap = {
            'abstract': ['abstract'],
            'abrstract': ['abstract'],
            'animal': ['animal'],
            'animals': ['animal'],
            'beach': ['coastal', 'beach'],
            'casual': ['casual'],
            'car': ['cars', 'car'],
            'cars': ['cars', 'car'],
            'coast': ['coastal'],
            'coastal': ['coastal'],
            'forest': ['nature', 'forest'],
            'forests': ['nature', 'forest'],
            'geometric': ['geometric'],
            'industrial': ['industrial'],
            'industry': ['industrial'],
            'landscape': ['landscape'],
            'landscapes': ['landscape'],
            'lofi': ['lofi'],
            'mountain': ['landscape', 'mountain'],
            'mountains': ['landscape', 'mountain'],
            'nature': ['nature'],
            'night': ['night'],
            'nightly': ['night'],
            'ocean': ['coastal', 'ocean'],
            'people': ['people'],
            'person': ['people'],
            'portrait': ['portraits', 'portrait'],
            'portraits': ['portraits', 'portrait'],
            'sea': ['coastal', 'ocean'],
            'sky': ['sky'],
            'skies': ['sky'],
            'steet': ['street'],
            'stree': ['street'],
            'street': ['street'],
            'streets': ['street'],
            'sunrise': ['landscape', 'sunrise'],
            'sunset': ['landscape', 'sunset'],
            'uncanny': ['uncanny'],
            'urbex': ['urbex'],
            'urban': ['urbex', 'street'],
            'vehicle': ['cars'],
            'vehicles': ['cars']
        };

        const stopWords = new Set([
            'a', 'an', 'and', 'at', 'by', 'from', 'for', 'in', 'into', 'of', 'on', 'onto', 'or', 'over',
            'the', 'to', 'with', 'without', 'img', 'image', 'images', 'photo', 'photograph', 'photography',
            'copy', 'final', 'edited', 'edit', 'version', 'untitled', 'new', 'draft', 'tmp', 'test'
        ]);

        const seen = new Set();
        const tags = [];
        const addTag = (tag) => {
            const normalized = tag.toString().trim().toLowerCase();
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            tags.push(normalized);
        };

        rawTokens.forEach(token => {
            const normalizedToken = token.trim().toLowerCase();
            if (!normalizedToken) return;
            if (normalizedToken.length <= 2) return;
            if (stopWords.has(normalizedToken)) return;
            if (/\d/.test(normalizedToken)) return;

            const mapped = keywordMap[normalizedToken];
            if (mapped) {
                mapped.forEach(addTag);
            } else {
                addTag(normalizedToken);
            }
        });

        if (tags.length === 0) {
            addTag('photography');
        }

        const categoryValues = new Set(
            this.getCategoryOptions().map(option => option.value)
        );

        if (categoryValues.size > 0) {
            const categoryTags = [];
            const otherTags = [];
            tags.forEach(tag => {
                if (categoryValues.has(tag)) {
                    categoryTags.push(tag);
                } else {
                    otherTags.push(tag);
                }
            });
            return categoryTags.concat(otherTags);
        }

        return tags;
    }

    // Save metadata to localStorage
    saveMetadata() {
        const metadata = {};
        this.images.forEach(img => {
            metadata[img.filename] = {
                title: img.title,
                tags: img.tags,
                category: img.category,
                categoryValue: img.categoryValue
            };
        });
        localStorage.setItem('gallery-metadata', JSON.stringify(metadata));
        this.imageMetadata = metadata;
    }

    // Update image metadata
    updateImageMetadata(filename, updates) {
        const image = this.images.find(img => img.filename === filename);
        if (!image) return;

        const nextTitle = updates.title ? updates.title.trim() : '';
        if (nextTitle) {
            image.title = nextTitle;
            image.alt = `${nextTitle} photograph`;
        }

        const categoryDetails = this.resolveCategory(
            updates.category || image.category,
            updates.categoryValue || image.categoryValue,
            image.categoryValue || image.category
        );
        image.category = categoryDetails.label;
        image.categoryValue = categoryDetails.value;

        const providedTags = Array.isArray(updates.tags) ? updates.tags : image.tags;
        image.tags = this.ensureCategoryTag(providedTags, image.categoryValue);

        this.saveMetadata();
        this.renderGallery();
        this.setupFilters();
        this.notifyGalleryUpdated();
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
        const placeholderImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        
        if (imagesToRender.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-gallery" style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <i data-feather="image" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">No Images Found</h3>
                    <p>Upload images to the <code>/Img</code> folder in your GitHub repository and they will automatically appear here.</p>
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
            <div class="gallery-item" onclick="openModal(this)" data-tags="${(img.tags || []).join(',')}" data-filename="${img.filename}" data-category="${this.escapeHtml(img.categoryValue || '')}">
                <div class="item-tags">
                    ${(img.tags || []).map(tag => `<span class="tag-badge">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                <img 
                    class="lazy-image"
                    src="${placeholderImage}"
                    data-src="${img.url}"
                    alt="${this.escapeHtml(img.alt)}"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low">
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

        // Ensure lazy loading observers track the new images
        if (window.initializeLazyLoading) {
            window.initializeLazyLoading();
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

    notifyGalleryUpdated() {
        if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
            return;
        }
        if (typeof CustomEvent !== 'function') {
            return;
        }
        try {
            window.dispatchEvent(new CustomEvent('gallery:updated', {
                detail: {
                    images: this.images
                }
            }));
        } catch (error) {
            console.error('Failed to dispatch gallery update event:', error);
        }
    }
}

// Initialize gallery manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.galleryManager = new GalleryManager();
});

// Export for use in other modules
window.GalleryManager = GalleryManager;
