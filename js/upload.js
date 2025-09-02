// Upload functionality and gallery management
let uploadedImages = [];
let currentUploadIndex = 0;

// Initialize upload functionality
function initializeUpload() {
    setupDropzone();
    setupFileInput();
    loadExistingImages();
    feather.replace();
}

// Setup drag and drop functionality
function setupDropzone() {
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('fileInput');
    
    if (!dropzone || !fileInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropzone.addEventListener('drop', handleDrop, false);
}

// Prevent default drag behaviors
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight dropzone
function highlight(e) {
    const dropzone = document.getElementById('uploadDropzone');
    dropzone.style.borderColor = '#e8eaed';
    dropzone.style.backgroundColor = '#253447';
}

// Remove highlight from dropzone
function unhighlight(e) {
    const dropzone = document.getElementById('uploadDropzone');
    dropzone.style.borderColor = '#2d3748';
    dropzone.style.backgroundColor = '#1a2332';
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Setup file input functionality
function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// Handle file selection
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// Process selected files
function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
        if (!AuthModule.SecurityUtils.isValidImageType(file)) {
            showUploadError(`${file.name}: Invalid file type. Please upload images only.`);
            return false;
        }
        
        if (!AuthModule.SecurityUtils.isValidFileSize(file)) {
            showUploadError(`${file.name}: File too large. Maximum size is 10MB.`);
            return false;
        }
        
        return true;
    });
    
    if (validFiles.length > 0) {
        uploadFiles(validFiles);
    }
}

// Upload files (simulate upload process)
async function uploadFiles(files) {
    const progressContainer = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultsContainer = document.getElementById('uploadResults');
    
    // Show progress bar
    progressContainer.style.display = 'block';
    resultsContainer.innerHTML = '';
    
    currentUploadIndex = 0;
    const totalFiles = files.length;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        currentUploadIndex = i + 1;
        
        // Update progress
        const progress = ((i + 1) / totalFiles) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Uploading ${currentUploadIndex} of ${totalFiles} files...`;
        
        try {
            await simulateFileUpload(file);
            showUploadResult(file.name, true);
            addImageToGallery(file);
        } catch (error) {
            showUploadResult(file.name, false, error.message);
        }
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Hide progress bar
    setTimeout(() => {
        progressContainer.style.display = 'none';
        updateGalleryManagement();
    }, 1000);
    
    // Clear file input
    document.getElementById('fileInput').value = '';
}

// Simulate file upload process
function simulateFileUpload(file) {
    return new Promise((resolve, reject) => {
        // Simulate random upload success/failure for demo
        const successRate = 0.9; // 90% success rate
        const willSucceed = Math.random() < successRate;
        
        setTimeout(() => {
            if (willSucceed) {
                resolve({ url: URL.createObjectURL(file), filename: file.name });
            } else {
                reject(new Error('Upload failed'));
            }
        }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
    });
}

// Add image to gallery
function addImageToGallery(file) {
    const imageData = {
        id: AuthModule.SecurityUtils.generateFileHash(file),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        size: file.size,
        type: file.type
    };
    
    uploadedImages.push(imageData);
    saveImagesToStorage();
}

// Show upload result
function showUploadResult(filename, success, errorMessage = '') {
    const resultsContainer = document.getElementById('uploadResults');
    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${success ? 'result-success' : 'result-error'}`;
    
    const icon = success ? 'check-circle' : 'x-circle';
    const message = success ? 'Upload successful' : `Upload failed: ${errorMessage}`;
    
    resultItem.innerHTML = `
        <i data-feather="${icon}"></i>
        <div>
            <strong>${AuthModule.SecurityUtils.escapeHtml(filename)}</strong>
            <p>${message}</p>
        </div>
    `;
    
    resultsContainer.appendChild(resultItem);
    feather.replace();
    
    // Auto-remove result after 10 seconds
    setTimeout(() => {
        if (resultItem.parentNode) {
            resultItem.remove();
        }
    }, 10000);
}

// Show upload error
function showUploadError(message) {
    const resultsContainer = document.getElementById('uploadResults');
    const errorItem = document.createElement('div');
    errorItem.className = 'result-item result-error';
    
    errorItem.innerHTML = `
        <i data-feather="alert-circle"></i>
        <div>
            <strong>Error</strong>
            <p>${AuthModule.SecurityUtils.escapeHtml(message)}</p>
        </div>
    `;
    
    resultsContainer.appendChild(errorItem);
    feather.replace();
    
    // Auto-remove error after 8 seconds
    setTimeout(() => {
        if (errorItem.parentNode) {
            errorItem.remove();
        }
    }, 8000);
}

