// index.js
// Loader animation
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main-content');
  
  // Check if page was loaded from back/forward cache
  if (performance.navigation.type === 2) {
    loader.style.display = 'none';
    main.classList.remove('opacity-0');
    return;
  }
  
  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    main.classList.remove('opacity-0');
    main.classList.add('fade-in');
  }, 1000);
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenu = document.getElementById('mobile-menu');
  const menuButton = document.querySelector('button[aria-label="Open menu"]');
  const closeButton = document.getElementById('close-menu');
  const mobileLinks = mobileMenu.querySelectorAll('a');

  function toggleMenu() {
    const isOpening = mobileMenu.classList.contains('hidden');
    
    // Update ARIA attributes
    menuButton.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
    mobileMenu.setAttribute('aria-hidden', isOpening ? 'false' : 'true');
    
    if (isOpening) {
      // Opening the menu
      mobileMenu.classList.remove('hidden');
      // Trigger reflow for animation
      mobileMenu.offsetHeight;
      mobileMenu.classList.add('menu-visible');
      document.body.classList.add('overflow-hidden');
      
      // Trap focus within menu
      const focusableElements = mobileMenu.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        setTimeout(() => focusableElements[0].focus(), 100);
      }
    } else {
      // Closing the menu
      mobileMenu.classList.remove('menu-visible');
      document.body.classList.remove('overflow-hidden');
      menuButton.focus(); // Return focus to menu button
      
      // Wait for animation to finish before hiding
      setTimeout(() => {
        mobileMenu.classList.add('hidden');
      }, 300);
    }
  }

  menuButton.addEventListener('click', toggleMenu);
  closeButton.addEventListener('click', toggleMenu);

  // Close menu when clicking a link
  mobileLinks.forEach(link => {
    link.addEventListener('click', toggleMenu);
  });

  // Keyboard navigation for mobile menu
  function handleTabKey(e) {
    if (!mobileMenu.classList.contains('hidden')) {
      const focusableElements = mobileMenu.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If shift + tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // If just tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  // Add keyboard navigation to mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      handleTabKey(e);
    } else if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      toggleMenu();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenu.classList.contains('hidden') && 
        !mobileMenu.contains(e.target) && 
        !menuButton.contains(e.target)) {
      toggleMenu();
    }
  });
});

// Smooth scroll behavior for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Header visibility management
let lastScroll = window.scrollY;
const header = document.querySelector('nav');
const scrollThreshold = 50;

function handleHeaderVisibility() {
  const currentScroll = window.scrollY;
  
  // Show/hide header based on scroll direction
  if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
    // Scrolling down & past threshold - hide header
    header.style.transform = 'translateY(-100%)';
  } else {
    // Scrolling up or at top - show header
    header.style.transform = 'translateY(0)';
  }
  
  lastScroll = currentScroll;
}

// Add smooth transition to header
header.style.transition = 'transform 0.3s ease-in-out';

// Use Intersection Observer for better scroll performance
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, {
  rootMargin: '-50% 0px -50% 0px'
});

// Observe all sections
document.querySelectorAll('section, #featured, #why-choose, #locations, #footer').forEach(section => {
  observer.observe(section);
});

// Throttle function to limit scroll event firing
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Update active navigation link based on scroll position
function updateActiveNavLink() {
  const scrollPosition = window.scrollY + window.innerHeight / 3;
  
  document.querySelectorAll('section, #featured, #why-choose, #locations, #footer').forEach(section => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    
    if (scrollPosition >= top && scrollPosition < bottom) {
      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === `#${section.id}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'true');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    }
  });
}

// Debounce function for better performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimize scroll handlers with requestAnimationFrame
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveNavLink();
      handleHeaderVisibility();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

document.addEventListener('DOMContentLoaded', updateActiveNavLink);

// Touch support for mobile menu
let touchStartY = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 50;

document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
});

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchmove', (e) => {
  touchEndY = e.touches[0].clientY;
  touchEndX = e.touches[0].clientX;
  
  // If swiping down near the top of the screen, show header
  if (window.scrollY < scrollThreshold && touchEndY - touchStartY > SWIPE_THRESHOLD) {
    header.style.transform = 'translateY(0)';
  }
  
  // If menu is open and swiping right to close
  if (!mobileMenu.classList.contains('hidden') && touchEndX - touchStartX > SWIPE_THRESHOLD) {
    toggleMenu();
  }
}, { passive: true });

document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}, { passive: true });

// Use a single scroll handler with requestAnimationFrame
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      handleHeaderVisibility();
      updateActiveNavLink();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// Optimize loading of external resources
document.addEventListener('DOMContentLoaded', () => {
  // Lazy load images that are off-screen
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });
  
  lazyImages.forEach(img => {
    if (img.dataset.src) {
      imageObserver.observe(img);
    }
  });

  // Preload critical resources
  const preloadLinks = [
    { rel: 'preload', href: '/petverse-icon.ico', as: 'image' },
    { rel: 'preload', href: '/css/design-system.css', as: 'style' }
  ];

  preloadLinks.forEach(link => {
    const linkEl = document.createElement('link');
    linkEl.rel = link.rel;
    linkEl.href = link.href;
    linkEl.as = link.as;
    document.head.appendChild(linkEl);
  });
});