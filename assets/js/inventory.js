// inventory.js

// Check login status
if (!localStorage.getItem('isLoggedIn')) {
  window.location.href = '/pages/login.html';
}

// Global variables for DOM elements
const previewImage = document.getElementById('preview-image');
const placeholderText = document.getElementById('placeholder-text');
const form = document.getElementById('product-form');
const uploadBtn = document.getElementById('upload-btn');
const productImage = document.getElementById('product-image');

// Initialize inventory from localStorage
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

function renderInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = inventory.map((item, index) => `
    <tr class="border-b hover:bg-gray-50">
      <td class="p-3">${index + 1}</td>
      <td class="p-3">
        <img src="${item.image || 'https://placehold.co/200x200/png?text=Product+Image'}" 
             alt="${item.name}" 
             class="w-16 h-16 object-cover rounded">
      </td>
      <td class="p-3 font-medium">${item.name}</td>
      <td class="p-3 text-green-700 font-semibold">₱${item.price.toFixed(2)}</td>
      <td class="p-3">${item.qty}</td>
      <td class="p-3 text-center">
        <span class="px-2 py-1 text-xs rounded-full ${item.qty > 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}">
          ${item.qty > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td class="p-3 text-center space-x-2">
        <button onclick="loadProduct(${index})" class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm">Edit</button>
        <button onclick="deleteProduct(${index})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
      </td>
    </tr>
  `).join('');
}

function deleteProduct(index) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  inventory.splice(index, 1);
  localStorage.setItem('inventory', JSON.stringify(inventory));
  renderInventory();
}

function loadProduct(index) {
  const item = inventory[index];
  document.getElementById('product-name').value = item.name;
  document.getElementById('product-price').value = item.price;
  document.getElementById('product-qty').value = item.qty;
  document.getElementById('product-index').value = index;
  document.getElementById('product-description').value = item.description || '';
  
  if (item.image) {
    previewImage.src = item.image;
    previewImage.classList.remove('hidden');
    placeholderText.classList.add('hidden');
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    console.log('Saved to localStorage:', inventory);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    alert('Error saving product. Please try again.');
    return false;
  }
}

function handleSaveProduct(e) {
  e.preventDefault();
  console.log('Form submitted');

  // Get form values
  const formData = {
    name: document.getElementById('product-name').value.trim(),
    description: document.getElementById('product-description').value.trim(),
    price: parseFloat(document.getElementById('product-price').value),
    qty: parseInt(document.getElementById('product-qty').value),
    image: previewImage.classList.contains('hidden') ? 
      'https://placehold.co/200x200/png?text=Product+Image' : 
      previewImage.src
  };

  console.log('Form data:', formData);

  // Validate form data
  if (!formData.name || !formData.description || isNaN(formData.price) || isNaN(formData.qty)) {
    alert('All fields are required');
    return;
  }

  if (formData.price <= 0) {
    alert('Price must be greater than 0');
    return;
  }

  if (formData.qty < 0) {
    alert('Quantity cannot be negative');
    return;
  }

  // Get index for edit mode
  const index = document.getElementById('product-index').value;

  // Add or update product
  if (index === '') {
    inventory.push(formData);
  } else {
    inventory[parseInt(index)] = formData;
  }

  // Save and update UI
  if (saveToLocalStorage()) {
    // Show success message
    const successAlert = document.createElement('div');
    successAlert.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg';
    successAlert.textContent = 'Product saved successfully!';
    document.body.appendChild(successAlert);
    
    // Remove success message after 2 seconds
    setTimeout(() => successAlert.remove(), 2000);

    // Reset form
    e.target.reset();
    document.getElementById('product-index').value = '';
    previewImage.classList.add('hidden');
    placeholderText.classList.remove('hidden');
    
    // If we came from POS, return there after saving
    if (localStorage.getItem('returnToPos')) {
      setTimeout(() => returnToPos(), 1500);
    } else {
      document.getElementById('edit-alert')?.remove();
    }
    
    // Update display
    renderInventory();
    console.log('Product saved successfully');
  }
}

// Initialize all event handlers
function initializeEventHandlers() {
  if (form) {
    form.addEventListener('submit', handleSaveProduct);
    console.log('Form handler attached');
  } else {
    console.error('Product form not found!');
  }

  if (uploadBtn && productImage) {
    uploadBtn.addEventListener('click', () => productImage.click());
    console.log('Upload button handler attached');
  }

  if (productImage) {
    productImage.addEventListener('change', handleImageUpload);
    console.log('Image upload handler attached');
  }
}

// Image upload handler
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.classList.remove('hidden');
      placeholderText.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEventHandlers);
} else {
  initializeEventHandlers();
}

// Initial render
renderInventory();

// Auto-load product from editIndex if present
const editIndex = localStorage.getItem('editIndex');
if (editIndex !== null) {
  loadProduct(parseInt(editIndex));
  localStorage.removeItem('editIndex');

  const alert = document.createElement('div');
  alert.id = 'edit-alert';
  alert.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 flex justify-between items-center';
  alert.innerHTML = `
    <span>Editing product from POS tab</span>
    <button class="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-4 py-1 rounded" onclick="returnToPos()">
      Return to POS
    </button>
  `;
  document.querySelector('main')?.prepend(alert);

  document.getElementById('product-name')?.focus();

  // Return to POS function
  window.returnToPos = function() {
    localStorage.removeItem('editIndex');
    localStorage.removeItem('returnToPos');
    window.location.href = '/pages/pos.html';
  };
}