// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let serviceBookings = [];
let pets = [];
let petServices = [];
let editingBookingId = null;

// DOM elements
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');
const bookingModal = document.getElementById('booking-modal');
const bookingForm = document.getElementById('booking-form');
const bookingsTableBody = document.getElementById('bookings-table-body');
const noBookingsDiv = document.getElementById('no-bookings');

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await Promise.all([
            loadPets(),
            loadPetServices(),
            loadServiceBookings()
        ]);
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
        populatePetDropdown();
    } catch (error) {
        console.error('Error loading pets:', error);
        showNotification('Error loading pets', 'error');
    }
}

// Load pet services for dropdowns
async function loadPetServices() {
    try {
        const { data, error } = await supabase
            .from('pet_services')
            .select('*')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        petServices = data || [];
        populateServiceDropdowns();
    } catch (error) {
        console.error('Error loading pet services:', error);
        showNotification('Error loading pet services', 'error');
    }
}

// Populate pet dropdown
function populatePetDropdown() {
    const petSelect = document.getElementById('booking-pet-id');
    petSelect.innerHTML = '<option value="">Select Pet</option>';
    
    pets.forEach(pet => {
        const option = new Option(`${pet.name} (${pet.species}) - Owner: ${pet.owner_name}`, pet.id);
        petSelect.appendChild(option);
    });
}

// Populate service dropdowns
function populateServiceDropdowns() {
    const serviceSelect = document.getElementById('booking-service-id');
    const serviceFilter = document.getElementById('service-filter');
    
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    serviceFilter.innerHTML = '<option value="">All Services</option>';
    
    petServices.forEach(service => {
        const option1 = new Option(`${service.name} - $${service.price}`, service.id);
        const option2 = new Option(service.name, service.id);
        serviceSelect.appendChild(option1);
        serviceFilter.appendChild(option2);
    });
}

// Load service bookings
async function loadServiceBookings() {
    try {
        const { data, error } = await supabase
            .from('service_bookings')
            .select(`
                *,
                pets (
                    id,
                    name,
                    species,
                    breed,
                    owner_name,
                    owner_phone,
                    owner_email
                ),
                pet_services (
                    id,
                    name,
                    category,
                    price,
                    duration
                )
            `)
            .order('booking_date', { ascending: false });

        if (error) throw error;

        serviceBookings = data || [];
        displayServiceBookings(serviceBookings);
    } catch (error) {
        console.error('Error loading service bookings:', error);
        showNotification('Error loading service bookings', 'error');
    }
}

// Display service bookings in table
function displayServiceBookings(bookings) {
    if (bookings.length === 0) {
        bookingsTableBody.innerHTML = '';
        noBookingsDiv.classList.remove('hidden');
        return;
    }

    noBookingsDiv.classList.add('hidden');
    
    bookingsTableBody.innerHTML = bookings.map(booking => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div class="text-sm">
                    <div class="font-medium text-gray-900">#${booking.id.slice(-8)}</div>
                    <div class="text-gray-500">Booked ${formatDate(booking.created_at)}</div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            ${booking.pets?.name ? booking.pets.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${booking.pets?.name || 'Unknown Pet'}</div>
                        <div class="text-sm text-gray-500">${booking.pets?.species || ''} - ${booking.pets?.breed || ''}</div>
                        <div class="text-xs text-gray-400">
                            ${booking.pets?.owner_name || 'Unknown Owner'}
                            ${booking.pets?.owner_phone ? ` • ${booking.pets.owner_phone}` : ''}
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm">
                    <div class="font-medium text-gray-900">${booking.pet_services?.name || 'Unknown Service'}</div>
                    <div class="text-gray-500 capitalize">${booking.pet_services?.category || ''}</div>
                    <div class="text-green-600 font-medium">$${booking.total_price || booking.pet_services?.price || '0.00'}</div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm">
                    <div class="font-medium text-gray-900">${formatDate(booking.booking_date)}</div>
                    <div class="text-gray-500">${booking.booking_time}</div>
                    ${booking.estimated_duration ? `<div class="text-xs text-gray-400">${booking.estimated_duration} min</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="space-y-1">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}">
                        ${getStatusIcon(booking.status)} ${booking.status ? booking.status.replace('-', ' ').toUpperCase() : 'UNKNOWN'}
                    </span>
                    <div class="text-xs">
                        <span class="text-gray-500">Payment: </span>
                        <span class="font-medium ${getPaymentStatusColor(booking.payment_status)}">${booking.payment_status ? booking.payment_status.replace('-', ' ').toUpperCase() : 'PENDING'}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button onclick="viewBooking('${booking.id}')" class="text-blue-600 hover:text-blue-900 transition-colors">View</button>
                <button onclick="editBooking('${booking.id}')" class="text-indigo-600 hover:text-indigo-900 transition-colors">Edit</button>
                <button onclick="updateBookingStatus('${booking.id}')" class="text-green-600 hover:text-green-900 transition-colors">Status</button>
                <button onclick="deleteBooking('${booking.id}')" class="text-red-600 hover:text-red-900 transition-colors">Cancel</button>
            </td>
        </tr>
    `).join('');
}

// Get status color classes
function getStatusColor(status) {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        'in-progress': 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        pending: '⏳',
        confirmed: '✅',
        'in-progress': '🔄',
        completed: '✔️',
        cancelled: '❌'
    };
    return icons[status] || '❓';
}

// Get payment status color
function getPaymentStatusColor(paymentStatus) {
    const colors = {
        pending: 'text-yellow-600',
        paid: 'text-green-600',
        'partially-paid': 'text-orange-600',
        refunded: 'text-purple-600'
    };
    return colors[paymentStatus] || 'text-gray-600';
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
    const totalBookings = serviceBookings.length;
    const confirmedBookings = serviceBookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = serviceBookings.filter(b => b.status === 'pending').length;
    const totalRevenue = serviceBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0);

    document.getElementById('total-bookings').textContent = totalBookings;
    document.getElementById('confirmed-bookings').textContent = confirmedBookings;
    document.getElementById('pending-bookings').textContent = pendingBookings;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
}

