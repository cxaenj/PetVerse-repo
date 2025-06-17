// Enhanced PetVerse Admin Dashboard JavaScript - Pet Care Focused (Performance Optimized)
// Static data for pet care management

// Performance tracking
const loadStartTime = performance.now();

// Remove sales-related functionality and focus on pet care
function initializePetCareDashboard() {
  // Static pet care statistics - no heavy calculations
  const petStats = {
    activePets: 342,
    appointments: 28,
    adoptions: 156,
    careServices: 89
  };

  // Simple display without animations for better performance
  console.log('Pet care dashboard initialized quickly with static data');
  
  // Log performance
  const loadTime = performance.now() - loadStartTime;
  console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
}

// Enhanced toast notification system
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  if (toast && toastMessage) {
    // Set message and style based on type
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('show');
    }, 3000);
  }
}

// Pet care reminder system
function showPetCareReminders() {
  const reminders = [
    { icon: '🐕', title: 'Vaccination Due', message: '5 dogs need vaccination this week' },
    { icon: '😺', title: 'Health Check', message: '3 cats due for checkup' },
    { icon: '💊', title: 'Medication', message: '8 pets need daily medication' }
  ];
  
  console.log('Pet care reminders loaded:', reminders);
  showToast('🐾 Pet care reminders updated!', 'info');
}

// Enhanced session check
function checkAdminSession() {
  const session = JSON.parse(sessionStorage.getItem('session'));
  if (!session || session.userType !== 'admin' || Date.now() > session.expiryTime) {
    showToast('🔒 Session expired. Redirecting to login...', 'warning');
    setTimeout(() => {
      window.location.href = '/landing/pages/login.html';
    }, 2000);
    return false;
  }
  return true;
}

// Initialize dashboard - Optimized for performance
function initializeDashboard() {
  // Quick session check
  if (!checkAdminSession()) {
    return;
  }
  
  // Initialize pet care dashboard with static data
  initializePetCareDashboard();
  
  // Show pet care reminders without delay
  showPetCareReminders();
  
  // Set up live time updates (less frequent for better performance)
  setInterval(() => {
    const timeElement = document.querySelector('.live-time');
    if (timeElement) {
      timeElement.textContent = new Date().toLocaleTimeString();
    }
  }, 5000); // Update every 5 seconds instead of every second
  
  console.log('Pet care admin dashboard loaded quickly');
}

// Enhanced page load handler - Optimized for faster loading
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main-content');
  
  // Fast loader transition - reduced from 2 seconds to 500ms
  setTimeout(() => {
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        loader.style.display = 'none';
        if (main) {
          main.classList.remove('opacity-0');
        }
        initializeDashboard();
      }, 300); // Reduced fade transition time
    }
  }, 500); // Reduced from 2000ms to 500ms for faster loading
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Refresh pet care reminders when page becomes visible again
    showPetCareReminders();
  }
});

// Add click handlers for floating action buttons
document.addEventListener('DOMContentLoaded', () => {
  // Emergency alert button
  const emergencyBtn = document.querySelector('button[title="Emergency Alert"]');
  if (emergencyBtn) {
    emergencyBtn.addEventListener('click', () => {
      showToast('🚨 Emergency protocol activated!', 'error');
    });
  }
  
  // Schedule appointment button
  const appointmentBtn = document.querySelector('button[title="Schedule Appointment"]');
  if (appointmentBtn) {
    appointmentBtn.addEventListener('click', () => {
      showToast('📅 Appointment scheduler opened!', 'info');
    });
  }
  
  // Add new pet button
  const newPetBtn = document.querySelector('button[title="Add New Pet"]');
  if (newPetBtn) {
    newPetBtn.addEventListener('click', () => {
      showToast('🐾 New pet registration started!', 'success');
    });
  }
});

// Clean up - remove all sales-related functionality since we're now pet-care focused