// Update gallery management section
function updateGalleryManagement() {
    const managementGrid = document.getElementById('managementGrid');
    if (!managementGrid) return;
    
    managementGrid.innerHTML = '';
    
    if (uploadedImages.length === 0) {
        managementGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i data-feather="image" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <p>No images uploaded yet</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    uploadedImages.forEach((image, index) => {
        const managementItem = document.createElement('div');
        managementItem.className = 'management-item';
        managementItem.innerHTML = `
            <img src="${image.url}" alt="${AuthModule.SecurityUtils.escapeHtml(image.name)}" loading="lazy">
            <div class="management-controls">
                <button class="control-btn" onclick="previewImage('${image.id}')" title="Preview">
                    <i data-feather="eye"></i>
                </button>
                <button class="control-btn delete" onclick="deleteImage('${image.id}')" title="Delete">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `;
        
        managementGrid.appendChild(managementItem);
    });
    
    feather.replace();
}

// Preview image
function previewImage(imageId) {
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) return;
    
    // Create modal for preview
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <img src="${image.url}" alt="${AuthModule.SecurityUtils.escapeHtml(image.name)}" style="max-width: 100%; max-height: 80vh; object-fit: contain;">
            <div class="modal-info">
                <h3>${AuthModule.SecurityUtils.escapeHtml(image.name)}</h3>
                <p>Uploaded: ${new Date(image.uploadDate).toLocaleDateString()}</p>
                <p>Size: ${formatFileSize(image.size)}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close modal functionality
    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = 'auto';
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Delete image
function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return;
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(uploadedImages[imageIndex].url);
    
    // Remove from array
    uploadedImages.splice(imageIndex, 1);
    
    // Update storage
    saveImagesToStorage();
    
    // Update UI
    updateGalleryManagement();
    
    // Show success message
    showUploadResult('Image deleted successfully', true);
}

// Save images to localStorage
function saveImagesToStorage() {
    try {
        // Store only metadata, not the actual file data
        const imageMetadata = uploadedImages.map(img => ({
            id: img.id,
            name: img.name,
            uploadDate: img.uploadDate,
            size: img.size,
            type: img.type
            // Note: URL is not saved as it's a blob URL that expires
        }));
        
        localStorage.setItem('portfolioImages', JSON.stringify(imageMetadata));
    } catch (error) {
        console.error('Error saving images to storage:', error);
    }
}

// Load existing images from localStorage
function loadExistingImages() {
    try {
        const storedImages = localStorage.getItem('portfolioImages');
        if (storedImages) {
            const imageMetadata = JSON.parse(storedImages);
            // Note: We can only load metadata, not actual images since blob URLs expire
            // In a real application, these would be permanent URLs
            uploadedImages = [];
        }
    } catch (error) {
        console.error('Error loading images from storage:', error);
        uploadedImages = [];
    }
    
    updateGalleryManagement();
}

// Clear upload session
function clearUploadSession() {
    // Revoke all object URLs to free memory
    uploadedImages.forEach(image => {
        if (image.url && image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
        }
    });
    
    uploadedImages = [];
    localStorage.removeItem('portfolioImages');
    updateGalleryManagement();
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validate image before processing
function validateImage(file) {
    const errors = [];
    
    if (!AuthModule.SecurityUtils.isValidImageType(file)) {
        errors.push('Invalid file type. Only images are allowed.');
    }
    
    if (!AuthModule.SecurityUtils.isValidFileSize(file)) {
        errors.push('File too large. Maximum size is 10MB.');
    }
    
    return errors;
}

// Bulk operations
function deleteAllImages() {
    if (!confirm('Are you sure you want to delete all uploaded images? This action cannot be undone.')) {
        return;
    }
    
    clearUploadSession();
    showUploadResult('All images deleted successfully', true);
}

// Export functionality for debugging
window.UploadModule = {
    uploadedImages,
    clearUploadSession,
    deleteAllImages,
    updateGalleryManagement
};

// Initialize upload when auth is ready
document.addEventListener('DOMContentLoaded', function() {
    // This will be called by auth.js when authentication is successful
    window.initializeUpload = initializeUpload;
});