// Setup event listeners
function setupEventListeners() {
    // Add booking button
    document.getElementById('add-booking-btn').addEventListener('click', () => {
        editingBookingId = null;
        document.getElementById('modal-title').textContent = 'New Service Booking';
        bookingForm.reset();
        document.getElementById('booking-status').value = 'pending';
        document.getElementById('booking-payment-status').value = 'pending';
        // Set default date to today
        document.getElementById('booking-date').value = new Date().toISOString().split('T')[0];
        bookingModal.classList.remove('hidden');
    });

    // Cancel button
    document.getElementById('cancel-booking-btn').addEventListener('click', () => {
        bookingModal.classList.add('hidden');
    });

    // Form submission
    bookingForm.addEventListener('submit', handleFormSubmit);

    // Service selection auto-fill price
    document.getElementById('booking-service-id').addEventListener('change', (e) => {
        const serviceId = e.target.value;
        const service = petServices.find(s => s.id === serviceId);
        if (service) {
            document.getElementById('booking-price').value = service.price;
            document.getElementById('booking-duration').value = service.duration || '';
        }
    });

    // Search and filter functionality
    document.getElementById('search-input').addEventListener('input', filterBookings);
    document.getElementById('status-filter').addEventListener('change', filterBookings);
    document.getElementById('service-filter').addEventListener('change', filterBookings);
    document.getElementById('date-filter').addEventListener('change', filterBookings);
    
    // Clear filters
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('search-input').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('service-filter').value = '';
        document.getElementById('date-filter').value = '';
        filterBookings();
    });

    // Close modal on outside click
    bookingModal.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.classList.add('hidden');
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
        pet_id: document.getElementById('booking-pet-id').value,
        service_id: document.getElementById('booking-service-id').value,
        booking_date: document.getElementById('booking-date').value,
        booking_time: document.getElementById('booking-time').value,
        status: document.getElementById('booking-status').value,
        payment_status: document.getElementById('booking-payment-status').value,
        notes: document.getElementById('booking-notes').value,
        estimated_duration: parseInt(document.getElementById('booking-duration').value) || null,
        total_price: parseFloat(document.getElementById('booking-price').value) || 0
    };

    try {
        let result;
        if (editingBookingId) {
            result = await supabase
                .from('service_bookings')
                .update(formData)
                .eq('id', editingBookingId);
        } else {
            result = await supabase
                .from('service_bookings')
                .insert([formData]);
        }

        if (result.error) throw result.error;

        showNotification(
            editingBookingId ? 'Booking updated successfully!' : 'Booking created successfully!',
            'success'
        );

        bookingModal.classList.add('hidden');
        await loadServiceBookings();
        updateStats();
    } catch (error) {
        console.error('Error saving booking:', error);
        showNotification('Error saving booking', 'error');
    }
}

