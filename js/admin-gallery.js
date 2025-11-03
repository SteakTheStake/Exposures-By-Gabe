// Admin Gallery Management for Repository Images
// Handles tagging and metadata editing for images in the /img folder

class AdminGalleryManager {
    constructor() {
        this.galleryManager = null;
        this.currentImage = null;
        this.filters = {
            search: '',
            category: 'all'
        };
        this.lastSync = new Date();
        this.searchDebounce = null;
        this.init();
    }

    // Initialize admin gallery manager
    init() {
        // Wait for gallery manager to be ready
        const checkGalleryManager = () => {
            if (window.galleryManager) {
                this.galleryManager = window.galleryManager;
                this.setupAdminInterface();
            } else {
                setTimeout(checkGalleryManager, 100);
            }
        };
        checkGalleryManager();
    }

    // Setup the admin interface
    setupAdminInterface() {
        this.lastSync = new Date();
        this.populateCategoryFilter();
        this.bindToolbarControls();
        this.renderOverviewStats();
        this.renderImageManagement();
        this.setupTagEditor();
    }

    getCategoryOptions() {
        const categories = window.GALLERY_CATEGORIES;
        if (Array.isArray(categories) && categories.length > 0) {
            return categories;
        }
        return [
            { value: 'uncategorized', label: 'Uncategorized' },
            { value: 'lofi', label: 'Lofi' },
            { value: 'abstract', label: 'Abstract' },
            { value: 'portraits', label: 'Portraits' },
            { value: 'landscape', label: 'Landscape' },
            { value: 'street', label: 'Street' },
            { value: 'urbex', label: 'Urbex' }
        ];
    }

    getDefaultCategoryValue() {
        const options = this.getCategoryOptions();
        return options.find(opt => opt.value === 'uncategorized')?.value || (options[0]?.value || 'uncategorized');
    }

    normalizeCategoryValue(value) {
        if (!value) return this.getDefaultCategoryValue();
        return value
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || this.getDefaultCategoryValue();
    }

    getCategoryOptionByValue(value) {
        if (!value) return null;
        const normalized = value.toString().trim().toLowerCase();
        return this.getCategoryOptions().find(opt => opt.value === normalized) || null;
    }

    getCategoryOptionsHtml(selectedValue) {
        const value = selectedValue || this.getDefaultCategoryValue();
        const options = this.getCategoryOptions();
        const optionsHtml = options
            .map(opt => `
                <option value="${this.escapeHtml(opt.value)}"${opt.value === value ? ' selected' : ''}>
                    ${this.escapeHtml(opt.label)}
                </option>
            `).join('');

        const hasSelected = options.some(opt => opt.value === value);
        if (!hasSelected && value) {
            return optionsHtml + `
                <option value="${this.escapeHtml(value)}" selected>
                    ${this.escapeHtml(this.formatCategoryLabel(value))}
                </option>
            `;
        }

        return optionsHtml;
    }

    formatCategoryLabel(value) {
        if (!value) return 'Uncategorized';
        return value
            .toString()
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    bindToolbarControls() {
        const searchInput = document.getElementById('imageSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                const value = event.target.value.toLowerCase();
                clearTimeout(this.searchDebounce);
                this.searchDebounce = setTimeout(() => {
                    this.filters.search = value.trim();
                    this.renderImageManagement();
                }, 150);
            });
        }

