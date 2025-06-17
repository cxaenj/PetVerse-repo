// Appointments Management JavaScript
// PetVerse Admin - Appointment Management System

// Supabase configuration
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Initialize Supabase client
let supabase = null;
let appointments = [];
let pets = [];
let isEditing = false;
let editingAppointmentId = null;

// Initialize Supabase connection
async function initializeSupabase() {
  try {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase initialized for appointments management');
      return true;
    } else {
      console.warn('⚠️ Supabase not available, using localStorage fallback');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    return false;
  }
}

// Load appointments from Supabase
async function loadAppointmentsFromSupabase() {
  try {
    if (!supabase) {
      console.log('📦 Loading appointments from localStorage');
      appointments = JSON.parse(localStorage.getItem('appointments')) || [];
      return appointments;
    }

    console.log('🔄 Loading appointments from Supabase...');
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        pets (
          id,
          name,
          species,
          breed
        ),
        users (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('❌ Error loading appointments from Supabase:', error);
      appointments = JSON.parse(localStorage.getItem('appointments')) || [];
      return appointments;
    }

    appointments = data || [];
    console.log(`✅ Loaded ${appointments.length} appointments from Supabase`);
    
    localStorage.setItem('appointments', JSON.stringify(appointments));
    return appointments;

  } catch (error) {
    console.error('❌ Failed to load appointments from Supabase:', error);
    appointments = JSON.parse(localStorage.getItem('appointments')) || [];
    return appointments;
  }
}

// Load pets for dropdown
async function loadPetsFromSupabase() {
  try {
    if (!supabase) {
      pets = JSON.parse(localStorage.getItem('pets')) || [];
      return pets;
    }

    const { data, error } = await supabase
      .from('pets')
      .select('id, name, species, breed')
      .eq('is_adopted', false)
      .order('name');

    if (error) {
      console.error('❌ Error loading pets:', error);
      pets = JSON.parse(localStorage.getItem('pets')) || [];
      return pets;
    }

    pets = data || [];
    populatePetsDropdown();
    return pets;

  } catch (error) {
    console.error('❌ Failed to load pets:', error);
    pets = JSON.parse(localStorage.getItem('pets')) || [];
    return pets;
  }
}

// Populate pets dropdown
function populatePetsDropdown() {
  const petSelect = document.getElementById('appointment-pet');
  petSelect.innerHTML = '<option value="">Select Pet</option>';
  
  pets.forEach(pet => {
    const option = document.createElement('option');
    option.value = pet.id;
    option.textContent = `${pet.name} (${pet.species}${pet.breed ? ` - ${pet.breed}` : ''})`;
    petSelect.appendChild(option);
  });
}

// Save appointment to Supabase
async function saveAppointmentToSupabase(appointmentData) {
  try {
    if (!supabase) {
      console.log('📦 Saving appointment to localStorage');
      appointmentData.id = Date.now().toString();
      appointments.unshift(appointmentData);
      localStorage.setItem('appointments', JSON.stringify(appointments));
      return { success: true, data: appointmentData };
    }

    console.log('🔄 Saving appointment to Supabase...', appointmentData);
    
    let result;
    if (isEditing && editingAppointmentId) {
      result = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', editingAppointmentId)
        .select();
    } else {
      result = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();
    }

    const { data, error } = result;

    if (error) {
      console.error('❌ Error saving appointment to Supabase:', error);
      return { success: false, error };
    }

    console.log('✅ Appointment saved successfully');
    await loadAppointmentsFromSupabase();
    return { success: true, data: data[0] };

  } catch (error) {
    console.error('❌ Failed to save appointment:', error);
    return { success: false, error };
  }
}

// Delete appointment
async function deleteAppointmentFromSupabase(appointmentId) {
  try {
    if (!supabase) {
      appointments = appointments.filter(apt => apt.id !== appointmentId);
      localStorage.setItem('appointments', JSON.stringify(appointments));
      return { success: true };
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      console.error('❌ Error deleting appointment:', error);
      return { success: false, error };
    }

    await loadAppointmentsFromSupabase();
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to delete appointment:', error);
    return { success: false, error };
  }
}

