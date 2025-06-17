// Enhanced PetVerse Admin Dashboard JavaScript - Supabase Integration
// Import Supabase configuration (will be loaded via ES modules)

// Performance tracking
const loadStartTime = performance.now();

// Global state
let dashboardData = {
  pets: [],
  sales: [],
  products: [],
  appointments: []
}

// Supabase configuration (inline for now)
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Initialize Supabase client (will be loaded from CDN)
let supabase = null

// Initialize Supabase and dashboard
async function initializePetCareDashboard() {
  try {
    // Initialize Supabase client
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey)
    } else {
      console.warn('Supabase not loaded, using mock data')
      return initializeMockData()
    }

    // Load all dashboard data from Supabase
    await Promise.all([
      loadPetsData(),
      loadSalesData(),
      loadProductsData(),
      loadAppointmentsData()
    ])

    // Update dashboard display
    updateDashboardStats()
    
    // Log performance
    const loadTime = performance.now() - loadStartTime
    console.log(`Dashboard loaded with Supabase data in ${loadTime.toFixed(2)}ms`)
    
    showToast('🐾 Dashboard data loaded from database!', 'success')
  } catch (error) {
    console.error('Failed to initialize dashboard:', error)
    showToast('❌ Failed to load dashboard data, using defaults', 'warning')
    initializeMockData()
  }
}

// Load pets data from Supabase
async function loadPetsData() {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select(`
        *,
        users (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('name')
    
    if (error) throw error
    dashboardData.pets = data || []
  } catch (error) {
    console.error('Failed to load pets:', error)
    dashboardData.pets = []
  }
}

// Load sales data from Supabase
async function loadSalesData() {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        users (
          id,
          full_name,
          email
        ),
        sale_items (
          *,
          products (
            id,
            name,
            price
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) throw error
    dashboardData.sales = data || []
  } catch (error) {
    console.error('Failed to load sales:', error)
    dashboardData.sales = []
  }
}

// Load products data from Supabase
async function loadProductsData() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        pet_categories (
          id,
          name,
          description
        )
      `)
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    dashboardData.products = data || []
  } catch (error) {
    console.error('Failed to load products:', error)
    dashboardData.products = []
  }
}

// Load appointments data from Supabase
async function loadAppointmentsData() {
  try {
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
      .gte('appointment_date', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('appointment_date')
    
    if (error) throw error
    dashboardData.appointments = data || []
  } catch (error) {
    console.error('Failed to load appointments:', error)
    dashboardData.appointments = []
  }
}

// Update dashboard statistics with real data
function updateDashboardStats() {
  // Calculate real statistics from loaded data
  const stats = {
    activePets: dashboardData.pets.length,
    upcomingAppointments: dashboardData.appointments.length,
    totalProducts: dashboardData.products.length,
    recentSales: dashboardData.sales.length
  }

  // Update stat cards with real data
  updateStatCard('Active Pets', stats.activePets)
  updateStatCard('Appointments', stats.upcomingAppointments) 
  updateStatCard('Adoptions', stats.totalProducts) // Using products as proxy
  updateStatCard('Care Services', stats.recentSales) // Using sales as proxy

  // Update recent activities with real data
  updateRecentActivities()
  
  // Update pet health breakdown
  updatePetHealthStats()
}

// Update individual stat card
function updateStatCard(title, value) {
  // Find the stat card by title and update its value
  const statCards = document.querySelectorAll('.stat-card')
  statCards.forEach(card => {
    const titleElement = card.querySelector('p:first-child')
    if (titleElement && titleElement.textContent.includes(title.split(' ')[0])) {
      const valueElement = card.querySelector('.text-3xl')
      if (valueElement) {
        valueElement.textContent = value.toLocaleString()
      }
    }
  })
}

// Update recent activities with real data
function updateRecentActivities() {
  const activitiesContainer = document.querySelector('.space-y-3.max-h-96')
  if (!activitiesContainer) return

  let activities = []

  // Add recent pet registrations
  dashboardData.pets.slice(0, 3).forEach(pet => {
    activities.push({
      icon: getSpeciesIcon(pet.species),
      title: `${pet.name} registered`,
      subtitle: `${pet.species} • ${getTimeAgo(pet.created_at)}`,
      type: 'registration'
    })
  })

  // Add recent appointments
  dashboardData.appointments.slice(0, 2).forEach(appointment => {
    activities.push({
      icon: '📅',
      title: `${appointment.pets?.name || 'Pet'} appointment scheduled`,
      subtitle: `${appointment.appointment_type} • ${getTimeAgo(appointment.created_at)}`,
      type: 'appointment'
    })
  })

  // Update the activities display
  if (activities.length > 0) {
    activitiesContainer.innerHTML = activities.map(activity => `
      <div class="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
        <span class="text-2xl">${activity.icon}</span>
        <div class="flex-1">
          <p class="font-semibold text-gray-800">${activity.title}</p>
          <p class="text-sm text-gray-600">${activity.subtitle}</p>
        </div>
        <span class="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">${activity.type}</span>
      </div>
    `).join('')
  }
}

// Update pet health statistics
function updatePetHealthStats() {
  const healthStats = {
    healthy: 0,
    needsAttention: 0,
    emergency: 0
  }

  dashboardData.pets.forEach(pet => {
    if (pet.health_status === 'Healthy') {
      healthStats.healthy++
    } else if (pet.health_status === 'Needs Attention') {
      healthStats.needsAttention++
    } else {
      healthStats.emergency++
    }
  })

  // Update health status displays
  const healthElements = document.querySelectorAll('.text-lg')
  healthElements.forEach(element => {
    if (element.textContent === '298') {
      element.textContent = healthStats.healthy
    } else if (element.textContent === '32') {
      element.textContent = healthStats.needsAttention
    } else if (element.textContent === '12') {
      element.textContent = healthStats.emergency
    }
  })
}

// Helper functions
function getSpeciesIcon(species) {
  const icons = {
    'Dog': '🐕',
    'Cat': '🐱',
    'Bird': '🐦',
    'Fish': '🐠',
    'Rabbit': '🐰'
  }
  return icons[species] || '🐾'
}

function getTimeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

// Fallback mock data initialization
function initializeMockData() {
  const mockStats = {
    activePets: 342,
    appointments: 28,
    adoptions: 156,
    careServices: 89
  }

  updateStatCard('Active Pets', mockStats.activePets)
  updateStatCard('Appointments', mockStats.appointments)
  updateStatCard('Adoptions', mockStats.adoptions)
  updateStatCard('Care Services', mockStats.careServices)

  console.log('Using mock data for dashboard')
}

// Enhanced toast notification system
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast')
  const toastMessage = document.getElementById('toast-message')
  
  if (toast && toastMessage) {
    toastMessage.textContent = message
    toast.className = `toast show ${type}`
    
    setTimeout(() => {
      toast.classList.add('hidden')
      toast.classList.remove('show')
    }, 3000)
  }
}

