// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let healthRecords = [];
let pets = [];
let editingRecordId = null;

// DOM elements
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');
const recordModal = document.getElementById('record-modal');
const recordForm = document.getElementById('record-form');
const recordsTableBody = document.getElementById('records-table-body');
const noRecordsDiv = document.getElementById('no-records');

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadPets();
        await loadHealthRecords();
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

// Load pets for dropdowns
async function loadPets() {
    try {
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .order('name');

        if (error) throw error;

        pets = data || [];
        populatePetDropdowns();
    } catch (error) {
        console.error('Error loading pets:', error);
        showNotification('Error loading pets', 'error');
    }
}

// Populate pet dropdowns
function populatePetDropdowns() {
    const recordPetSelect = document.getElementById('record-pet-id');
    const petFilterSelect = document.getElementById('pet-filter');
    
    // Clear existing options (except first one)
    recordPetSelect.innerHTML = '<option value="">Select Pet</option>';
    petFilterSelect.innerHTML = '<option value="">All Pets</option>';
    
    pets.forEach(pet => {
        const option1 = new Option(`${pet.name} (${pet.species})`, pet.id);
        const option2 = new Option(`${pet.name} (${pet.species})`, pet.id);
        recordPetSelect.appendChild(option1);
        petFilterSelect.appendChild(option2);
    });
}

// Load health records
async function loadHealthRecords() {
    try {
        const { data, error } = await supabase
            .from('health_records')
            .select(`
                *,
                pets (
                    id,
                    name,
                    species,
                    breed,
                    owner_name
                )
            `)
            .order('record_date', { ascending: false });

        if (error) throw error;

        healthRecords = data || [];
        displayHealthRecords(healthRecords);
    } catch (error) {
        console.error('Error loading health records:', error);
        showNotification('Error loading health records', 'error');
    }
}

