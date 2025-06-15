/// FILE: /assets/js/pos.js
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const main = document.getElementById('main-content');
  const toggleBtn = document.getElementById('menu-toggle');

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
  const inventory = JSON.parse(localStorage.getItem('inventory')) || [];

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
          <button data-index="${i}" class="text-gray-500 hover:text-gray-700 decrement-item">−</button>
          <span class="w-8 text-center">${item.qty}</span>
          <button data-index="${i}" class="text-red-500 hover:text-red-700 remove-item">×</button>
        </div>
      `;
      cartList.appendChild(li);
    });

    totalDisplay.textContent = subtotal.toFixed(2);
    applyDiscount();
    checkoutBtn.disabled = cart.length === 0;
    if (cart.length > 0) checkoutBtn.classList.remove('hidden');
  }

  function applyDiscount() {
    const subtotal = parseFloat(totalDisplay.textContent);
    let discount = 0;
    const type = discountType.value;

    if (type === 'pwd') {
      discount = subtotal * 0.2;
    } else if (type === 'manual') {
      discount = parseFloat(discountInput.value) || 0;
    }

    discountValDisplay.textContent = discount.toFixed(2);
    totalFinal.textContent = (subtotal - discount).toFixed(2);
  }

  productList.addEventListener('click', (e) => {
    const button = e.target.closest('.add-to-cart');
    if (button) {
      const index = button.dataset.index;
      const product = inventory[index];
      const quantityInput = button.parentElement.querySelector('.quantity-input');
      const quantity = parseInt(quantityInput.value) || 1;

      if (product.qty >= quantity) {
        const existing = cart.find(item => item.name === product.name);
        if (existing) {
          existing.qty += quantity;
        } else {
          cart.push({ 
            name: product.name, 
            price: product.price, 
            qty: quantity,
            image: product.image || 'https://placehold.co/200x200/png?text=Product+Image'
          });
        }
        inventory[index].qty -= quantity;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        renderProducts(document.getElementById('search-input')?.value || '');
        renderCart();
      }
    }

    const editButton = e.target.closest('.edit-item');
    if (editButton) {
      const index = editButton.dataset.index;
      localStorage.setItem('editIndex', index);
      localStorage.setItem('returnToPos', 'true'); // Add flag to return to POS
      window.location.href = '/pages/inventory.html';
    }
  });

  cartList.addEventListener('click', (e) => {
    const index = e.target.dataset.index;
    const item = cart[index];
    const inventoryIndex = inventory.findIndex(p => p.name === item.name);

    if (e.target.classList.contains('remove-item')) {
      if (inventoryIndex > -1) {
        inventory[inventoryIndex].qty += item.qty;
        localStorage.setItem('inventory', JSON.stringify(inventory));
      }
      cart.splice(index, 1);
      renderProducts(document.getElementById('search-input')?.value || '');
      renderCart();
    }

    if (e.target.classList.contains('decrement-item')) {
      if (item.qty > 1) {
        item.qty--;
        inventory[inventoryIndex].qty++;
      } else {
        cart.splice(index, 1);
        inventory[inventoryIndex].qty++;
      }
      localStorage.setItem('inventory', JSON.stringify(inventory));
      renderProducts(document.getElementById('search-input')?.value || '');
      renderCart();
    }
  });

  discountInput.addEventListener('input', applyDiscount);
  discountType.addEventListener('change', applyDiscount);

  // Add quantity input validation
  productList.addEventListener('input', (e) => {
    if (e.target.classList.contains('quantity-input')) {
      const input = e.target;
      const max = parseInt(input.getAttribute('max'));
      let value = parseInt(input.value) || 1;
      
      // Ensure value is between 1 and max stock
      value = Math.max(1, Math.min(value, max));
      input.value = value;
    }
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderProducts(e.target.value);
    });
  }

  // Append checkout success modal once
  const successModal = document.createElement('div');
  successModal.id = 'success-modal';
  successModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
  successModal.innerHTML = `
    <div class="bg-white p-10 rounded-xl shadow-xl text-center animate-bounce-in">
      <div class="text-green-500 text-6xl mb-4">✔️</div>
      <h2 class="text-xl font-semibold text-gray-800">Checkout Complete!</h2>
    </div>
  `;
  document.body.appendChild(successModal);

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      // Save transaction to local storage
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const transaction = {
        id: Date.now(),
        date: new Date().toISOString(),
        items: cart,
        subtotal: parseFloat(totalDisplay.textContent),
        discount: parseFloat(discountValDisplay.textContent),
        total: parseFloat(totalFinal.textContent),
        paymentMethod: document.getElementById('payment-method').value,
        discountType: discountType.value
      };
      transactions.push(transaction);
      localStorage.setItem('transactions', JSON.stringify(transactions));

      // Update inventory in local storage (already done during cart operations)

      // Show success modal
      const modal = document.getElementById('success-modal');
      modal.classList.remove('hidden');
      
      // Reset cart and UI
      cart = [];
      renderCart();
      renderProducts();

      // Hide modal after 2 seconds
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 2000);
    });
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;

      const sales = JSON.parse(localStorage.getItem('sales')) || [];
      const date = new Date().toISOString();
      const total = parseFloat(totalFinal.textContent);

      sales.push({ items: [...cart], total, date });
      localStorage.setItem('sales', JSON.stringify(sales));
      cart = [];
      renderCart();

      // Show modal
      successModal.classList.remove('hidden');
      setTimeout(() => {
        successModal.classList.add('hidden');
      }, 2000);
    });
  }

  renderProducts();
  renderCart();
});