// Pet care reminder system
function showPetCareReminders() {
  const reminders = [
    { icon: '🐕', title: 'Vaccination Due', message: '5 dogs need vaccination this week' },
    { icon: '😺', title: 'Health Check', message: '3 cats due for checkup' },
    { icon: '💊', title: 'Medication', message: '8 pets need daily medication' }
  ]
  
  console.log('Pet care reminders loaded:', reminders)
}

// Enhanced session check
function checkAdminSession() {
  const session = JSON.parse(sessionStorage.getItem('session') || '{}')
  if (!session.userType || session.userType !== 'admin') {
    // For now, allow access - in production, implement proper auth
    return true
  }
  return true
}

// Initialize dashboard
function initializeDashboard() {
  // Check session
  if (!checkAdminSession()) {
    return
  }
  
  // Initialize pet care dashboard
  initializePetCareDashboard()
  
  // Show pet care reminders
  showPetCareReminders()
  
  // Set up live time updates
  setInterval(() => {
    const timeElement = document.querySelector('.live-time')
    if (timeElement) {
      timeElement.textContent = new Date().toLocaleTimeString()
    }
  }, 5000)
  
  console.log('Pet care admin dashboard initialized')
}

// Page load handler
window.addEventListener('load', () => {
  const loader = document.getElementById('loader')
  const main = document.getElementById('main-content')
  
  setTimeout(() => {
    if (loader) {
      loader.classList.add('fade-out')
      setTimeout(() => {
        loader.style.display = 'none'
        if (main) {
          main.classList.remove('opacity-0')
        }
        initializeDashboard()
      }, 300)
    }
  }, 500)
})

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && supabase) {
    // Refresh data when page becomes visible
    initializePetCareDashboard()
  }
})

// Floating action button handlers
document.addEventListener('DOMContentLoaded', () => {
  // Emergency alert button
  const emergencyBtn = document.querySelector('button[title="Emergency Alert"]')
  if (emergencyBtn) {
    emergencyBtn.addEventListener('click', () => {
      showToast('🚨 Emergency protocol activated!', 'error')
    })
  }
  
  // Schedule appointment button
  const appointmentBtn = document.querySelector('button[title="Schedule Appointment"]')
  if (appointmentBtn) {
    appointmentBtn.addEventListener('click', async () => {
      // In a real implementation, open appointment modal
      showToast('📅 Appointment scheduler opened!', 'info')
    })
  }
  
  // Add new pet button
  const newPetBtn = document.querySelector('button[title="Add New Pet"]')
  if (newPetBtn) {
    newPetBtn.addEventListener('click', async () => {
      // In a real implementation, open pet registration modal
      showToast('🐾 New pet registration started!', 'success')
    })
  }
})