// Render appointments table
function renderAppointmentsTable(appointmentsToRender = appointments) {
  const tableBody = document.getElementById('appointments-table');
  const emptyState = document.getElementById('appointments-empty');
  
  if (appointmentsToRender.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  tableBody.innerHTML = appointmentsToRender.map(appointment => {
    const date = new Date(appointment.appointment_date);
    const statusColor = getStatusColor(appointment.status);
    const typeEmoji = getTypeEmoji(appointment.appointment_type);
    
    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="text-2xl mr-3">${typeEmoji}</div>
            <div>
              <div class="text-sm font-medium text-gray-900">
                ${appointment.pets?.name || 'Unknown Pet'}
              </div>
              <div class="text-sm text-gray-500">
                ${appointment.users?.full_name || 'Unknown Owner'}
              </div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${date.toLocaleDateString()}</div>
          <div class="text-sm text-gray-500">${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">${appointment.appointment_type}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor.bg} ${statusColor.text}">
            ${appointment.status}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${appointment.cost ? `₱${parseFloat(appointment.cost).toFixed(2)}` : '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex space-x-2">
            <button onclick="editAppointment('${appointment.id}')" class="text-blue-600 hover:text-blue-900" title="Edit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="deleteAppointment('${appointment.id}')" class="text-red-600 hover:text-red-900" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Helper functions
function getStatusColor(status) {
  const colors = {
    'scheduled': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'completed': { bg: 'bg-green-100', text: 'text-green-800' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-800' },
    'no_show': { bg: 'bg-gray-100', text: 'text-gray-800' }
  };
  return colors[status] || colors['scheduled'];
}

function getTypeEmoji(type) {
  const emojis = {
    'Checkup': '🩺',
    'Vaccination': '💉',
    'Surgery': '🏥',
    'Emergency': '🚨',
    'Grooming': '✂️',
    'Dental': '🦷',
    'Follow-up': '📋'
  };
  return emojis[type] || '📅';
}

// Update statistics
function updateStatistics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= today && aptDate <= todayEnd;
  });
  
  const weekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= weekStart && aptDate <= weekEnd;
  });
  
  const pendingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');
  
  document.getElementById('today-count').textContent = todayAppointments.length;
  document.getElementById('week-count').textContent = weekAppointments.length;
  document.getElementById('pending-count').textContent = pendingAppointments.length;
  document.getElementById('completed-count').textContent = completedAppointments.length;
}

// Filter appointments
function filterAppointments() {
  const searchTerm = document.getElementById('search-appointments').value.toLowerCase();
  const dateFilter = document.getElementById('filter-date').value;
  const statusFilter = document.getElementById('filter-status').value;
  const typeFilter = document.getElementById('filter-type').value;
  
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      (appointment.pets?.name && appointment.pets.name.toLowerCase().includes(searchTerm)) ||
      appointment.appointment_type.toLowerCase().includes(searchTerm) ||
      (appointment.users?.full_name && appointment.users.full_name.toLowerCase().includes(searchTerm));
    
    const matchesDate = !dateFilter || 
      new Date(appointment.appointment_date).toISOString().split('T')[0] === dateFilter;
    
    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    const matchesType = !typeFilter || appointment.appointment_type === typeFilter;
    
    return matchesSearch && matchesDate && matchesStatus && matchesType;
  });
  
  renderAppointmentsTable(filteredAppointments);
}

// Clear filters
function clearFilters() {
  document.getElementById('search-appointments').value = '';
  document.getElementById('filter-date').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-type').value = '';
  renderAppointmentsTable();
}

