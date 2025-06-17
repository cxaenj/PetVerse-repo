// Enhanced Inventory Management with Improved Error Handling
// PetVerse Inventory System - Test Version (No Login Required)

// Supabase configuration
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Initialize Supabase client
let supabase = null;
let inventory = [];
let useSupabase = false;

// Global variables for DOM elements (will be initialized when DOM loads)
let previewImage, placeholderText, form, uploadBtn, productImage;

// Initialize Supabase connection with enhanced error handling
async function initializeSupabase() {
  try {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client initialized');
      
      // Test connection and table access
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('⚠️ Supabase table access failed:', error.message);
        console.warn('📦 Using localStorage fallback mode');
        useSupabase = false;
        showMessage('⚠️ Database unavailable, using local storage', 'warning');
        return false;
      } else {
        console.log('✅ Supabase connection and table access verified');
        useSupabase = true;
        showMessage('✅ Connected to database', 'success');
        return true;
      }
    } else {
      console.warn('⚠️ Supabase library not loaded');
      useSupabase = false;
      showMessage('⚠️ Database library not loaded, using local storage', 'warning');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    useSupabase = false;
    showMessage('⚠️ Database connection failed, using local storage', 'warning');
    return false;
  }
}

// Load inventory with improved error handling
async function loadInventoryFromSupabase() {
  try {
    // Always load from localStorage first as fallback
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    
    if (!useSupabase || !supabase) {
      console.log('📦 Loading from localStorage only');
      return inventory;
    }

    console.log('🔄 Loading inventory from Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error loading from Supabase:', error);
      console.log('📦 Using localStorage data as fallback');
      showMessage('⚠️ Database error, using local data', 'warning');
      return inventory;
    }

    // Transform Supabase data to match UI format
    const supabaseInventory = data.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      qty: parseInt(product.stock_quantity) || 0,
      category: product.category || 'General',
      image: product.image_url || '',
      description: product.description || ''
    }));

    console.log(`✅ Loaded ${supabaseInventory.length} products from Supabase`);
    
    // Merge with localStorage data (prioritize Supabase)
    inventory = supabaseInventory;
    
    // Update localStorage backup
    localStorage.setItem('inventory', JSON.stringify(inventory));
    showMessage(`✅ Loaded ${inventory.length} products from database`, 'success');
    
    return inventory;

  } catch (error) {
    console.error('❌ Failed to load from Supabase:', error);
    console.log('📦 Using localStorage fallback');
    showMessage('⚠️ Database unavailable, using local data', 'warning');
    return inventory;
  }
}

// Save product with enhanced error handling
async function saveProductToSupabase(productData) {
  // Always save to localStorage first
  saveToLocalStorageFallback(productData);
  
  if (!useSupabase || !supabase) {
    console.log('💾 Saved to localStorage (database not available)');
    showMessage('💾 Product saved locally', 'info');
    return true;
  }

  try {
    console.log('🔄 Saving product to Supabase...', productData);

    // Prepare data for Supabase (working with existing table structure)
    const supabaseData = {
      name: productData.name,
      price: productData.price,
      stock_quantity: productData.qty,
      is_active: true
    };
    
    // Add optional fields that likely exist in the table
    if (productData.description) {
      supabaseData.description = productData.description;
    }
    if (productData.image) {
      supabaseData.image_url = productData.image;
    }
    if (productData.category) {
      supabaseData.category = productData.category;
    }

    let result;
    if (productData.id && !productData.id.startsWith('temp_')) {
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
      console.error('🔍 Error details:', JSON.stringify(result.error, null, 2));
      
      // Check if it's a schema issue and retry with minimal data
      if (result.error.message.includes('column') || result.error.message.includes('violates')) {
        console.log('🔄 Retrying with minimal data...');
        const minimalData = {
          name: productData.name,
          price: productData.price,
          stock_quantity: productData.qty,
          is_active: true
        };
        
        const { data: retryData, error: retryError } = await supabase
          .from('products')
          .insert([minimalData])
          .select();
        
        if (retryError) {
          console.error('❌ Retry failed:', retryError);
          showMessage(`❌ Database save failed: ${retryError.message}`, 'error');
          return false;
        } else {
          console.log('✅ Minimal data save successful');
          showMessage('✅ Product saved to database (basic info)', 'success');
          return true;
        }
      } else {
        showMessage(`❌ Database save failed: ${result.error.message}`, 'error');
        return false;
      }
    }

    console.log('✅ Product saved to Supabase successfully');
    showMessage('✅ Product saved to database successfully!', 'success');
    
    return true;

  } catch (error) {
    console.error('❌ Save operation failed:', error);
    showMessage(`❌ Database error: ${error.message}`, 'error');
    return false;
  }
}

// Enhanced localStorage fallback
function saveToLocalStorageFallback(productData) {
  try {
    let localInventory = JSON.parse(localStorage.getItem('inventory')) || [];
    
    if (productData.index !== undefined && productData.index >= 0) {
      // Update existing product
      localInventory[productData.index] = productData;
      console.log('💾 Updated product in localStorage');
    } else {
      // Add new product with temporary ID
      productData.id = 'temp_' + Date.now();
      localInventory.push(productData);
      console.log('💾 Added new product to localStorage');
    }
    
    localStorage.setItem('inventory', JSON.stringify(localInventory));
    inventory = localInventory;
    return true;
  } catch (error) {
    console.error('❌ localStorage save failed:', error);
    return false;
  }
}