// Display health records in table
function displayHealthRecords(records) {
    if (records.length === 0) {
        recordsTableBody.innerHTML = '';
        noRecordsDiv.classList.remove('hidden');
        return;
    }

    noRecordsDiv.classList.add('hidden');
    
    recordsTableBody.innerHTML = records.map(record => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            ${record.pets?.name ? record.pets.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${record.pets?.name || 'Unknown Pet'}</div>
                        <div class="text-sm text-gray-500">${record.pets?.species || ''} - ${record.pets?.breed || ''}</div>
                        <div class="text-xs text-gray-400">Owner: ${record.pets?.owner_name || 'Unknown'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRecordTypeColor(record.record_type)}">
                    ${getRecordTypeIcon(record.record_type)} ${record.record_type ? record.record_type.charAt(0).toUpperCase() + record.record_type.slice(1) : 'Unknown'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${formatDate(record.record_date)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${record.veterinarian || '-'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                ${record.diagnosis || record.notes || '-'}
            </td>
            <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button onclick="viewRecord('${record.id}')" class="text-blue-600 hover:text-blue-900 transition-colors">View</button>
                <button onclick="editRecord('${record.id}')" class="text-indigo-600 hover:text-indigo-900 transition-colors">Edit</button>
                <button onclick="deleteRecord('${record.id}')" class="text-red-600 hover:text-red-900 transition-colors">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Get record type color classes
function getRecordTypeColor(type) {
    const colors = {
        vaccination: 'bg-green-100 text-green-800',
        treatment: 'bg-orange-100 text-orange-800',
        checkup: 'bg-blue-100 text-blue-800',
        surgery: 'bg-red-100 text-red-800',
        emergency: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
}

// Get record type icon
function getRecordTypeIcon(type) {
    const icons = {
        vaccination: '💉',
        treatment: '🏥',
        checkup: '🔍',
        surgery: '🔪',
        emergency: '🚨'
    };
    return icons[type] || '📋';
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Update statistics
function updateStats() {
    const totalRecords = healthRecords.length;
    const vaccinations = healthRecords.filter(r => r.record_type === 'vaccination').length;
    const treatments = healthRecords.filter(r => r.record_type === 'treatment').length;
    const checkups = healthRecords.filter(r => r.record_type === 'checkup').length;

    document.getElementById('total-records').textContent = totalRecords;
    document.getElementById('total-vaccinations').textContent = vaccinations;
    document.getElementById('total-treatments').textContent = treatments;
    document.getElementById('total-checkups').textContent = checkups;
}

// Setup event listeners
function setupEventListeners() {
    // Add record button
    document.getElementById('add-record-btn').addEventListener('click', () => {
        editingRecordId = null;
        document.getElementById('modal-title').textContent = 'Add Health Record';
        recordForm.reset();
        recordModal.classList.remove('hidden');
    });

    // Cancel button
    document.getElementById('cancel-record-btn').addEventListener('click', () => {
        recordModal.classList.add('hidden');
    });

    // Form submission
    recordForm.addEventListener('submit', handleFormSubmit);

    // Search functionality
    document.getElementById('search-input').addEventListener('input', filterRecords);
    document.getElementById('type-filter').addEventListener('change', filterRecords);
    document.getElementById('pet-filter').addEventListener('change', filterRecords);
    document.getElementById('date-filter').addEventListener('change', filterRecords);

    // Close modal on outside click
    recordModal.addEventListener('click', (e) => {
        if (e.target === recordModal) {
            recordModal.classList.add('hidden');
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
        pet_id: document.getElementById('record-pet-id').value,
        record_type: document.getElementById('record-type').value,
        record_date: document.getElementById('record-date').value,
        veterinarian: document.getElementById('record-veterinarian').value,
        weight: parseFloat(document.getElementById('record-weight').value) || null,
        temperature: parseFloat(document.getElementById('record-temperature').value) || null,
        diagnosis: document.getElementById('record-diagnosis').value,
        medications: document.getElementById('record-medications').value,
        notes: document.getElementById('record-notes').value,
        next_appointment: document.getElementById('record-next-appointment').value || null
    };

    try {
        let result;
        if (editingRecordId) {
            result = await supabase
                .from('health_records')
                .update(formData)
                .eq('id', editingRecordId);
        } else {
            result = await supabase
                .from('health_records')
                .insert([formData]);
        }

        if (result.error) throw result.error;

        showNotification(
            editingRecordId ? 'Health record updated successfully!' : 'Health record added successfully!',
            'success'
        );

        recordModal.classList.add('hidden');
        await loadHealthRecords();
        updateStats();
    } catch (error) {
        console.error('Error saving health record:', error);
        showNotification('Error saving health record', 'error');
    }
}

// View record details
function viewRecord(recordId) {
    const record = healthRecords.find(r => r.id === recordId);
    if (!record) return;

    const details = `
        <div class="space-y-4">
            <h4 class="font-semibold text-lg">Health Record Details</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Pet:</strong> ${record.pets?.name || 'Unknown'}</div>
                <div><strong>Type:</strong> ${record.record_type}</div>
                <div><strong>Date:</strong> ${formatDate(record.record_date)}</div>
                <div><strong>Veterinarian:</strong> ${record.veterinarian || '-'}</div>
                <div><strong>Weight:</strong> ${record.weight ? record.weight + ' kg' : '-'}</div>
                <div><strong>Temperature:</strong> ${record.temperature ? record.temperature + ' °C' : '-'}</div>
                <div class="col-span-2"><strong>Diagnosis:</strong> ${record.diagnosis || '-'}</div>
                <div class="col-span-2"><strong>Medications:</strong> ${record.medications || '-'}</div>
                <div class="col-span-2"><strong>Notes:</strong> ${record.notes || '-'}</div>
                <div class="col-span-2"><strong>Next Appointment:</strong> ${record.next_appointment ? formatDate(record.next_appointment) : '-'}</div>
            </div>
        </div>
    `;

    showModal('Health Record Details', details);
}

// Edit record
function editRecord(recordId) {
    const record = healthRecords.find(r => r.id === recordId);
    if (!record) return;

    editingRecordId = recordId;
    document.getElementById('modal-title').textContent = 'Edit Health Record';
    
    // Populate form fields
    document.getElementById('record-pet-id').value = record.pet_id || '';
    document.getElementById('record-type').value = record.record_type || '';
    document.getElementById('record-date').value = record.record_date || '';
    document.getElementById('record-veterinarian').value = record.veterinarian || '';
    document.getElementById('record-weight').value = record.weight || '';
    document.getElementById('record-temperature').value = record.temperature || '';
    document.getElementById('record-diagnosis').value = record.diagnosis || '';
    document.getElementById('record-medications').value = record.medications || '';
    document.getElementById('record-notes').value = record.notes || '';
    document.getElementById('record-next-appointment').value = record.next_appointment || '';

    recordModal.classList.remove('hidden');
}

// Delete record
async function deleteRecord(recordId) {
    if (!confirm('Are you sure you want to delete this health record? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('health_records')
            .delete()
            .eq('id', recordId);

        if (error) throw error;

        showNotification('Health record deleted successfully!', 'success');
        await loadHealthRecords();
        updateStats();
    } catch (error) {
        console.error('Error deleting health record:', error);
        showNotification('Error deleting health record', 'error');
    }
}

// Filter records
function filterRecords() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    const petFilter = document.getElementById('pet-filter').value;
    const dateFilter = document.getElementById('date-filter').value;

    let filteredRecords = healthRecords.filter(record => {
        const matchesSearch = !searchTerm || 
            record.pets?.name?.toLowerCase().includes(searchTerm) ||
            record.pets?.owner_name?.toLowerCase().includes(searchTerm) ||
            record.record_type?.toLowerCase().includes(searchTerm) ||
            record.diagnosis?.toLowerCase().includes(searchTerm) ||
            record.notes?.toLowerCase().includes(searchTerm);

        const matchesType = !typeFilter || record.record_type === typeFilter;
        const matchesPet = !petFilter || record.pet_id === petFilter;
        const matchesDate = !dateFilter || record.record_date === dateFilter;

        return matchesSearch && matchesType && matchesPet && matchesDate;
    });

    displayHealthRecords(filteredRecords);
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

// Show modal
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <h3 class="text-xl font-bold text-gray-800">${title}</h3>
            </div>
            <div class="p-6">
                ${content}
            </div>
            <div class="p-6 border-t border-gray-200 flex justify-end">
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}
