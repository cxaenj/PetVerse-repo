// Enhanced Inventory Management with Supabase Integration
// PetVerse Inventory System

// Check login status
if (!localStorage.getItem('isLoggedIn')) {
  window.location.href = '/landing/pages/login.html';
}

// Supabase configuration
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Initialize Supabase client
let supabase = null;
let inventory = [];

// Global variables for DOM elements
const previewImage = document.getElementById('preview-image');
const placeholderText = document.getElementById('placeholder-text');
const form = document.getElementById('product-form');
const uploadBtn = document.getElementById('upload-btn');
const productImage = document.getElementById('product-image');

// Initialize Supabase connection
async function initializeSupabase() {
  try {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase initialized for inventory management');
      
      // Test the connection immediately
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        console.error('🔍 Connection error details:', JSON.stringify(error, null, 2));
        return false;
      } else {
        console.log('✅ Supabase connection test successful');
        return true;
      }
    } else {
      console.warn('⚠️ Supabase not available, using localStorage fallback');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    console.error('🔍 Initialization error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

// Load inventory from Supabase
async function loadInventoryFromSupabase() {
  try {
    if (!supabase) {
      console.log('📦 Loading inventory from localStorage (Supabase not available)');
      inventory = JSON.parse(localStorage.getItem('inventory')) || [];
      return inventory;
    }

    console.log('🔄 Loading inventory from Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock_quantity,
        image_url,
        is_active,
        category_id,
        pet_categories (
          name
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error loading from Supabase:', error);
      // Fallback to localStorage
      inventory = JSON.parse(localStorage.getItem('inventory')) || [];
      showMessage('⚠️ Using local data (database unavailable)', 'warning');
      return inventory;
    }

    // Transform Supabase data to match existing inventory format
    inventory = data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      qty: item.stock_quantity || 0,
      image: item.image_url || 'https://placehold.co/200x200/png?text=Product+Image',
      category: item.pet_categories?.name || 'General'
    }));

    console.log(`✅ Loaded ${inventory.length} products from Supabase`);
    showMessage(`📦 Loaded ${inventory.length} products from database`, 'success');
    return inventory;

  } catch (error) {
    console.error('❌ Failed to load inventory:', error);
    // Fallback to localStorage
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    showMessage('⚠️ Using local data (database error)', 'warning');
    return inventory;
  }
}

// Save product to Supabase
async function saveProductToSupabase(productData) {
  try {
    if (!supabase) {
      console.log('💾 Saving to localStorage (Supabase not available)');
      return saveToLocalStorageFallback(productData);
    }

    console.log('🔄 Saving product to Supabase...', productData);

    // Prepare data for Supabase
    const supabaseData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock_quantity: productData.qty,
      image_url: productData.image,
      category: productData.category || 'General',
      is_active: true
    };

    let result;
    if (productData.id) {
      // Update existing product
      const { data, error } = await supabase
        .from('products')
        .update(supabaseData)
        .eq('id', productData.id)
        .select();
      
      result = { data, error };
    } else {
      // Insert new product
      const { data, error } = await supabase
        .from('products')
        .insert([supabaseData])
        .select();
      
      result = { data, error };
    }

    if (result.error) {
      console.error('❌ Error saving to Supabase:', result.error);
      console.error('🔍 Full error details:', JSON.stringify(result.error, null, 2));
      console.error('📦 Product data that failed:', JSON.stringify(supabaseData, null, 2));
      showMessage(`❌ Failed to save to database: ${result.error.message}`, 'error');
      return saveToLocalStorageFallback(productData);
    }

    console.log('✅ Product saved to Supabase successfully');
    showMessage('✅ Product saved to database successfully!', 'success');
    
    // Also save to localStorage as backup
    saveToLocalStorageFallback(productData);
    
    return true;

  } catch (error) {
    console.error('❌ Failed to save to Supabase:', error);
    showMessage('❌ Database error, saved locally instead', 'warning');
    return saveToLocalStorageFallback(productData);
  }
}

// Delete product from Supabase
async function deleteProductFromSupabase(productIndex) {
  try {
    const product = inventory[productIndex];
    
    if (!supabase || !product.id) {
      console.log('🗑️ Deleting from localStorage (Supabase not available or no ID)');
      return deleteFromLocalStorageFallback(productIndex);
    }

    console.log('🔄 Deleting product from Supabase...', product);

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', product.id);

    if (error) {
      console.error('❌ Error deleting from Supabase:', error);
      showMessage('❌ Failed to delete from database, removed locally instead', 'warning');
      return deleteFromLocalStorageFallback(productIndex);
    }

    console.log('✅ Product deleted from Supabase successfully');
    showMessage('✅ Product deleted from database successfully!', 'success');
    
    // Also remove from local inventory array
    inventory.splice(productIndex, 1);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    
    return true;

  } catch (error) {
    console.error('❌ Failed to delete from Supabase:', error);
    showMessage('❌ Database error, removed locally instead', 'warning');
    return deleteFromLocalStorageFallback(productIndex);
  }
}