// Delete product with enhanced error handling
async function deleteProductFromSupabase(productId, index) {
  // Always remove from localStorage
  let localInventory = JSON.parse(localStorage.getItem('inventory')) || [];
  if (index >= 0 && index < localInventory.length) {
    localInventory.splice(index, 1);
    localStorage.setItem('inventory', JSON.stringify(localInventory));
    inventory = localInventory;
  }
  
  if (!useSupabase || !supabase) {
    console.log('🗑️ Removed from localStorage (database not available)');
    showMessage('🗑️ Product removed locally', 'info');
    return true;
  }

  try {
    console.log('🔄 Deleting from Supabase...', productId);

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (error) {
      console.error('❌ Error deleting from Supabase:', error);
      showMessage(`❌ Database delete failed: ${error.message}`, 'error');
      return false;
    }

    console.log('✅ Product deleted from Supabase successfully');
    showMessage('✅ Product deleted from database!', 'success');
    return true;

  } catch (error) {
    console.error('❌ Delete operation failed:', error);
    showMessage(`❌ Database error: ${error.message}`, 'error');
    return false;
  }
}

// Show user messages with enhanced styling
function showMessage(message, type = 'info') {
  const alertClass = {
    success: 'bg-green-100 border-green-500 text-green-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  const alert = document.createElement('div');
  alert.className = `fixed top-4 right-4 border-l-4 p-4 rounded shadow-lg z-50 max-w-sm ${alertClass[type]}`;
  alert.innerHTML = `
    <div class="flex justify-between items-start">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg leading-none">&times;</button>
    </div>
  `;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 5000);
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

// Load product for editing
function loadProduct(index) {
  const product = inventory[index];
  if (!product) return;

  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description || '';
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-qty').value = product.qty;
  document.getElementById('product-category').value = product.category || 'General';
  document.getElementById('product-index').value = index;

  if (product.image) {
    previewImage.src = product.image;
    previewImage.classList.remove('hidden');
    placeholderText.classList.add('hidden');
  }

  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
}

// Delete product
async function deleteProduct(index) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  showMessage('🔄 Deleting product...', 'info');
  
  const product = inventory[index];
  const success = await deleteProductFromSupabase(product.id, index);
  
  if (success) {
    renderInventory();
  }
}

// Handle form submission
async function handleFormSubmit(e) {
  e.preventDefault();
  
  console.log('🔄 Form submitted, processing...');
  
  const name = document.getElementById('product-name').value.trim();
  const description = document.getElementById('product-description').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const qty = parseInt(document.getElementById('product-qty').value);
  const category = document.getElementById('product-category').value;
  const index = document.getElementById('product-index').value;
  
  console.log('📦 Form data:', { name, description, price, qty, category, index });
  
  // Validation
  if (!name || !price || qty < 0) {
    showMessage('❌ Please fill in all required fields correctly', 'error');
    return;
  }
  
  if (price <= 0) {
    showMessage('❌ Price must be greater than 0', 'error');
    return;
  }
  
  if (qty < 0) {
    showMessage('❌ Quantity cannot be negative', 'error');
    return;
  }
  
  const productData = {
    name,
    description,
    price,
    qty,
    category,
    image: previewImage.src !== 'data:,' ? previewImage.src : '',
    index: index !== '' ? parseInt(index) : undefined
  };
  
  if (index !== '' && inventory[parseInt(index)]) {
    productData.id = inventory[parseInt(index)].id;
  }
  
  showMessage('🔄 Saving product...', 'info');
  
  const success = await saveProductToSupabase(productData);
  
  if (success) {
    // Reload inventory to get latest data
    await loadInventoryFromSupabase();
    renderInventory();
    
    // Reset form
    form.reset();
    document.getElementById('product-index').value = '';
    previewImage.src = 'data:,';
    previewImage.classList.add('hidden');
    placeholderText.classList.remove('hidden');
    
    showMessage('✅ Product saved successfully!', 'success');
  }
}

// Handle image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    showMessage('❌ Please select a valid image file', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    showMessage('❌ Image size should be less than 5MB', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (event) => {
    previewImage.src = event.target.result;
    previewImage.classList.remove('hidden');
    placeholderText.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🐾 Initializing PetVerse Inventory System (Test Version)...');
  
  // Initialize DOM elements
  previewImage = document.getElementById('preview-image');
  placeholderText = document.getElementById('placeholder-text');
  form = document.getElementById('product-form');
  uploadBtn = document.getElementById('upload-btn');
  productImage = document.getElementById('product-image');
  
  // Initialize Supabase
  await initializeSupabase();
  
  // Load inventory
  await loadInventoryFromSupabase();
  
  // Render initial inventory
  renderInventory();
  
  // Set up event listeners
  if (form) {
    console.log('✅ Form found, adding submit event listener');
    form.addEventListener('submit', handleFormSubmit);
  } else {
    console.error('❌ Form not found! Check if product-form element exists');
  }
  
  if (uploadBtn) {
    console.log('✅ Upload button found, adding click event listener');
    uploadBtn.addEventListener('click', () => productImage.click());
  } else {
    console.error('❌ Upload button not found!');
  }
  
  if (productImage) {
    console.log('✅ Product image input found, adding change event listener');
    productImage.addEventListener('change', handleImageUpload);
  } else {
    console.error('❌ Product image input not found!');
  }
  
  // Handle edit from POS system
  const editIndex = localStorage.getItem('editProductIndex');
  if (editIndex !== null) {
    loadProduct(parseInt(editIndex));
    localStorage.removeItem('editProductIndex');
  }
  
  showMessage('🐾 Inventory system ready!', 'success');
  console.log('✅ PetVerse Inventory System initialized successfully');
});
