// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let petServices = [];
let editingServiceId = null;

// DOM elements
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');
const serviceModal = document.getElementById('service-modal');
const serviceForm = document.getElementById('service-form');
const servicesGrid = document.getElementById('services-grid');
const noServicesDiv = document.getElementById('no-services');

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadPetServices();
        updateStats();
        setupEventListeners();
        
        // Show main content with animation
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
                mainContent.style.opacity = '1';
            }, 500);
        }, 1000);
    } catch (error) {
        console.error('Error initializing page:', error);
        showNotification('Error loading data', 'error');
    }
});

// Load pet services
async function loadPetServices() {
    try {
        const { data, error } = await supabase
            .from('pet_services')
            .select('*')
            .order('name');

        if (error) throw error;

        petServices = data || [];
        displayPetServices(petServices);
    } catch (error) {
        console.error('Error loading pet services:', error);
        showNotification('Error loading pet services', 'error');
    }
}

// Display pet services in grid
function displayPetServices(services) {
    if (services.length === 0) {
        servicesGrid.innerHTML = '';
        noServicesDiv.classList.remove('hidden');
        return;
    }

    noServicesDiv.classList.add('hidden');
    
    servicesGrid.innerHTML = services.map(service => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-r ${getCategoryGradient(service.category)} flex items-center justify-center text-white text-xl">
                            ${getCategoryIcon(service.category)}
                        </div>
                        <div>
                            <h3 class="font-semibold text-lg text-gray-800">${service.name}</h3>
                            <p class="text-sm text-gray-500 capitalize">${service.category}</p>
                        </div>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}">
                        ${service.status === 'active' ? '✅' : '⏸️'} ${service.status}
                    </span>
                </div>
                
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${service.description || 'No description available'}</p>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Price</p>
                        <p class="text-lg font-bold text-green-600">$${service.price}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Duration</p>
                        <p class="text-sm font-medium text-gray-800">${service.duration ? service.duration + ' min' : 'Flexible'}</p>
                    </div>
                </div>
                
                ${service.service_provider ? `
                    <div class="mb-4">
                        <p class="text-xs text-gray-500 mb-1">Provider</p>
                        <p class="text-sm text-gray-800">${service.service_provider}</p>
                    </div>
                ` : ''}
                
                <div class="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div class="flex space-x-2">
                        <button onclick="editService('${service.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                            Edit
                        </button>
                        <button onclick="duplicateService('${service.id}')" class="text-green-600 hover:text-green-800 text-sm font-medium transition-colors">
                            Duplicate
                        </button>
                        <button onclick="deleteService('${service.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium transition-colors">
                            Delete
                        </button>
                    </div>
                    <button onclick="toggleServiceStatus('${service.id}')" class="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors">
                        ${service.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Get category gradient
function getCategoryGradient(category) {
    const gradients = {
        grooming: 'from-blue-400 to-blue-600',
        veterinary: 'from-red-400 to-red-600',
        boarding: 'from-green-400 to-green-600',
        training: 'from-purple-400 to-purple-600',
        daycare: 'from-yellow-400 to-yellow-600',
        other: 'from-gray-400 to-gray-600'
    };
    return gradients[category] || gradients.other;
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        grooming: '🛁',
        veterinary: '🏥',
        boarding: '🏠',
        training: '🎓',
        daycare: '🎪',
        other: '🐾'
    };
    return icons[category] || icons.other;
}

// Get status color
function getStatusColor(status) {
    return status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800';
}

// Update statistics
function updateStats() {
    const totalServices = petServices.length;
    const activeServices = petServices.filter(s => s.status === 'active').length;
    const categories = [...new Set(petServices.map(s => s.category))].length;
    const avgPrice = petServices.length > 0 
        ? petServices.reduce((sum, s) => sum + parseFloat(s.price), 0) / petServices.length 
        : 0;

    document.getElementById('total-services').textContent = totalServices;
    document.getElementById('active-services').textContent = activeServices;
    document.getElementById('service-categories').textContent = categories;
    document.getElementById('average-price').textContent = `$${avgPrice.toFixed(2)}`;
}

// Setup event listeners
function setupEventListeners() {
    // Add service button
    document.getElementById('add-service-btn').addEventListener('click', () => {
        editingServiceId = null;
        document.getElementById('modal-title').textContent = 'Add Pet Service';
        serviceForm.reset();
        document.getElementById('service-status').value = 'active';
        serviceModal.classList.remove('hidden');
    });

    // Cancel button
    document.getElementById('cancel-service-btn').addEventListener('click', () => {
        serviceModal.classList.add('hidden');
    });

    // Form submission
    serviceForm.addEventListener('submit', handleFormSubmit);

    // Search and filter functionality
    document.getElementById('search-input').addEventListener('input', filterServices);
    document.getElementById('category-filter').addEventListener('change', filterServices);
    document.getElementById('status-filter').addEventListener('change', filterServices);
    document.getElementById('price-filter').addEventListener('change', filterServices);

    // Close modal on outside click
    serviceModal.addEventListener('click', (e) => {
        if (e.target === serviceModal) {
            serviceModal.classList.add('hidden');
        }
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth < 1024) {
        menuToggle.classList.remove('hidden');
    }

    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('service-name').value,
        category: document.getElementById('service-category').value,
        price: parseFloat(document.getElementById('service-price').value),
        duration: parseInt(document.getElementById('service-duration').value) || null,
        description: document.getElementById('service-description').value,
        status: document.getElementById('service-status').value,
        service_provider: document.getElementById('service-provider').value,
        requirements: document.getElementById('service-requirements').value
    };

    try {
        let result;
        if (editingServiceId) {
            result = await supabase
                .from('pet_services')
                .update(formData)
                .eq('id', editingServiceId);
        } else {
            result = await supabase
                .from('pet_services')
                .insert([formData]);
        }

        if (result.error) throw result.error;

        showNotification(
            editingServiceId ? 'Service updated successfully!' : 'Service added successfully!',
            'success'
        );

        serviceModal.classList.add('hidden');
        await loadPetServices();
        updateStats();
    } catch (error) {
        console.error('Error saving service:', error);
        showNotification('Error saving service', 'error');
    }
}

// Edit service
function editService(serviceId) {
    const service = petServices.find(s => s.id === serviceId);
    if (!service) return;

    editingServiceId = serviceId;
    document.getElementById('modal-title').textContent = 'Edit Pet Service';
    
    // Populate form fields
    document.getElementById('service-name').value = service.name || '';
    document.getElementById('service-category').value = service.category || '';
    document.getElementById('service-price').value = service.price || '';
    document.getElementById('service-duration').value = service.duration || '';
    document.getElementById('service-description').value = service.description || '';
    document.getElementById('service-status').value = service.status || 'active';
    document.getElementById('service-provider').value = service.service_provider || '';
    document.getElementById('service-requirements').value = service.requirements || '';

    serviceModal.classList.remove('hidden');
}

// Duplicate service
function duplicateService(serviceId) {
    const service = petServices.find(s => s.id === serviceId);
    if (!service) return;

    editingServiceId = null;
    document.getElementById('modal-title').textContent = 'Duplicate Pet Service';
    
    // Populate form fields with service data
    document.getElementById('service-name').value = service.name + ' (Copy)';
    document.getElementById('service-category').value = service.category || '';
    document.getElementById('service-price').value = service.price || '';
    document.getElementById('service-duration').value = service.duration || '';
    document.getElementById('service-description').value = service.description || '';
    document.getElementById('service-status').value = 'active';
    document.getElementById('service-provider').value = service.service_provider || '';
    document.getElementById('service-requirements').value = service.requirements || '';

    serviceModal.classList.remove('hidden');
}

// Delete service
async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('pet_services')
            .delete()
            .eq('id', serviceId);

        if (error) throw error;

        showNotification('Service deleted successfully!', 'success');
        await loadPetServices();
        updateStats();
    } catch (error) {
        console.error('Error deleting service:', error);
        showNotification('Error deleting service', 'error');
    }
}

