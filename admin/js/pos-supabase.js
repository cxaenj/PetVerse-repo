// POS System with Supabase Integration
// PetVerse Point of Sale System

// Supabase configuration
const supabaseUrl = 'https://odjigifmwsdcnfjskanm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlnaWZtd3NkY25manNrYW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTAwNTEsImV4cCI6MjA2NTcyNjA1MX0.VfLHy0lLH7pU6-pOvVi8-nmH1m1rLKtKL0HRfrnrboA'

// Initialize Supabase client
let supabase = null;
let inventory = [];

// Initialize Supabase connection
async function initializeSupabase() {
  try {
    if (typeof window.supabase !== 'undefined') {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase initialized for POS system');
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
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error loading inventory from Supabase:', error);
      // Fallback to localStorage
      inventory = JSON.parse(localStorage.getItem('inventory')) || [];
      return inventory;
    }

    // Transform Supabase data to match the expected format
    inventory = data.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      qty: parseInt(product.stock_quantity),
      category: product.category,
      image: product.image_url,
      description: product.description
    }));

    console.log(`✅ Loaded ${inventory.length} products from Supabase`);
    
    // Update localStorage as backup
    localStorage.setItem('inventory', JSON.stringify(inventory));
    return inventory;

  } catch (error) {
    console.error('❌ Failed to load inventory from Supabase:', error);
    // Fallback to localStorage
    inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    return inventory;
  }
}

// Update product stock in Supabase
async function updateProductStockInSupabase(productId, newStock) {
  try {
    if (!supabase) {
      console.log('📦 Updating stock in localStorage (Supabase not available)');
      // Update localStorage
      const localInventory = JSON.parse(localStorage.getItem('inventory')) || [];
      const productIndex = localInventory.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        localInventory[productIndex].qty = newStock;
        localStorage.setItem('inventory', JSON.stringify(localInventory));
      }
      return true;
    }

    console.log(`🔄 Updating stock for product ${productId} to ${newStock}...`);
    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId);

    if (error) {
      console.error('❌ Error updating stock in Supabase:', error);
      return false;
    }

    console.log(`✅ Stock updated successfully for product ${productId}`);
    
    // Update local inventory as well
    const productIndex = inventory.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      inventory[productIndex].qty = newStock;
      localStorage.setItem('inventory', JSON.stringify(inventory));
    }
    
    return true;

  } catch (error) {
    console.error('❌ Failed to update stock in Supabase:', error);
    return false;
  }
}

// Function to record a sale in Supabase
async function recordSaleInSupabase(saleDetails) {
  if (!supabase) {
    console.log('📦 Recording sale in localStorage (Supabase not available)');
    // Optionally, save sales to localStorage as a fallback
    let localSales = JSON.parse(localStorage.getItem('sales')) || [];
    localSales.push({ ...saleDetails, id: Date.now().toString() }); // Simple ID for local
    localStorage.setItem('sales', JSON.stringify(localSales));
    return true;
  }

  try {
    console.log('🔄 Recording sale in Supabase...', saleDetails);
    const { data, error } = await supabase
      .from('sales')
      .insert([saleDetails]);

    if (error) {
      console.error('❌ Error recording sale in Supabase:', error);
      return false;
    }

    console.log('✅ Sale recorded successfully in Supabase:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to record sale:', error);
    return false;
  }
}

