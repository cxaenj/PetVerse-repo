// Pets Management JavaScript
// PetVerse Admin - Pet Management System

// Supabase configuration
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Initialize Supabase client
let supabase = null;
let pets = [];
let isEditing = false;
let editingPetId = null;

// Initialize Supabase connection
async function initializeSupabase() {
  try {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase initialized for pets management');
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

// Load pets from Supabase
async function loadPetsFromSupabase() {
  try {
    if (!supabase) {
      console.log('📦 Loading pets from localStorage (Supabase not available)');
      pets = JSON.parse(localStorage.getItem('pets')) || [];
      return pets;
    }

    console.log('🔄 Loading pets from Supabase...');
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading pets from Supabase:', error);
      // Fallback to localStorage
      pets = JSON.parse(localStorage.getItem('pets')) || [];
      return pets;
    }

    pets = data || [];
    console.log(`✅ Loaded ${pets.length} pets from Supabase`);
    
    // Update localStorage as backup
    localStorage.setItem('pets', JSON.stringify(pets));
    return pets;

  } catch (error) {
    console.error('❌ Failed to load pets from Supabase:', error);
    // Fallback to localStorage
    pets = JSON.parse(localStorage.getItem('pets')) || [];
    return pets;
  }
}

// Save pet to Supabase
async function savePetToSupabase(petData) {
  try {
    if (!supabase) {
      console.log('📦 Saving pet to localStorage (Supabase not available)');
      // Generate a simple ID for localStorage
      petData.id = Date.now().toString();
      pets.unshift(petData);
      localStorage.setItem('pets', JSON.stringify(pets));
      return { success: true, data: petData };
    }

    console.log('🔄 Saving pet to Supabase...', petData);
    
    let result;
    if (isEditing && editingPetId) {
      // Update existing pet
      result = await supabase
        .from('pets')
        .update(petData)
        .eq('id', editingPetId)
        .select();
    } else {
      // Insert new pet
      result = await supabase
        .from('pets')
        .insert([petData])
        .select();
    }

    const { data, error } = result;

    if (error) {
      console.error('❌ Error saving pet to Supabase:', error);
      return { success: false, error };
    }

    console.log('✅ Pet saved successfully in Supabase:', data);
    
    // Reload pets data
    await loadPetsFromSupabase();
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Failed to save pet:', error);
    return { success: false, error };
  }
}

// Delete pet from Supabase
async function deletePetFromSupabase(petId) {
  try {
    if (!supabase) {
      console.log('📦 Deleting pet from localStorage (Supabase not available)');
      pets = pets.filter(pet => pet.id !== petId);
      localStorage.setItem('pets', JSON.stringify(pets));
      return { success: true };
    }

    console.log('🔄 Deleting pet from Supabase...', petId);
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', petId);

    if (error) {
      console.error('❌ Error deleting pet from Supabase:', error);
      return { success: false, error };
    }

    console.log('✅ Pet deleted successfully from Supabase');
    
    // Reload pets data
    await loadPetsFromSupabase();
    
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete pet:', error);
    return { success: false, error };
  }
}

// Render pets grid
function renderPetsGrid(petsToRender = pets) {
  const petsGrid = document.getElementById('pets-grid');
  const emptyState = document.getElementById('empty-state');
  
  if (petsToRender.length === 0) {
    petsGrid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  petsGrid.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  petsGrid.innerHTML = petsToRender.map(pet => {
    const age = getAgeString(pet.age_years, pet.age_months);
    const healthColor = getHealthStatusColor(pet.health_status);
    const speciesEmoji = getSpeciesEmoji(pet.species);
    
    return `
      <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
          <span class="text-6xl">${speciesEmoji}</span>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-bold text-gray-800">${pet.name}</h3>
            <span class="px-2 py-1 rounded-full text-xs font-medium ${healthColor.bg} ${healthColor.text}">
              ${pet.health_status || 'Healthy'}
            </span>
          </div>
          
          <div class="space-y-1 text-sm text-gray-600 mb-4">
            <p><span class="font-medium">Species:</span> ${pet.species}</p>
            ${pet.breed ? `<p><span class="font-medium">Breed:</span> ${pet.breed}</p>` : ''}
            ${age ? `<p><span class="font-medium">Age:</span> ${age}</p>` : ''}
            ${pet.gender ? `<p><span class="font-medium">Gender:</span> ${pet.gender}</p>` : ''}
            ${pet.weight_kg ? `<p><span class="font-medium">Weight:</span> ${pet.weight_kg}kg</p>` : ''}
          </div>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1">
              <span class="text-xs px-2 py-1 rounded-full ${pet.is_adopted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                ${pet.is_adopted ? '🏠 Adopted' : '💝 Available'}
              </span>
            </div>
            <div class="flex space-x-2">
              <button onclick="editPet('${pet.id}')" class="text-blue-600 hover:text-blue-800 p-1" title="Edit Pet">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button onclick="deletePet('${pet.id}')" class="text-red-600 hover:text-red-800 p-1" title="Delete Pet">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Helper functions
function getSpeciesEmoji(species) {
  const emojis = {
    'Dog': '🐕',
    'Cat': '🐱',
    'Bird': '🐦',
    'Fish': '🐠',
    'Rabbit': '🐰',
    'Hamster': '🐹',
    'Guinea Pig': '🐹',
    'Other': '🐾'
  };
  return emojis[species] || '🐾';
}

function getHealthStatusColor(status) {
  const colors = {
    'Healthy': { bg: 'bg-green-100', text: 'text-green-700' },
    'Needs Attention': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'Under Treatment': { bg: 'bg-red-100', text: 'text-red-700' }
  };
  return colors[status] || colors['Healthy'];
}

function getAgeString(years, months) {
  if (!years && !months) return '';
  if (years && months) return `${years}y ${months}m`;
  if (years) return `${years} year${years > 1 ? 's' : ''}`;
  if (months) return `${months} month${months > 1 ? 's' : ''}`;
  return '';
}

// Filter pets
function filterPets() {
  const searchTerm = document.getElementById('search-pets').value.toLowerCase();
  const speciesFilter = document.getElementById('filter-species').value;
  const healthFilter = document.getElementById('filter-health').value;
  const adoptionFilter = document.getElementById('filter-adoption').value;
  
  const filteredPets = pets.filter(pet => {
    const matchesSearch = !searchTerm || 
      pet.name.toLowerCase().includes(searchTerm) ||
      (pet.breed && pet.breed.toLowerCase().includes(searchTerm)) ||
      pet.species.toLowerCase().includes(searchTerm);
    
    const matchesSpecies = !speciesFilter || pet.species === speciesFilter;
    const matchesHealth = !healthFilter || pet.health_status === healthFilter;
    const matchesAdoption = !adoptionFilter || pet.is_adopted.toString() === adoptionFilter;
    
    return matchesSearch && matchesSpecies && matchesHealth && matchesAdoption;
  });
  
  renderPetsGrid(filteredPets);
}

// Modal functions
function openPetModal() {
  document.getElementById('pet-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePetModal() {
  document.getElementById('pet-modal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  resetForm();
}

function resetForm() {
  document.getElementById('pet-form').reset();
  document.getElementById('modal-title').textContent = 'Add New Pet';
  isEditing = false;
  editingPetId = null;
}

// Edit pet
function editPet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  
  isEditing = true;
  editingPetId = petId;
  
  // Populate form
  document.getElementById('pet-name').value = pet.name || '';
  document.getElementById('pet-species').value = pet.species || '';
  document.getElementById('pet-breed').value = pet.breed || '';
  document.getElementById('pet-gender').value = pet.gender || '';
  document.getElementById('pet-age-years').value = pet.age_years || '';
  document.getElementById('pet-age-months').value = pet.age_months || '';
  document.getElementById('pet-color').value = pet.color || '';
  document.getElementById('pet-weight').value = pet.weight_kg || '';
  document.getElementById('pet-health-status').value = pet.health_status || 'Healthy';
  document.getElementById('pet-vaccination-status').value = pet.vaccination_status || 'Up to date';
  document.getElementById('pet-microchip').value = pet.microchip_id || '';
  document.getElementById('pet-adopted').value = pet.is_adopted ? 'true' : 'false';
  
  document.getElementById('modal-title').textContent = 'Edit Pet';
  openPetModal();
}

// Delete pet
async function deletePet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  
  if (!confirm(`Are you sure you want to delete ${pet.name}? This action cannot be undone.`)) {
    return;
  }
  
  const result = await deletePetFromSupabase(petId);
  
  if (result.success) {
    showToast(`${pet.name} has been deleted successfully.`, 'success');
    renderPetsGrid();
  } else {
    showToast('Failed to delete pet. Please try again.', 'error');
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

  // Initialize Supabase and load pets
  await initializeSupabase();
  await loadPetsFromSupabase();

  // Hide loader and show content
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    main.classList.remove('opacity-0');
    toggleBtn.classList.remove('hidden');
  }, 1000);

  // Render initial pets grid
  renderPetsGrid();

  // Set up event listeners
  const sidebar = document.getElementById('sidebar');
  toggleBtn.addEventListener('click', () => {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full');
    toggleBtn.classList.add('hidden-menu');
    setTimeout(() => {
      if (isOpen) toggleBtn.classList.remove('hidden-menu');
    }, 300);
  });

  // Modal event listeners
  document.getElementById('add-pet-btn').addEventListener('click', openPetModal);
  document.getElementById('close-modal').addEventListener('click', closePetModal);
  document.getElementById('cancel-btn').addEventListener('click', closePetModal);

  // Form submission
  document.getElementById('pet-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const petData = {
      name: document.getElementById('pet-name').value,
      species: document.getElementById('pet-species').value,
      breed: document.getElementById('pet-breed').value || null,
      gender: document.getElementById('pet-gender').value || null,
      age_years: parseInt(document.getElementById('pet-age-years').value) || null,
      age_months: parseInt(document.getElementById('pet-age-months').value) || null,
      color: document.getElementById('pet-color').value || null,
      weight_kg: parseFloat(document.getElementById('pet-weight').value) || null,
      health_status: document.getElementById('pet-health-status').value,
      vaccination_status: document.getElementById('pet-vaccination-status').value,
      microchip_id: document.getElementById('pet-microchip').value || null,
      is_adopted: document.getElementById('pet-adopted').value === 'true'
    };

    const result = await savePetToSupabase(petData);
    
    if (result.success) {
      showToast(isEditing ? 'Pet updated successfully!' : 'Pet added successfully!', 'success');
      closePetModal();
      renderPetsGrid();
    } else {
      showToast('Failed to save pet. Please try again.', 'error');
    }
  });

  // Filter event listeners
  document.getElementById('search-pets').addEventListener('input', filterPets);
  document.getElementById('filter-species').addEventListener('change', filterPets);
  document.getElementById('filter-health').addEventListener('change', filterPets);
  document.getElementById('filter-adoption').addEventListener('change', filterPets);

  // Close modal when clicking outside
  document.getElementById('pet-modal').addEventListener('click', (e) => {
    if (e.target.id === 'pet-modal') {
      closePetModal();
    }
  });

  // Toast close button
  document.getElementById('toast-close').addEventListener('click', () => {
    const toast = document.getElementById('toast');
    toast.classList.add('hidden');
    toast.classList.remove('show');
  });

  // Responsive design
  function handleResize() {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      sidebar.classList.add('-translate-x-full');
      main.classList.remove('ml-72');
      main.classList.add('ml-0');
      toggleBtn.classList.remove('hidden');
    } else {
      sidebar.classList.remove('-translate-x-full');
      main.classList.remove('ml-0');
      main.classList.add('ml-72');
      toggleBtn.classList.add('hidden');
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();
});