// Toggle service status
async function toggleServiceStatus(serviceId) {
    const service = petServices.find(s => s.id === serviceId);
    if (!service) return;

    const newStatus = service.status === 'active' ? 'inactive' : 'active';

    try {
        const { error } = await supabase
            .from('pet_services')
            .update({ status: newStatus })
            .eq('id', serviceId);

        if (error) throw error;

        showNotification(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
        await loadPetServices();
        updateStats();
    } catch (error) {
        console.error('Error updating service status:', error);
        showNotification('Error updating service status', 'error');
    }
}

// Filter services
function filterServices() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const priceFilter = document.getElementById('price-filter').value;

    let filteredServices = petServices.filter(service => {
        const matchesSearch = !searchTerm || 
            service.name.toLowerCase().includes(searchTerm) ||
            service.description?.toLowerCase().includes(searchTerm) ||
            service.service_provider?.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || service.category === categoryFilter;
        const matchesStatus = !statusFilter || service.status === statusFilter;
        
        let matchesPrice = true;
        if (priceFilter) {
            const price = parseFloat(service.price);
            switch (priceFilter) {
                case '0-25':
                    matchesPrice = price >= 0 && price <= 25;
                    break;
                case '25-50':
                    matchesPrice = price > 25 && price <= 50;
                    break;
                case '50-100':
                    matchesPrice = price > 50 && price <= 100;
                    break;
                case '100+':
                    matchesPrice = price > 100;
                    break;
            }
        }

        return matchesSearch && matchesCategory && matchesStatus && matchesPrice;
    });

    displayPetServices(filteredServices);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