        const categorySelect = document.getElementById('categoryFilterSelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (event) => {
                const selected = event.target.value;
                this.filters.category = selected === 'all'
                    ? 'all'
                    : this.normalizeCategoryValue(selected);
                this.renderImageManagement();
            });
        }

        const clearFiltersButton = document.getElementById('clearFiltersButton');
        if (clearFiltersButton) {
            clearFiltersButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        const refreshButton = document.getElementById('refreshGalleryButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', async () => {
                if (!this.galleryManager) return;
                const originalHtml = refreshButton.innerHTML;
                refreshButton.disabled = true;
                refreshButton.classList.add('is-loading');
                refreshButton.setAttribute('aria-busy', 'true');
                refreshButton.innerHTML = `
                    <i data-feather="loader" class="icon-spin"></i>
                    <span>Syncing...</span>
                `;
                if (window.feather) {
                    feather.replace();
                }

                try {
                    await this.galleryManager.refreshGallery();
                    this.lastSync = new Date();
                    this.populateCategoryFilter();
                    this.renderOverviewStats();
                    this.renderImageManagement();
                    this.showMessage('Gallery refreshed successfully.', 'success');
                } catch (error) {
                    console.error('Failed to refresh gallery:', error);
                    this.showMessage('Unable to refresh gallery. Please try again.', 'error');
                } finally {
                    refreshButton.disabled = false;
                    refreshButton.classList.remove('is-loading');
                    refreshButton.removeAttribute('aria-busy');
                    refreshButton.innerHTML = originalHtml;
                    if (window.feather) {
                        feather.replace();
                    }
                }
            });
        }
    }

    resetFilters() {
        this.filters = { search: '', category: 'all' };

        const searchInput = document.getElementById('imageSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        const categorySelect = document.getElementById('categoryFilterSelect');
        if (categorySelect) {
            categorySelect.value = 'all';
        }

        this.renderImageManagement();
    }

    populateCategoryFilter() {
        const select = document.getElementById('categoryFilterSelect');
        if (!select) return;

        const options = this.getCategoryOptions();
        const uniqueValues = new Set(options.map(opt => opt.value));

        const currentValue = this.filters.category;
        const optionsHtml = [
            '<option value="all">All categories</option>',
            ...options.map(opt => `<option value="${this.escapeHtml(opt.value)}">${this.escapeHtml(opt.label)}</option>`)
        ];

        if (currentValue !== 'all' && !uniqueValues.has(currentValue)) {
            optionsHtml.push(`<option value="${this.escapeHtml(currentValue)}">${this.escapeHtml(this.formatCategoryLabel(currentValue))}</option>`);
        }

        select.innerHTML = optionsHtml.join('');
        select.value = currentValue;
    }

    applyFilters(images) {
        const searchTerm = this.filters.search;
        const selectedCategory = this.filters.category;

        return images.filter(image => {
            const normalizedCategory = this.normalizeCategoryValue(image.categoryValue || image.category);
            if (selectedCategory !== 'all' && normalizedCategory !== selectedCategory) {
                return false;
            }

            if (searchTerm) {
                const haystack = [
                    image.title,
                    image.filename,
                    ...(image.tags || [])
                ].join(' ').toLowerCase();

                if (!haystack.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    }

    renderOverviewStats() {
        if (!this.galleryManager) return;

        const images = this.galleryManager.getAllImages();
        const stats = this.calculateStats(images);

        const totalImagesElement = document.querySelector('[data-metric="total-images"]');
        if (totalImagesElement) {
            totalImagesElement.textContent = stats.totalImages;
        }

        const filteredSummaryElement = document.querySelector('[data-metric="filtered-summary"]');
        if (filteredSummaryElement) {
            filteredSummaryElement.textContent = stats.filteredSummary;
        }

        const uniqueCategoriesElement = document.querySelector('[data-metric="unique-categories"]');
        if (uniqueCategoriesElement) {
            uniqueCategoriesElement.textContent = stats.uniqueCategories;
        }

        const uniqueTagsElement = document.querySelector('[data-metric="unique-tags"]');
        if (uniqueTagsElement) {
            uniqueTagsElement.textContent = stats.uniqueTags;
        }

        const untaggedElement = document.querySelector('[data-metric="untagged-images"]');
        if (untaggedElement) {
            untaggedElement.textContent = stats.untaggedImages;
        }

        const lastSyncElement = document.querySelector('[data-metric="last-sync"]');
        if (lastSyncElement) {
            lastSyncElement.textContent = this.formatTimestamp(this.lastSync);
        }
    }

    calculateStats(images) {
        const totalImages = images.length;
        const categorySet = new Set();
        const tagSet = new Set();
        let untaggedImages = 0;

        images.forEach(image => {
            const categoryValue = this.normalizeCategoryValue(image.categoryValue || image.category);
            if (categoryValue) {
                categorySet.add(categoryValue);
            }

            const tags = Array.isArray(image.tags) ? image.tags : [];
            if (tags.length === 0 || (tags.length === 1 && tags[0] === 'photography')) {
                untaggedImages += 1;
            }

            tags.forEach(tag => {
                if (tag) {
                    tagSet.add(tag.toLowerCase());
                }
            });
        });

        const filteredImages = this.applyFilters(images);
        let filteredSummary = `${filteredImages.length} of ${totalImages}`;
        if (totalImages === 0) {
            filteredSummary = 'No images';
        } else if (filteredImages.length === totalImages) {
            filteredSummary = 'All images';
        }

        return {
            totalImages,
            uniqueCategories: categorySet.size,
            uniqueTags: tagSet.size,
            untaggedImages,
            filteredSummary
        };
    }

    updateImageSummary(total, filtered) {
        const summaryElement = document.getElementById('imageListSummary');
        if (summaryElement) {
            if (total === 0) {
                summaryElement.textContent = 'No images detected in the gallery.';
            } else if (filtered === total) {
                summaryElement.textContent = `Showing all ${total} images`;
            } else {
                summaryElement.textContent = `Showing ${filtered} of ${total} images`;
            }
        }

        const filteredSummaryElement = document.querySelector('[data-metric="filtered-summary"]');
        if (filteredSummaryElement) {
            if (total === 0) {
                filteredSummaryElement.textContent = 'No images';
            } else if (filtered === total) {
                filteredSummaryElement.textContent = 'All images';
            } else {
                filteredSummaryElement.textContent = `${filtered} of ${total}`;
            }
        }
    }

    formatTimestamp(timestamp) {
        if (!(timestamp instanceof Date)) {
            return '--';
        }
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(timestamp);
    }
    formatTagList(tags) {
        if (!Array.isArray(tags) || tags.length === 0) {
            return 'None';
        }
        return tags
            .map(tag => this.escapeHtml(tag))
            .join(', ');
    }

    // Render image management interface
    renderImageManagement() {
        const container = document.getElementById('imageManagementSection');
        if (!container) return;

        const images = this.galleryManager.getAllImages();
        const filteredImages = this.applyFilters(images);
        this.updateImageSummary(images.length, filteredImages.length);

        if (filteredImages.length === 0) {
            container.innerHTML = `
                <div class="admin-empty-state subtle-bg elegant-shadow">
                    <div class="empty-icon">
                        <i data-feather="inbox"></i>
                    </div>
                    <h4>No images match the current filters</h4>
                    <p>Try adjusting the search or category filter to see gallery items.</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="admin-grid admin-image-grid">
                    ${filteredImages.map(img => `
                        <article class="admin-card subtle-bg elegant-shadow admin-image-card">
                            <div class="image-preview">
                                <img src="${this.escapeHtml(img.url)}" alt="${this.escapeHtml(img.alt)}" loading="lazy">
                            </div>
                            <div class="image-info">
                                <h4 class="image-title">${this.escapeHtml(img.title)}</h4>
                                <p class="image-meta"><strong>Filename:</strong> ${this.escapeHtml(img.filename)}</p>
                                <p class="image-meta"><strong>Category:</strong> ${this.escapeHtml(img.category || 'Uncategorized')}</p>
                                <p class="image-meta"><strong>Tags:</strong> ${this.formatTagList(img.tags)}</p>
                            </div>
                            <div class="image-actions">
                                <button onclick="window.adminGalleryManager.editImage('${this.escapeHtml(img.filename)}')" class="admin-btn" type="button">
                                    <i data-feather="edit"></i>
                                    <span>Edit Metadata</span>
                                </button>
                            </div>
                        </article>
                    `).join('')}
                </div>
            `;
        }

        this.renderOverviewStats();

        // Refresh Feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    // Setup tag editor interface
    setupTagEditor() {
        const container = document.getElementById('tagEditorSection');
        if (!container) return;

        container.innerHTML = `
            <h3>Tag Editor</h3>
            <div class="admin-card subtle-bg elegant-shadow" id="tagEditorCard" style="display: none;">
                <h4 id="currentImageTitle">Select an image to edit</h4>
                <div class="current-image-preview" id="currentImagePreview"></div>
                
                <div class="form-group">
                    <label for="imageTitle">Image Title</label>
                    <input type="text" id="imageTitle" class="admin-input" placeholder="Enter image title">
                </div>
                
                <div class="form-group">
                    <label for="imageCategory">Category</label>
                    <select id="imageCategory" class="admin-input">
                        ${this.getCategoryOptionsHtml()}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="imageTags">Tags (comma-separated)</label>
                    <input type="text" id="imageTags" class="admin-input" placeholder="landscape, nature, sunset">
                </div>
                
                <div class="tag-actions">
                    <button onclick="window.adminGalleryManager.saveImageChanges()" class="admin-btn">
                        <i data-feather="save"></i>
                        Save Changes
                    </button>
                    <button onclick="window.adminGalleryManager.cancelEdit()" class="admin-btn" style="background: var(--tertiary-dark);">
                        <i data-feather="x"></i>
                        Cancel
                    </button>
                </div>
            </div>
        `;

        if (window.feather) {
            feather.replace();
        }
    }

    // Edit image metadata
    editImage(filename) {
        const image = this.galleryManager.getImageByFilename(filename);
        if (!image) return;

        this.currentImage = image;
        
        // Show tag editor
        const tagEditor = document.getElementById('tagEditorCard');
        const title = document.getElementById('currentImageTitle');
        const preview = document.getElementById('currentImagePreview');
        const titleInput = document.getElementById('imageTitle');
        const categoryInput = document.getElementById('imageCategory');
        const tagsInput = document.getElementById('imageTags');

        if (tagEditor && title && preview && titleInput && categoryInput && tagsInput) {
            tagEditor.style.display = 'block';
            title.textContent = `Editing: ${image.title}`;
            preview.innerHTML = `<img src="${image.url}" alt="${this.escapeHtml(image.alt)}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px;">`;
            
            titleInput.value = image.title;
            const selectedCategory = this.normalizeCategoryValue(image.categoryValue || image.category);
            categoryInput.innerHTML = this.getCategoryOptionsHtml(selectedCategory);
            categoryInput.value = selectedCategory;
            tagsInput.value = (image.tags || []).join(', ');

            // Scroll to editor
            tagEditor.scrollIntoView({ behavior: 'smooth' });
        }

        // Refresh Feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    // Save image changes
    saveImageChanges() {
        if (!this.currentImage) return;

        const titleInput = document.getElementById('imageTitle');
        const categoryInput = document.getElementById('imageCategory');
        const tagsInput = document.getElementById('imageTags');

        if (!titleInput || !categoryInput || !tagsInput) return;

        const categoryValue = this.normalizeCategoryValue(categoryInput.value || this.getDefaultCategoryValue());
        const categoryOption = this.getCategoryOptionByValue(categoryValue);

        const updates = {
            title: titleInput.value.trim() || this.currentImage.title,
            category: categoryOption ? categoryOption.label : this.formatCategoryLabel(categoryValue),
            categoryValue: categoryOption ? categoryOption.value : categoryValue,
            tags: tagsInput.value.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0)
        };

        // Update the image metadata
        this.galleryManager.updateImageMetadata(this.currentImage.filename, updates);
        
        // Show success message
        this.showMessage('Image metadata updated successfully!', 'success');
        
        // Refresh admin interface
        this.renderImageManagement();
        this.cancelEdit();
    }

    // Cancel editing
    cancelEdit() {
        const tagEditor = document.getElementById('tagEditorCard');
        if (tagEditor) {
            tagEditor.style.display = 'none';
        }
        this.currentImage = null;
    }

    // Show admin message
    showMessage(message, type = 'info') {
        const resultsContainer = document.getElementById('adminResults');
        if (!resultsContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `result-item result-${type}`;
        messageElement.innerHTML = `
            <i data-feather="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
            <span>${this.escapeHtml(message)}</span>
        `;

        resultsContainer.appendChild(messageElement);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 5000);

        // Refresh Feather icons
        if (window.feather) {
            feather.replace();
        }
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.adminGalleryManager = new AdminGalleryManager();
});

// Export for use in other modules
window.AdminGalleryManager = AdminGalleryManager;