window.addEventListener('load', async () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main-content');
  const toggleBtn = document.getElementById('menu-toggle');

  // Initialize Supabase and load inventory
  await initializeSupabase();
  await loadInventoryFromSupabase();

  loader.classList.add('fade-out');
  setTimeout(() => {
    loader.style.display = 'none';
    main.classList.remove('opacity-0');
    toggleBtn.classList.remove('hidden');
  }, 1000);

  const sidebar = document.getElementById('sidebar');
  toggleBtn.addEventListener('click', () => {
    const isOpen = !sidebar.classList.contains('-translate-x-full');
    sidebar.classList.toggle('-translate-x-full');
    toggleBtn.classList.add('hidden-menu');
    setTimeout(() => {
      if (isOpen) toggleBtn.classList.remove('hidden-menu');
    }, 300);
  });

  const productList = document.getElementById('product-list');
  const cartList = document.getElementById('cart-list');
  const totalDisplay = document.getElementById('total');
  const totalFinal = document.getElementById('total-final');
  const discountInput = document.getElementById('discount');
  const discountValDisplay = document.getElementById('discount-val');
  const discountType = document.getElementById('discount-type');
  const checkoutBtn = document.getElementById('checkout-btn');

  let cart = [];

  function renderProducts(search = '') {
    productList.innerHTML = '';
    let found = false;
    inventory.forEach((item, index) => {
      if (!item.name.toLowerCase().includes(search.toLowerCase())) return;
      found = true;
      const div = document.createElement('div');
      div.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow';
      div.innerHTML = `
        <div class="h-48 overflow-hidden bg-gray-100">
          <img src="${item.image || 'https://placehold.co/200x200/png?text=Product+Image'}" 
               alt="${item.name}" 
               class="w-full h-full object-cover">
        </div>
        <div class="p-4">
          <h3 class="text-lg font-bold mb-2">${item.name}</h3>
          <p class="text-emerald-600 font-semibold mb-2">₱${item.price.toFixed(2)}</p>
          <p class="text-sm text-gray-600 mb-3">Stock: ${item.qty}</p>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <input type="number" 
                     min="1" 
                     max="${item.qty}" 
                     value="1" 
                     class="w-20 px-2 py-1 border rounded-lg text-center quantity-input ${item.qty === 0 ? 'opacity-50' : ''}"
                     data-index="${index}"
                     ${item.qty === 0 ? 'disabled' : ''}
              >
              <button data-index="${index}" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors add-to-cart ${item.qty === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${item.qty === 0 ? 'disabled' : ''}>
                ${item.qty === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
            <button data-index="${index}" class="w-full bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-2 rounded-lg edit-item flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Edit Product</span>
            </button>
          </div>
        </div>
      `;
      productList.appendChild(div);
    });
    if (!found) {
      productList.innerHTML = '<p class="text-gray-500 text-center">No results found.</p>';
    }
  }

  function renderCart() {
    cartList.innerHTML = '';
    let subtotal = 0;
    cart.forEach((item, i) => {
      subtotal += item.price * item.qty;
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center py-2 border-b';
      li.innerHTML = `
        <div class="flex items-center space-x-4">
          <img src="${item.image || 'https://placehold.co/200x200/png?text=Product+Image'}" 
               alt="${item.name}" 
               class="w-12 h-12 object-cover rounded">
          <div>
            <h4 class="font-medium">${item.name}</h4>
            <p class="text-sm text-gray-600">₱${item.price.toFixed(2)} × ${item.qty}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button data-index="${i}" class="decrease-qty bg-red-500 text-white px-2 py-1 rounded">-</button>
          <span class="w-8 text-center">${item.qty}</span>
          <button data-index="${i}" class="increase-qty bg-blue-500 text-white px-2 py-1 rounded">+</button>
          <button data-index="${i}" class="remove-item bg-red-600 text-white px-2 py-1 rounded ml-2">×</button>
        </div>
      `;
      cartList.appendChild(li);
    });

    totalDisplay.textContent = subtotal.toFixed(2);
    updateDiscountedTotal();
    checkoutBtn.disabled = cart.length === 0;
  }

  function updateDiscountedTotal() {
    const subtotal = parseFloat(totalDisplay.textContent);
    const discountValue = parseFloat(discountInput.value) || 0;
    const isPercentage = discountType.value === 'percentage';
    
    let discountAmount = 0;
    if (discountType.value === 'none') {
      discountAmount = 0;
    } else if (isPercentage) {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    
    discountAmount = Math.min(discountAmount, subtotal);
    discountValDisplay.textContent = discountAmount.toFixed(2);
    
    const finalTotal = subtotal - discountAmount;
    totalFinal.textContent = finalTotal.toFixed(2);
  }

  // Event listeners
  productList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-to-cart')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      const item = inventory[index];
      const quantityInput = document.querySelector(`.quantity-input[data-index="${index}"]`);
      const quantity = parseInt(quantityInput.value);
      
      if (quantity > item.qty) {
        alert('Not enough stock available!');
        return;
      }
      
      const existingIndex = cart.findIndex(c => c.name === item.name);
      if (existingIndex >= 0) {
        cart[existingIndex].qty += quantity;
      } else {
        cart.push({ ...item, qty: quantity });
      }
      
      renderCart();
    }
    
    if (e.target.classList.contains('edit-item')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      localStorage.setItem('editProductIndex', index);
      window.location.href = '/landing/pages/inventory.html';
    }
  });

  cartList.addEventListener('click', (e) => {
    const index = parseInt(e.target.getAttribute('data-index'));
    
    if (e.target.classList.contains('increase-qty')) {
      const item = cart[index];
      const inventoryItem = inventory.find(inv => inv.name === item.name);
      const currentCartQty = cart.reduce((total, cartItem) => {
        return cartItem.name === item.name ? total + cartItem.qty : total;
      }, 0);
      
      if (currentCartQty < inventoryItem.qty) {
        cart[index].qty++;
        renderCart();
      } else {
        alert('Cannot exceed available stock!');
      }
    }
    
    if (e.target.classList.contains('decrease-qty')) {
      if (cart[index].qty > 1) {
        cart[index].qty--;
      } else {
        cart.splice(index, 1);
      }
      renderCart();
    }
    
    if (e.target.classList.contains('remove-item')) {
      cart.splice(index, 1);
      renderCart();
    }
  });

  discountInput.addEventListener('input', updateDiscountedTotal);
  discountType.addEventListener('change', updateDiscountedTotal);

  checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) return;
    
    const confirmation = confirm('Proceed with checkout?');
    if (!confirmation) return;
    
    let allInventoryUpdatesSuccessful = true;
    
    // Update inventory stock for each item in cart
    for (const cartItem of cart) {
      const inventoryIndex = inventory.findIndex(inv => inv.name === cartItem.name);
      if (inventoryIndex !== -1) {
        const newStock = inventory[inventoryIndex].qty - cartItem.qty;
        
        // Update in Supabase
        const updateSuccess = await updateProductStockInSupabase(inventory[inventoryIndex].id, newStock);
        if (!updateSuccess) {
          allInventoryUpdatesSuccessful = false;
          console.error(`Failed to update stock for ${cartItem.name}`);
        } else {
          // Update local inventory
          inventory[inventoryIndex].qty = newStock;
        }
      }
    }
    
    let saleRecordedSuccessfully = false;
    if (allInventoryUpdatesSuccessful) {
      // Prepare sale details
      const saleDetails = {
        items: cart.map(item => ({
          product_id: item.id, // Assuming item.id is the product's unique ID
          name: item.name,
          quantity: item.qty,
          price_at_sale: item.price 
        })),
        subtotal: parseFloat(totalDisplay.textContent),
        discount_applied: parseFloat(discountValDisplay.textContent) || 0,
        final_total: parseFloat(totalFinal.textContent),
        transaction_time: new Date().toISOString()
        // You could add other fields like payment_method, customer_id, etc.
      };

      // Record the sale
      saleRecordedSuccessfully = await recordSaleInSupabase(saleDetails);
    }
    
    if (allInventoryUpdatesSuccessful && saleRecordedSuccessfully) {
      alert('Checkout successful! Inventory updated and sale recorded.');
      console.log('✅ All inventory updates and sale recording completed successfully');
    } else if (allInventoryUpdatesSuccessful && !saleRecordedSuccessfully) {
      alert('Checkout successful and inventory updated, but failed to record the sale. Please check console.');
      console.warn('⚠️ Sale recording failed after successful inventory update.');
    } else if (!allInventoryUpdatesSuccessful && saleRecordedSuccessfully) {
      // This case is less likely if sale recording depends on successful inventory update logic,
      // but included for completeness.
      alert('Sale recorded, but some inventory updates may have failed. Please check the console.');
      console.warn('⚠️ Some inventory updates failed, but sale was recorded.');
    } else { // !allInventoryUpdatesSuccessful && !saleRecordedSuccessfully
      alert('Checkout completed, but some inventory updates and sale recording may have failed. Please check the console.');
      console.warn('⚠️ Some inventory updates and sale recording failed during checkout');
    }
    
    // Clear cart and refresh display
    cart = [];
    renderCart();
    renderProducts();
  });

  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    renderProducts(e.target.value);
  });

  // Initial render
  renderProducts();
  renderCart();
});
