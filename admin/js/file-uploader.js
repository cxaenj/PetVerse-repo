// PetVerse File Upload Component
// This module handles file uploads to Supabase Storage

class PetVerseFileUploader {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.maxFileSizes = {
            'pet-photos': 5 * 1024 * 1024, // 5MB
            'medical-records': 10 * 1024 * 1024, // 10MB
            'product-images': 3 * 1024 * 1024, // 3MB
            'user-avatars': 2 * 1024 * 1024, // 2MB
            'documents': 20 * 1024 * 1024 // 20MB
        };
        
        this.allowedTypes = {
            'pet-photos': ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            'medical-records': ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
            'product-images': ['image/jpeg', 'image/png', 'image/webp'],
            'user-avatars': ['image/jpeg', 'image/png', 'image/webp'],
            'documents': ['application/pdf', 'text/plain', 'application/msword']
        };

        this.init();
    }

    init() {
        this.createUploadModal();
        this.setupEventListeners();
    }

    createUploadModal() {
        const modalHTML = `
            <div id="uploadModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div class="modal-content bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="modal-header p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                                <span class="text-3xl mr-3">📁</span>
                                Upload Files
                            </h2>
                            <button id="closeUploadModal" class="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>
                    </div>
                    
                    <div class="modal-body p-6">
                        <!-- Upload Type Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">Upload Type</label>
                            <select id="uploadType" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Select upload type...</option>
                                <option value="pet-photos">🐾 Pet Photos</option>
                                <option value="medical-records">🏥 Medical Records</option>
                                <option value="product-images">📦 Product Images</option>
                                <option value="user-avatars">👤 User Avatars</option>
                                <option value="documents">📄 Documents</option>
                            </select>
                        </div>

                        <!-- Entity Selection (for pet/product specific uploads) -->
                        <div id="entitySelection" class="mb-6 hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-3">Select Pet/Product</label>
                            <select id="entityId" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <option value="">Loading...</option>
                            </select>
                        </div>

                        <!-- File Upload Area -->
                        <div id="uploadArea" class="mb-6">
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                                <input type="file" id="fileInput" multiple class="hidden" accept="*/*">
                                <div class="upload-placeholder">
                                    <span class="text-6xl mb-4 block">📁</span>
                                    <p class="text-lg font-medium text-gray-700 mb-2">Drag & drop files here</p>
                                    <p class="text-gray-500 mb-4">or</p>
                                    <button type="button" id="browseFiles" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                                        Browse Files
                                    </button>
                                    <p class="text-sm text-gray-400 mt-4">
                                        <span id="fileTypeInfo">Select upload type to see file requirements</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- File Preview Area -->
                        <div id="filePreview" class="mb-6 hidden">
                            <h3 class="text-lg font-medium text-gray-700 mb-3">Selected Files</h3>
                            <div id="fileList" class="space-y-2"></div>
                        </div>

                        <!-- Progress Area -->
                        <div id="uploadProgress" class="mb-6 hidden">
                            <h3 class="text-lg font-medium text-gray-700 mb-3">Upload Progress</h3>
                            <div class="space-y-2" id="progressList"></div>
                        </div>

                        <!-- Upload Results -->
                        <div id="uploadResults" class="mb-6 hidden">
                            <h3 class="text-lg font-medium text-gray-700 mb-3">Upload Results</h3>
                            <div id="resultsList" class="space-y-2"></div>
                        </div>
                    </div>
                    
                    <div class="modal-footer p-6 border-t border-gray-200 flex justify-end space-x-3">
                        <button id="cancelUpload" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button id="startUpload" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                            Upload Files
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('closeUploadModal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelUpload').addEventListener('click', () => this.hideModal());
        
        // Upload type change
        document.getElementById('uploadType').addEventListener('change', (e) => this.handleUploadTypeChange(e.target.value));
        
        // File input
        document.getElementById('browseFiles').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileSelection(e.target.files));
        
        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Start upload
        document.getElementById('startUpload').addEventListener('click', () => this.startUpload());
    }

    async handleUploadTypeChange(uploadType) {
        const entitySelection = document.getElementById('entitySelection');
        const fileInput = document.getElementById('fileInput');
        const fileTypeInfo = document.getElementById('fileTypeInfo');
        
        if (uploadType === 'pet-photos' || uploadType === 'medical-records') {
            entitySelection.classList.remove('hidden');
            await this.loadPets();
        } else if (uploadType === 'product-images') {
            entitySelection.classList.remove('hidden');
            await this.loadProducts();
        } else {
            entitySelection.classList.add('hidden');
        }

        // Update file input accept attribute and info
        if (uploadType && this.allowedTypes[uploadType]) {
            fileInput.accept = this.allowedTypes[uploadType].join(',');
            const maxSize = (this.maxFileSizes[uploadType] / 1024 / 1024).toFixed(1);
            fileTypeInfo.textContent = `Accepted: ${this.allowedTypes[uploadType].join(', ')} | Max size: ${maxSize}MB`;
        } else {
            fileInput.accept = '*/*';
            fileTypeInfo.textContent = 'Select upload type to see file requirements';
        }

        this.updateUploadButton();
    }

    async loadPets() {
        try {
            const { data: pets, error } = await this.supabase
                .from('pets')
                .select('id, name, species')
                .order('name');

            const entitySelect = document.getElementById('entityId');
            entitySelect.innerHTML = '<option value="">Select a pet...</option>';
            
            if (pets) {
                pets.forEach(pet => {
                    entitySelect.innerHTML += `<option value="${pet.id}">${pet.name} (${pet.species})</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading pets:', error);
        }
    }

    async loadProducts() {
        try {
            const { data: products, error } = await this.supabase
                .from('products')
                .select('id, name')
                .eq('is_active', true)
                .order('name');

            const entitySelect = document.getElementById('entityId');
            entitySelect.innerHTML = '<option value="">Select a product...</option>';
            
            if (products) {
                products.forEach(product => {
                    entitySelect.innerHTML += `<option value="${product.id}">${product.name}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    handleFileSelection(files) {
        this.selectedFiles = Array.from(files);
        this.displayFilePreview();
        this.updateUploadButton();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFileSelection(files);
    }

    displayFilePreview() {
        const filePreview = document.getElementById('filePreview');
        const fileList = document.getElementById('fileList');
        
        if (this.selectedFiles.length === 0) {
            filePreview.classList.add('hidden');
            return;
        }

        filePreview.classList.remove('hidden');
        fileList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            const isValid = this.validateFile(file);
            
            fileItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${this.getFileIcon(file.type)}</span>
                    <div>
                        <p class="font-medium text-gray-800">${file.name}</p>
                        <p class="text-sm text-gray-500">${fileSize} MB • ${file.type}</p>
                        ${!isValid.valid ? `<p class="text-sm text-red-500">${isValid.message}</p>` : ''}
                    </div>
                </div>
                <button onclick="window.fileUploader.removeFile(${index})" class="text-red-500 hover:text-red-700">
                    <span class="text-xl">×</span>
                </button>
            `;
            
            if (!isValid.valid) {
                fileItem.classList.add('border-red-200', 'bg-red-50');
            }
            
            fileList.appendChild(fileItem);
        });
    }

    validateFile(file) {
        const uploadType = document.getElementById('uploadType').value;
        
        if (!uploadType) {
            return { valid: false, message: 'Please select upload type first' };
        }

        // Check file size
        if (file.size > this.maxFileSizes[uploadType]) {
            const maxSize = (this.maxFileSizes[uploadType] / 1024 / 1024).toFixed(1);
            return { valid: false, message: `File too large. Max size: ${maxSize}MB` };
        }

        // Check file type
        if (!this.allowedTypes[uploadType].includes(file.type)) {
            return { valid: false, message: `File type not allowed` };
        }

        return { valid: true };
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displayFilePreview();
        this.updateUploadButton();
    }

    updateUploadButton() {
        const uploadButton = document.getElementById('startUpload');
        const uploadType = document.getElementById('uploadType').value;
        const hasFiles = this.selectedFiles && this.selectedFiles.length > 0;
        const needsEntity = ['pet-photos', 'medical-records', 'product-images'].includes(uploadType);
        const hasEntity = !needsEntity || document.getElementById('entityId').value;
        
        uploadButton.disabled = !uploadType || !hasFiles || !hasEntity;
    }

    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType === 'application/pdf') return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('text')) return '📄';
        return '📁';
    }

    async startUpload() {
        const uploadType = document.getElementById('uploadType').value;
        const entityId = document.getElementById('entityId').value;
        
        document.getElementById('uploadProgress').classList.remove('hidden');
        document.getElementById('startUpload').disabled = true;
        
        const results = [];
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            const result = await this.uploadFile(file, uploadType, entityId, i);
            results.push(result);
        }
        
        this.displayResults(results);
        document.getElementById('startUpload').disabled = false;
    }

    async uploadFile(file, uploadType, entityId, index) {
        const progressItem = this.createProgressItem(file.name, index);
        
        try {
            // Generate file path
            let filePath = '';
            if (uploadType === 'pet-photos') {
                filePath = `pets/${entityId}/photos`;
            } else if (uploadType === 'medical-records') {
                filePath = `pets/${entityId}/medical`;
            } else if (uploadType === 'product-images') {
                filePath = `products/${entityId}`;
            } else if (uploadType === 'user-avatars') {
                // For demo, using a fixed user ID - in production, use authenticated user ID
                filePath = `users/current-user`;
            } else {
                filePath = 'general';
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const extension = file.name.split('.').pop();
            const filename = `${timestamp}_${randomString}.${extension}`;
            const fullPath = `${filePath}/${filename}`;

            // Upload file
            const { data, error } = await this.supabase.storage
                .from(uploadType)
                .upload(fullPath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                this.updateProgressItem(index, 'error', error.message);
                return { success: false, file: file.name, error: error.message };
            }

            // Get public URL for public buckets
            let publicUrl = null;
            if (uploadType === 'product-images') {
                const { data: urlData } = this.supabase.storage
                    .from(uploadType)
                    .getPublicUrl(fullPath);
                publicUrl = urlData.publicUrl;
            }

            this.updateProgressItem(index, 'success', 'Upload completed');
            
            return { 
                success: true, 
                file: file.name, 
                path: fullPath, 
                publicUrl 
            };

        } catch (error) {
            this.updateProgressItem(index, 'error', error.message);
            return { success: false, file: file.name, error: error.message };
        }
    }

    createProgressItem(fileName, index) {
        const progressList = document.getElementById('progressList');
        const progressItem = document.createElement('div');
        progressItem.id = `progress-${index}`;
        progressItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        progressItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-6 h-6 rounded-full bg-blue-500 animate-spin flex-shrink-0">
                    <div class="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
                </div>
                <span class="font-medium">${fileName}</span>
            </div>
            <span class="text-sm text-gray-500">Uploading...</span>
        `;
        progressList.appendChild(progressItem);
        return progressItem;
    }

    updateProgressItem(index, status, message) {
        const progressItem = document.getElementById(`progress-${index}`);
        const icon = progressItem.querySelector('div div');
        const statusText = progressItem.querySelector('span:last-child');
        
        if (status === 'success') {
            icon.className = 'w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm';
            icon.innerHTML = '✓';
            statusText.textContent = message;
            statusText.className = 'text-sm text-green-600';
        } else if (status === 'error') {
            icon.className = 'w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-sm';
            icon.innerHTML = '✗';
            statusText.textContent = message;
            statusText.className = 'text-sm text-red-600';
        }
    }

    displayResults(results) {
        const uploadResults = document.getElementById('uploadResults');
        const resultsList = document.getElementById('resultsList');
        
        uploadResults.classList.remove('hidden');
        resultsList.innerHTML = '';
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        // Summary
        const summary = document.createElement('div');
        summary.className = 'p-4 rounded-lg mb-4 ' + (successCount === totalCount ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200');
        summary.innerHTML = `
            <p class="font-medium ${successCount === totalCount ? 'text-green-800' : 'text-yellow-800'}">
                Upload completed: ${successCount}/${totalCount} files successful
            </p>
        `;
        resultsList.appendChild(summary);
        
        // Individual results
        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = `p-3 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`;
            resultItem.innerHTML = `
                <div class="flex items-start justify-between">
                    <div>
                        <p class="font-medium ${result.success ? 'text-green-800' : 'text-red-800'}">${result.file}</p>
                        ${result.success ? 
                            `<p class="text-sm text-green-600">Uploaded to: ${result.path}</p>` :
                            `<p class="text-sm text-red-600">Error: ${result.error}</p>`
                        }
                        ${result.publicUrl ? `<p class="text-sm text-blue-600">Public URL: <a href="${result.publicUrl}" target="_blank" class="underline">${result.publicUrl}</a></p>` : ''}
                    </div>
                    <span class="text-lg">${result.success ? '✅' : '❌'}</span>
                </div>
            `;
            resultsList.appendChild(resultItem);
        });
    }

    showModal() {
        document.getElementById('uploadModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        document.getElementById('uploadModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        this.resetModal();
    }

    resetModal() {
        document.getElementById('uploadType').value = '';
        document.getElementById('entitySelection').classList.add('hidden');
        document.getElementById('fileInput').value = '';
        document.getElementById('filePreview').classList.add('hidden');
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadResults').classList.add('hidden');
        this.selectedFiles = [];
        this.updateUploadButton();
    }
}

// Initialize file uploader when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.supabase !== 'undefined' && window.supabaseClient) {
        window.fileUploader = new PetVerseFileUploader(window.supabaseClient);
        
        // Add upload button to admin dashboard
        const uploadButton = document.createElement('button');
        uploadButton.innerHTML = '📁 Upload Files';
        uploadButton.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-40';
        uploadButton.addEventListener('click', () => window.fileUploader.showModal());
        document.body.appendChild(uploadButton);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PetVerseFileUploader;
}