// Modal functions
function openAppointmentModal() {
  document.getElementById('appointment-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAppointmentModal() {
  document.getElementById('appointment-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  resetAppointmentForm();
}

function resetAppointmentForm() {
  document.getElementById('appointment-form').reset();
  document.getElementById('appointment-modal-title').textContent = 'Schedule Appointment';
  isEditing = false;
  editingAppointmentId = null;
}

// Edit appointment
function editAppointment(appointmentId) {
  const appointment = appointments.find(apt => apt.id === appointmentId);
  if (!appointment) return;
  
  isEditing = true;
  editingAppointmentId = appointmentId;
  
  // Populate form
  document.getElementById('appointment-pet').value = appointment.pet_id || '';
  document.getElementById('appointment-type').value = appointment.appointment_type || '';
  
  const date = new Date(appointment.appointment_date);
  document.getElementById('appointment-date').value = date.toISOString().split('T')[0];
  document.getElementById('appointment-time').value = date.toTimeString().slice(0, 5);
  
  document.getElementById('appointment-status').value = appointment.status || 'scheduled';
  document.getElementById('appointment-cost').value = appointment.cost || '';
  document.getElementById('appointment-notes').value = appointment.notes || '';
  document.getElementById('appointment-vet-notes').value = appointment.veterinarian_notes || '';
  
  document.getElementById('appointment-modal-title').textContent = 'Edit Appointment';
  openAppointmentModal();
}

// Delete appointment
async function deleteAppointment(appointmentId) {
  const appointment = appointments.find(apt => apt.id === appointmentId);
  if (!appointment) return;
  
  if (!confirm('Are you sure you want to delete this appointment?')) {
    return;
  }
  
  const result = await deleteAppointmentFromSupabase(appointmentId);
  
  if (result.success) {
    showToast('Appointment deleted successfully.', 'success');
    renderAppointmentsTable();
    updateStatistics();
  } else {
    showToast('Failed to delete appointment. Please try again.', 'error');
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toastMessage.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show', type);
  }, 3000);
}

// Initialize page
window.addEventListener('load', async () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main-content');
  const toggleBtn = document.getElementById('menu-toggle');

  // Initialize Supabase and load data
  await initializeSupabase();
  await Promise.all([
    loadAppointmentsFromSupabase(),
    loadPetsFromSupabase()
  ]);

  // Hide loader and show content
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    main.classList.remove('opacity-0');
    toggleBtn.classList.remove('hidden');
  }, 1000);

  // Render initial data
  renderAppointmentsTable();
  updateStatistics();

  // Set up event listeners
  const sidebar = document.getElementById('sidebar');
  toggleBtn.addEventListener('click', () => {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full');
  });

  // Modal event listeners
  document.getElementById('add-appointment-btn').addEventListener('click', openAppointmentModal);
  document.getElementById('close-appointment-modal').addEventListener('click', closeAppointmentModal);
  document.getElementById('cancel-appointment-btn').addEventListener('click', closeAppointmentModal);

  // Form submission
  document.getElementById('appointment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const appointmentDateTime = new Date(`${date}T${time}`);
    
    const appointmentData = {
      pet_id: document.getElementById('appointment-pet').value,
      appointment_date: appointmentDateTime.toISOString(),
      appointment_type: document.getElementById('appointment-type').value,
      status: document.getElementById('appointment-status').value,
      cost: parseFloat(document.getElementById('appointment-cost').value) || null,
      notes: document.getElementById('appointment-notes').value || null,
      veterinarian_notes: document.getElementById('appointment-vet-notes').value || null
    };

    const result = await saveAppointmentToSupabase(appointmentData);
    
    if (result.success) {
      showToast(isEditing ? 'Appointment updated successfully!' : 'Appointment scheduled successfully!', 'success');
      closeAppointmentModal();
      renderAppointmentsTable();
      updateStatistics();
    } else {
      showToast('Failed to save appointment. Please try again.', 'error');
    }
  });

  // Filter event listeners
  document.getElementById('search-appointments').addEventListener('input', filterAppointments);
  document.getElementById('filter-date').addEventListener('change', filterAppointments);
  document.getElementById('filter-status').addEventListener('change', filterAppointments);
  document.getElementById('filter-type').addEventListener('change', filterAppointments);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);

  // Modal close on outside click
  document.getElementById('appointment-modal').addEventListener('click', (e) => {
    if (e.target.id === 'appointment-modal') {
      closeAppointmentModal();
    }
  });

  // Toast close button
  document.getElementById('toast-close').addEventListener('click', () => {
    const toast = document.getElementById('toast');
    toast.classList.add('hidden');
    toast.classList.remove('show');
  });

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('appointment-date').setAttribute('min', today);
  document.getElementById('filter-date').setAttribute('min', today);
});