// View booking details
function viewBooking(bookingId) {
    const booking = serviceBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const details = `
        <div class="space-y-4">
            <h4 class="font-semibold text-lg">Booking Details</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Booking ID:</strong> #${booking.id.slice(-8)}</div>
                <div><strong>Status:</strong> ${booking.status?.toUpperCase() || 'UNKNOWN'}</div>
                <div><strong>Pet:</strong> ${booking.pets?.name || 'Unknown'}</div>
                <div><strong>Owner:</strong> ${booking.pets?.owner_name || 'Unknown'}</div>
                <div><strong>Service:</strong> ${booking.pet_services?.name || 'Unknown'}</div>
                <div><strong>Category:</strong> ${booking.pet_services?.category || '-'}</div>
                <div><strong>Date:</strong> ${formatDate(booking.booking_date)}</div>
                <div><strong>Time:</strong> ${booking.booking_time}</div>
                <div><strong>Duration:</strong> ${booking.estimated_duration ? booking.estimated_duration + ' min' : 'N/A'}</div>
                <div><strong>Price:</strong> $${booking.total_price || '0.00'}</div>
                <div><strong>Payment:</strong> ${booking.payment_status?.replace('-', ' ').toUpperCase() || 'PENDING'}</div>
                <div><strong>Created:</strong> ${formatDate(booking.created_at)}</div>
                <div class="col-span-2"><strong>Notes:</strong> ${booking.notes || 'No special instructions'}</div>
                <div class="col-span-2"><strong>Contact:</strong> ${booking.pets?.owner_phone || ''} ${booking.pets?.owner_email || ''}</div>
            </div>
        </div>
    `;

    showModal('Booking Details', details);
}

// Edit booking
function editBooking(bookingId) {
    const booking = serviceBookings.find(b => b.id === bookingId);
    if (!booking) return;

    editingBookingId = bookingId;
    document.getElementById('modal-title').textContent = 'Edit Service Booking';
    
    // Populate form fields
    document.getElementById('booking-pet-id').value = booking.pet_id || '';
    document.getElementById('booking-service-id').value = booking.service_id || '';
    document.getElementById('booking-date').value = booking.booking_date || '';
    document.getElementById('booking-time').value = booking.booking_time || '';
    document.getElementById('booking-status').value = booking.status || 'pending';
    document.getElementById('booking-payment-status').value = booking.payment_status || 'pending';
    document.getElementById('booking-notes').value = booking.notes || '';
    document.getElementById('booking-duration').value = booking.estimated_duration || '';
    document.getElementById('booking-price').value = booking.total_price || '';

    bookingModal.classList.remove('hidden');
}

// Update booking status
async function updateBookingStatus(bookingId) {
    const booking = serviceBookings.find(b => b.id === bookingId);
    if (!booking) return;

    const statusOptions = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    const currentIndex = statusOptions.indexOf(booking.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];

    if (!confirm(`Change booking status from "${booking.status}" to "${nextStatus}"?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('service_bookings')
            .update({ status: nextStatus })
            .eq('id', bookingId);

        if (error) throw error;

        showNotification(`Booking status updated to ${nextStatus}!`, 'success');
        await loadServiceBookings();
        updateStats();
    } catch (error) {
        console.error('Error updating booking status:', error);
        showNotification('Error updating booking status', 'error');
    }
}

// Delete booking
async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('service_bookings')
            .delete()
            .eq('id', bookingId);

        if (error) throw error;

        showNotification('Booking cancelled successfully!', 'success');
        await loadServiceBookings();
        updateStats();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Error cancelling booking', 'error');
    }
}

// Filter bookings
function filterBookings() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const serviceFilter = document.getElementById('service-filter').value;
    const dateFilter = document.getElementById('date-filter').value;

    let filteredBookings = serviceBookings.filter(booking => {
        const matchesSearch = !searchTerm || 
            booking.pets?.name?.toLowerCase().includes(searchTerm) ||
            booking.pets?.owner_name?.toLowerCase().includes(searchTerm) ||
            booking.pet_services?.name?.toLowerCase().includes(searchTerm) ||
            booking.notes?.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusFilter || booking.status === statusFilter;
        const matchesService = !serviceFilter || booking.service_id === serviceFilter;
        const matchesDate = !dateFilter || booking.booking_date === dateFilter;

        return matchesSearch && matchesStatus && matchesService && matchesDate;
    });

    displayServiceBookings(filteredBookings);
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
