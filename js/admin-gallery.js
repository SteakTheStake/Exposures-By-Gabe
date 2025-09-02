// Admin Gallery Management for Repository Images
// Handles tagging and metadata editing for images in the /img folder

class AdminGalleryManager {
    constructor() {
        this.galleryManager = null;
        this.currentImage = null;
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
        this.renderImageManagement();
        this.setupTagEditor();
    }

    // Render image management interface
    renderImageManagement() {
        const container = document.getElementById('imageManagementSection');
        if (!container) return;

        const images = this.galleryManager.getAllImages();
        
        container.innerHTML = `
            <h3>Gallery Images</h3>
            <div class="admin-grid">
                ${images.map(img => `
                    <div class="admin-card subtle-bg elegant-shadow">
                        <h4>${this.escapeHtml(img.title)}</h4>
                        <div class="image-preview">
                            <img src="${img.url}" alt="${this.escapeHtml(img.alt)}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                        </div>
                        <div class="image-info">
                            <p><strong>Filename:</strong> ${img.filename}</p>
                            <p><strong>Tags:</strong> ${(img.tags || []).join(', ') || 'None'}</p>
                        </div>
                        <button onclick="window.adminGalleryManager.editImage('${img.filename}')" class="admin-btn">
                            <i data-feather="edit"></i>
                            Edit Image
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

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
                    <input type="text" id="imageCategory" class="admin-input" placeholder="Enter category">
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
            categoryInput.value = image.category || '';
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

        const updates = {
            title: titleInput.value.trim() || this.currentImage.title,
            category: categoryInput.value.trim() || 'uncategorized',
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