// LocalStorage fallback functions
function saveToLocalStorageFallback(productData) {
  try {
    const index = productData.index;
    if (index !== undefined && index !== '') {
      inventory[parseInt(index)] = productData;
    } else {
      inventory.push(productData);
    }
    localStorage.setItem('inventory', JSON.stringify(inventory));
    console.log('💾 Saved to localStorage:', productData);
    return true;
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
    return false;
  }
}

function deleteFromLocalStorageFallback(productIndex) {
  try {
    inventory.splice(productIndex, 1);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    console.log('🗑️ Deleted from localStorage');
    return true;
  } catch (error) {
    console.error('❌ Error deleting from localStorage:', error);
    return false;
  }
}

// Show user messages
function showMessage(message, type = 'info') {
  const alertClass = {
    success: 'bg-green-100 border-green-500 text-green-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  const alert = document.createElement('div');
  alert.className = `fixed top-4 right-4 border-l-4 p-4 rounded shadow-lg z-50 ${alertClass[type]}`;
  alert.textContent = message;
  document.body.appendChild(alert);
  
  setTimeout(() => alert.remove(), 4000);
}

// Render inventory table
function renderInventory() {
  const list = document.getElementById('inventory-list');
  if (!list) return;

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

// Delete product
async function deleteProduct(index) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  showMessage('🔄 Deleting product...', 'info');
  
  const success = await deleteProductFromSupabase(index);
  if (success) {
    renderInventory();
  }
}

// Load product for editing
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

// Handle form submission
async function handleSaveProduct(e) {
  e.preventDefault();
  console.log('📝 Form submitted');

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

  // Validate form data
  if (!formData.name || !formData.description || isNaN(formData.price) || isNaN(formData.qty)) {
    showMessage('❌ All fields are required', 'error');
    return;
  }

  if (formData.price <= 0) {
    showMessage('❌ Price must be greater than 0', 'error');
    return;
  }

  if (formData.qty < 0) {
    showMessage('❌ Quantity cannot be negative', 'error');
    return;
  }

  // Get index for edit mode
  const index = document.getElementById('product-index').value;
  if (index !== '') {
    formData.index = index;
    formData.id = inventory[parseInt(index)]?.id; // Include existing ID for updates
  }

  showMessage('🔄 Saving product...', 'info');

  // Save to Supabase
  const success = await saveProductToSupabase(formData);
  
  if (success) {
    // Reset form
    e.target.reset();
    document.getElementById('product-index').value = '';
    previewImage.classList.add('hidden');
    placeholderText.classList.remove('hidden');
    
    // Reload inventory from database
    await loadInventoryFromSupabase();
    renderInventory();
    
    // If we came from POS, return there after saving
    if (localStorage.getItem('returnToPos')) {
      setTimeout(() => returnToPos(), 1500);
    }
  }
}

// Initialize all event handlers
function initializeEventHandlers() {
  if (form) {
    form.addEventListener('submit', handleSaveProduct);
    console.log('✅ Form handler attached');
  } else {
    console.error('❌ Product form not found!');
  }

  if (uploadBtn && productImage) {
    uploadBtn.addEventListener('click', () => productImage.click());
    console.log('✅ Upload button handler attached');
  }

  if (productImage) {
    productImage.addEventListener('change', handleImageUpload);
    console.log('✅ Image upload handler attached');
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

// Auto-load product from editIndex if present
const editIndex = localStorage.getItem('editIndex');
if (editIndex !== null) {
  setTimeout(() => {
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
  }, 500);

  // Return to POS function
  window.returnToPos = function() {
    localStorage.removeItem('editIndex');
    localStorage.removeItem('returnToPos');
    window.location.href = '/admin/pages/pos.html';
  };
}

// Initialize the application
async function initializeApp() {
  console.log('🚀 Initializing PetVerse Inventory Management...');
  
  // Initialize Supabase
  const supabaseReady = await initializeSupabase();
  
  // Load inventory data
  await loadInventoryFromSupabase();
  
  // Set up event handlers
  initializeEventHandlers();
  
  // Render initial inventory
  renderInventory();
  
  console.log('✅ PetVerse Inventory Management initialized successfully!');
  showMessage('🐾 Inventory management ready!', 'success');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Make functions globally available
window.deleteProduct = deleteProduct;
window.loadProduct = loadProduct;
