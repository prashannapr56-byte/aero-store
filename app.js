// Aero Premium E-Commerce Application State & Logic

// State Management
let cart = [];
let wishlist = [];
let activeCategory = 'all';
let maxPrice = 2500;
let minRating = 'all';
let searchQuery = '';
let inStockOnly = false;
let currentSort = 'popularity';
let appliedPromo = null;
let currentCheckoutStep = 1;

// Promo Codes Database
const PROMO_CODES = {
  'AERO20': 0.20, // 20% Off
  'FIFTY': 0.50,   // 50% Off (for testing)
  'LAUNCH10': 0.10 // 10% Off
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDropdowns();
  initCartDrawer();
  initProductModal();
  initFilters();
  initCheckoutWizard();
  
  // Render Initial Product Catalog
  renderProducts();
  updateCartUI();
});

/* ==========================================
   THEME TOGGLER (DARK / LIGHT)
   ========================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    showToast('Theme Updated', `Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

/* ==========================================
   DROPDOWNS & NAVIGATION MENU
   ========================================== */
function initDropdowns() {
  const profileBtn = document.getElementById('profile-btn');
  const profileMenu = document.getElementById('profile-menu');

  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    profileMenu.classList.remove('active');
  });
}

/* ==========================================
   CATALOG RENDERING, FILTERING & SORTING
   ========================================== */
function initFilters() {
  // Category sub-nav pills
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      pills.forEach(p => p.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      activeCategory = target.getAttribute('data-category');
      renderProducts();
    });
  });

  // Global search input
  const searchInput = document.getElementById('global-search');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderProducts();
  });

  // Search category selector
  const searchCatSelect = document.getElementById('search-category-filter');
  searchCatSelect.addEventListener('change', (e) => {
    activeCategory = e.target.value;
    
    // Sync category pills selection
    pills.forEach(p => {
      if (p.getAttribute('data-category') === activeCategory) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    
    renderProducts();
  });

  // Price range slider filter
  const priceSlider = document.getElementById('price-slider');
  const priceValLabel = document.getElementById('price-slider-val');
  priceSlider.addEventListener('input', (e) => {
    maxPrice = parseInt(e.target.value);
    priceValLabel.textContent = `$${maxPrice}`;
    renderProducts();
  });

  // Star ratings filter radios
  const ratingRadios = document.querySelectorAll('input[name="rating-filter"]');
  ratingRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      minRating = e.target.value === 'all' ? 'all' : parseFloat(e.target.value);
      renderProducts();
    });
  });

  // Availability checkbox
  const inStockCheckbox = document.getElementById('in-stock-only');
  inStockCheckbox.addEventListener('change', (e) => {
    inStockOnly = e.target.checked;
    renderProducts();
  });

  // Sorting dropdown
  const sortSelect = document.getElementById('catalog-sort');
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderProducts();
  });

  // Clear filters button
  const clearBtn = document.getElementById('clear-filters-btn');
  clearBtn.addEventListener('click', () => {
    resetAllFilters();
  });
}

function resetAllFilters() {
  activeCategory = 'all';
  maxPrice = 2500;
  minRating = 'all';
  searchQuery = '';
  inStockOnly = false;
  currentSort = 'popularity';
  
  // Sync UI components
  document.getElementById('global-search').value = '';
  document.getElementById('search-category-filter').value = 'all';
  
  const priceSlider = document.getElementById('price-slider');
  priceSlider.value = 2500;
  document.getElementById('price-slider-val').textContent = '$2500';
  
  document.querySelector('input[name="rating-filter"][value="all"]').checked = true;
  document.getElementById('in-stock-only').checked = false;
  document.getElementById('catalog-sort').value = 'popularity';
  
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-category') === 'all') {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderProducts();
  showToast('Filters Reset', 'All filter constraints have been cleared.', 'info');
}

function scrollToCatalog() {
  document.getElementById('catalog-anchor').scrollIntoView({ behavior: 'smooth' });
}

// Main render function for products
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countText = document.getElementById('items-found-text');
  const emptyState = document.getElementById('empty-state-view');
  
  // 1. Filter products
  let filtered = products.filter(product => {
    // Category filter
    if (activeCategory !== 'all' && product.category !== activeCategory) {
      return false;
    }
    // Search query filter
    if (searchQuery !== '' && !product.name.toLowerCase().includes(searchQuery) && !product.description.toLowerCase().includes(searchQuery)) {
      return false;
    }
    // Price range filter
    if (product.price > maxPrice) {
      return false;
    }
    // Rating filter
    if (minRating !== 'all' && product.rating < minRating) {
      return false;
    }
    return true;
  });

  // 2. Sort products
  if (currentSort === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else {
    // Default popularity: sort by rating & reviews volume
    filtered.sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
  }

  // 3. Update count label
  countText.textContent = `Showing ${filtered.length} product${filtered.length === 1 ? '' : 's'}`;

  // 4. Check empty state
  if (filtered.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  } else {
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
  }

  // 5. Generate cards HTML
  grid.innerHTML = filtered.map(product => {
    const isWished = wishlist.includes(product.id);
    const starHTML = generateStarRating(product.rating);
    
    return `
      <article class="product-card">
        <!-- Wishlist Button -->
        <button class="wishlist-heart-btn ${isWished ? 'liked' : ''}" 
                onclick="toggleWishlist(${product.id}, event)" 
                aria-label="Add to wishlist">
          <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>

        <!-- Floating Badge -->
        ${product.badge ? `<span class="product-card-badge">${product.badge}</span>` : ''}

        <!-- Product Image -->
        <div class="product-img-container" onclick="quickViewProduct(${product.id})">
          <img src="${product.image}" alt="${product.name}" class="product-card-img" onerror="this.src='https://placehold.co/400x400/171f30/ffffff?text=${encodeURIComponent(product.name)}'">
          <div class="quick-view-overlay">
            <button class="btn btn-secondary btn-sm" onclick="quickViewProduct(${product.id})">
              <i class="fa-regular fa-eye"></i> Quick View
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="product-card-details">
          <span class="product-card-category">${product.category}</span>
          <h3 class="product-card-title" onclick="quickViewProduct(${product.id})">${product.name}</h3>
          
          <div class="product-card-rating">
            <span class="rating-stars">${starHTML}</span>
            <span class="review-count">(${product.reviews.toLocaleString()})</span>
          </div>

          <div class="product-card-footer">
            <div class="product-price-block">
              ${product.originalPrice ? `<span class="original-price-strike">$${product.originalPrice}</span>` : ''}
              <span class="current-price">$${product.price}</span>
            </div>
            
            <button class="add-to-cart-card-btn" 
                    onclick="addToCart(${product.id}, 1, '${product.colors[0]}', event)" 
                    aria-label="Add to cart">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  let stars = '';
  for (let i = 0; i < fullStars; i++) stars += '<i class="fa-solid fa-star"></i>';
  if (halfStar) stars += '<i class="fa-solid fa-star-half-stroke"></i>';
  for (let i = 0; i < emptyStars; i++) stars += '<i class="fa-regular fa-star"></i>';
  
  return stars;
}

/* ==========================================
   WISHLIST LOGIC
   ========================================== */
function toggleWishlist(productId, e) {
  if (e) e.stopPropagation();
  const index = wishlist.indexOf(productId);
  const item = products.find(p => p.id === productId);

  if (index > -1) {
    wishlist.splice(index, 1);
    showToast('Removed from Wishlist', `${item.name} removed.`, 'info');
  } else {
    wishlist.push(productId);
    showToast('Added to Wishlist', `${item.name} added.`, 'success');
  }
  
  // Update wishlist icon counters
  const wishlistBtn = document.getElementById('wishlist-btn');
  const wishlistCount = document.getElementById('wishlist-count');
  wishlistCount.textContent = wishlist.length;
  
  if (wishlist.length > 0) {
    wishlistBtn.querySelector('i').className = 'fa-solid fa-heart text-red';
  } else {
    wishlistBtn.querySelector('i').className = 'fa-regular fa-heart';
  }

  renderProducts();
}

/* ==========================================
   SHOPPING CART LOGIC & DRAWER
   ========================================== */
function initCartDrawer() {
  const cartBtn = document.getElementById('cart-btn');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const overlay = document.getElementById('cart-drawer-overlay');
  const proceedBtn = document.getElementById('proceed-to-checkout-btn');

  const openDrawer = () => {
    cartDrawer.classList.add('active');
    overlay.classList.add('active');
  };
  const closeDrawer = () => {
    cartDrawer.classList.remove('active');
    overlay.classList.remove('active');
  };

  cartBtn.addEventListener('click', openDrawer);
  cartCloseBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Promo code trigger
  document.getElementById('apply-promo-btn').addEventListener('click', applyPromoCode);

  // Checkout trigger
  proceedBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Empty Cart', 'Please add some products to checkout.', 'info');
      return;
    }
    closeDrawer();
    openCheckoutWizard();
  });
}

function addToCart(productId, quantity = 1, color = null, e) {
  if (e) e.stopPropagation();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Set default color if none provided
  const selectedColor = color || product.colors[0];

  // Check if item with exact color exists in cart
  const cartItem = cart.find(item => item.product.id === productId && item.color === selectedColor);

  if (cartItem) {
    cartItem.quantity += quantity;
  } else {
    cart.push({
      product,
      quantity,
      color: selectedColor
    });
  }

  updateCartUI();
  showToast('Item Added', `${product.name} has been added to your cart.`, 'success');
}

function updateCartItemQty(productId, color, offset) {
  const cartItemIndex = cart.findIndex(item => item.product.id === productId && item.color === color);
  if (cartItemIndex === -1) return;

  const item = cart[cartItemIndex];
  item.quantity += offset;

  if (item.quantity <= 0) {
    cart.splice(cartItemIndex, 1);
    showToast('Item Removed', `${item.product.name} removed from cart.`, 'info');
  }

  updateCartUI();
}

function removeCartItem(productId, color) {
  const index = cart.findIndex(item => item.product.id === productId && item.color === color);
  if (index > -1) {
    const item = cart[index];
    cart.splice(index, 1);
    showToast('Item Removed', `${item.product.name} removed.`, 'info');
    updateCartUI();
  }
}

function applyPromoCode() {
  const input = document.getElementById('promo-code-input');
  const feedback = document.getElementById('promo-feedback');
  const code = input.value.trim().toUpperCase();

  if (code === '') {
    feedback.textContent = 'Please enter a code';
    feedback.className = 'promo-feedback error';
    return;
  }

  if (PROMO_CODES[code] !== undefined) {
    appliedPromo = {
      code,
      discount: PROMO_CODES[code]
    };
    feedback.textContent = `Promo code "${code}" applied: ${(PROMO_CODES[code]*100)}% Off!`;
    feedback.className = 'promo-feedback success';
    updateCartUI();
    showToast('Promo Code Applied', `Discount of ${(PROMO_CODES[code]*100)}% has been applied.`, 'success');
  } else {
    feedback.textContent = 'Invalid promo code';
    feedback.className = 'promo-feedback error';
  }
}

function updateCartUI() {
  // Update header cart count
  const cartCount = document.getElementById('cart-count');
  const cartHeaderCount = document.getElementById('cart-header-count');
  const itemsContainer = document.getElementById('cart-items-container');
  
  const totalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  cartCount.textContent = totalItems;
  cartHeaderCount.textContent = `(${totalItems})`;

  // Calculate pricing
  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  let discount = 0;
  if (appliedPromo) {
    discount = subtotal * appliedPromo.discount;
  }
  
  // Free shipping above $150
  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 15;
  const total = subtotal - discount + shipping;

  // Render items list inside drawer
  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-state" style="border: none; background: transparent; padding: 40px 10px;">
        <i class="fa-solid fa-cart-shopping empty-icon"></i>
        <h3>Your cart is empty</h3>
        <p>Browse our collection to add premium products to your cart.</p>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('cart-close-btn').click(); scrollToCatalog()">Start Shopping</button>
      </div>
    `;
  } else {
    itemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img-container">
          <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img" onerror="this.src='https://placehold.co/100x100/171f30/ffffff?text=${encodeURIComponent(item.product.name)}'">
        </div>
        
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.product.name}</h4>
          <div class="cart-item-meta">
            <span>Color:</span>
            <span class="cart-color-dot" style="background-color: ${item.color}"></span>
          </div>
          <span class="cart-item-price">$${(item.product.price * item.quantity).toLocaleString()}</span>
        </div>

        <div class="cart-item-controls">
          <div class="quantity-modifier">
            <button onclick="updateCartItemQty(${item.product.id}, '${item.color}', -1)" aria-label="Decrease quantity">
              <i class="fa-solid fa-minus"></i>
            </button>
            <span>${item.quantity}</span>
            <button onclick="updateCartItemQty(${item.product.id}, '${item.color}', 1)" aria-label="Increase quantity">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
          
          <button class="delete-cart-item-btn" onclick="removeCartItem(${item.product.id}, '${item.color}')" aria-label="Remove item">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Update prices display in drawer
  document.getElementById('summary-subtotal').textContent = `$${subtotal.toLocaleString()}`;
  
  const discountRow = document.getElementById('summary-discount-row');
  if (appliedPromo) {
    discountRow.style.display = 'flex';
    document.getElementById('promo-discount-percent').textContent = `${(appliedPromo.discount * 100)}%`;
    document.getElementById('summary-discount').textContent = `-$${discount.toLocaleString()}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Free' : `$${shipping.toLocaleString()}`;
  document.getElementById('summary-total').textContent = `$${total.toLocaleString()}`;

  // Sync to checkout values
  document.getElementById('review-subtotal').textContent = `$${subtotal.toLocaleString()}`;
  const reviewDiscountRow = document.getElementById('review-discount-row');
  if (appliedPromo) {
    reviewDiscountRow.style.display = 'flex';
    document.getElementById('review-discount').textContent = `-$${discount.toLocaleString()}`;
  } else {
    reviewDiscountRow.style.display = 'none';
  }
  document.getElementById('review-total').textContent = `$${total.toLocaleString()}`;
}

/* ==========================================
   PRODUCT DETAIL MODAL (QUICK VIEW)
   ========================================== */
function initProductModal() {
  const overlay = document.getElementById('product-modal-overlay');
  const closeBtn = document.getElementById('product-modal-close');

  const closeModal = () => {
    overlay.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function quickViewProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const overlay = document.getElementById('product-modal-overlay');
  const content = document.getElementById('product-modal-content');
  
  const starHTML = generateStarRating(product.rating);
  
  content.innerHTML = `
    <div class="modal-product-left">
      <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/500x500/171f30/ffffff?text=${encodeURIComponent(product.name)}'">
    </div>
    
    <div class="modal-product-right">
      ${product.badge ? `<span class="modal-product-badge">${product.badge}</span>` : ''}
      <h2 class="modal-product-title">${product.name}</h2>
      
      <div class="modal-product-rating">
        <span class="stars-gold">${starHTML}</span>
        <span class="review-count">(${product.reviews.toLocaleString()} verified customer reviews)</span>
      </div>

      <div class="modal-product-price-block">
        ${product.originalPrice ? `<span class="modal-price-strike">$${product.originalPrice}</span>` : ''}
        <span class="modal-price-current">$${product.price}</span>
      </div>

      <p class="modal-product-desc">${product.description}</p>

      <div class="modal-product-specs">
        <h4 class="specs-title">Technical Specifications</h4>
        <ul class="specs-list">
          ${product.specs.map(spec => `<li><i class="fa-solid fa-circle-check"></i> ${spec}</li>`).join('')}
        </ul>
      </div>

      <div class="modal-product-colors">
        <h4 class="color-picker-title">Select Color</h4>
        <div class="color-picker-options">
          ${product.colors.map((color, index) => `
            <label class="color-swatch-label">
              <input type="radio" name="modal-color" value="${color}" ${index === 0 ? 'checked' : ''}>
              <span class="color-swatch-dot" style="background-color: ${color}"></span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="modal-product-cta-row">
        <div class="modal-qty-container">
          <button onclick="updateModalQty(-1)" aria-label="Decrease quantity">
            <i class="fa-solid fa-minus"></i>
          </button>
          <span id="modal-qty-val">1</span>
          <button onclick="updateModalQty(1)" aria-label="Increase quantity">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        
        <button class="btn btn-primary" onclick="addModalProductToCart(${product.id})">
          <i class="fa-solid fa-cart-shopping"></i> Add to Shopping Bag
        </button>
      </div>
    </div>
  `;

  overlay.classList.add('active');
}

function updateModalQty(offset) {
  const qtyLabel = document.getElementById('modal-qty-val');
  let currentVal = parseInt(qtyLabel.textContent);
  currentVal += offset;
  if (currentVal < 1) currentVal = 1;
  qtyLabel.textContent = currentVal;
}

function addModalProductToCart(productId) {
  const qty = parseInt(document.getElementById('modal-qty-val').textContent);
  const selectedColor = document.querySelector('input[name="modal-color"]:checked').value;
  
  addToCart(productId, qty, selectedColor);
  document.getElementById('product-modal-close').click();
}

/* ==========================================
   MULTI-STEP CHECKOUT FLOW
   ========================================== */
function initCheckoutWizard() {
  const overlay = document.getElementById('checkout-modal-overlay');
  const closeBtn = document.getElementById('checkout-modal-close');
  const placeOrderBtn = document.getElementById('checkout-place-order-btn');
  const paymentSelectors = document.querySelectorAll('.payment-selector');
  const downloadInvBtn = document.getElementById('download-invoice-btn');

  closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
  });

  // Toggle Visa Card Details vs PayPal
  paymentSelectors.forEach(selector => {
    selector.addEventListener('click', (e) => {
      paymentSelectors.forEach(s => s.classList.remove('active'));
      const label = e.currentTarget;
      label.classList.add('active');
      
      const val = label.querySelector('input').value;
      const ccFields = document.getElementById('credit-card-fields');
      if (val === 'credit-card') {
        ccFields.style.display = 'grid';
      } else {
        ccFields.style.display = 'none';
      }
    });
  });

  // Credit Card Number formatting spacer
  const ccInput = document.getElementById('card-number');
  ccInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }
    e.target.value = formatted.substring(0, 19);
  });

  // Card Expiry Auto slash
  const ccExpiry = document.getElementById('card-expiry');
  ccExpiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length > 2) {
      e.target.value = value.substring(0,2) + '/' + value.substring(2,4);
    } else {
      e.target.value = value;
    }
  });

  placeOrderBtn.addEventListener('click', placeOrder);
  downloadInvBtn.addEventListener('click', downloadInvoice);
}

function openCheckoutWizard() {
  currentCheckoutStep = 1;
  document.getElementById('checkout-modal-overlay').classList.add('active');
  goToStep(1);
}

function goToStep(step) {
  // Validate forms before going to next steps
  if (step === 2 && currentCheckoutStep === 1) {
    const fn = document.getElementById('shipping-firstname').value.trim();
    const ln = document.getElementById('shipping-lastname').value.trim();
    const email = document.getElementById('shipping-email').value.trim();
    const address = document.getElementById('shipping-address').value.trim();
    const city = document.getElementById('shipping-city').value.trim();
    const state = document.getElementById('shipping-state').value.trim();
    const zip = document.getElementById('shipping-zip').value.trim();

    if (!fn || !ln || !email || !address || !city || !state || !zip) {
      showToast('Validation Error', 'Please fill out all shipping fields.', 'info');
      return;
    }
    
    // Simple email format check
    if (!email.includes('@')) {
      showToast('Validation Error', 'Please enter a valid email address.', 'info');
      return;
    }
  }

  if (step === 3 && currentCheckoutStep === 2) {
    const paymentType = document.querySelector('input[name="payment-method"]:checked').value;
    if (paymentType === 'credit-card') {
      const cardName = document.getElementById('card-name').value.trim();
      const cardNum = document.getElementById('card-number').value.replace(/\s+/g, '');
      const expiry = document.getElementById('card-expiry').value.trim();
      const cvv = document.getElementById('card-cvv').value.trim();

      if (!cardName || !cardNum || !expiry || !cvv) {
        showToast('Validation Error', 'Please complete your card details.', 'info');
        return;
      }
      if (cardNum.length < 16) {
        showToast('Validation Error', 'Credit card number appears incomplete.', 'info');
        return;
      }
    }
    
    // Render Step 3 summary page
    renderCheckoutSummary();
  }

  // Update steps visibility
  currentCheckoutStep = step;
  
  // Hide all step forms
  document.querySelectorAll('.checkout-step-form').forEach(form => form.classList.remove('active'));
  document.getElementById(`checkout-step-${step}-form`).classList.add('active');

  // Update step indicators
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-ind-${i}`);
    const line = document.getElementById(`step-line-${i}`);
    
    if (i < step) {
      indicator.className = 'step-indicator completed';
      if (line) line.className = 'step-line completed';
    } else if (i === step) {
      indicator.className = 'step-indicator active';
      if (line) line.className = 'step-line';
    } else {
      indicator.className = 'step-indicator';
      if (line) line.className = 'step-line';
    }
  }
}

function renderCheckoutSummary() {
  const container = document.getElementById('review-items-container');
  
  // Render text values
  const fn = document.getElementById('shipping-firstname').value;
  const ln = document.getElementById('shipping-lastname').value;
  const address = document.getElementById('shipping-address').value;
  const city = document.getElementById('shipping-city').value;
  const state = document.getElementById('shipping-state').value;
  const zip = document.getElementById('shipping-zip').value;
  const email = document.getElementById('shipping-email').value;

  document.getElementById('review-shipping-name').textContent = `${fn} ${ln}`;
  document.getElementById('review-shipping-addr').textContent = `${address}, ${city}, ${state} ${zip}`;
  document.getElementById('review-shipping-email').textContent = email;

  // Payment details
  const paymentType = document.querySelector('input[name="payment-method"]:checked').value;
  if (paymentType === 'credit-card') {
    const ccNum = document.getElementById('card-number').value;
    const lastFour = ccNum.substring(ccNum.length - 4);
    document.getElementById('review-payment-type').innerHTML = `<i class="fa-solid fa-credit-card"></i> Card ending in •••• ${lastFour}`;
  } else {
    document.getElementById('review-payment-type').innerHTML = `<i class="fa-brands fa-paypal"></i> PayPal Account`;
  }

  // Render items
  container.innerHTML = cart.map(item => `
    <div class="review-item-compact">
      <div>
        <span class="compact-item-title">${item.product.name}</span>
        <span class="compact-item-qty">x${item.quantity}</span>
      </div>
      <span class="compact-item-price">$${(item.product.price * item.quantity).toLocaleString()}</span>
    </div>
  `).join('');
}

function placeOrder() {
  const payBtn = document.getElementById('checkout-place-order-btn');
  payBtn.disabled = true;
  payBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Payment...`;

  setTimeout(() => {
    // 1. Hide review layout
    document.getElementById('checkout-step-3-form').classList.remove('active');
    
    // 2. Clear progress lines
    for(let i=1; i<=3; i++) {
      document.getElementById(`step-ind-${i}`).className = 'step-indicator completed';
    }

    // 3. Show Success Screen
    const email = document.getElementById('shipping-email').value;
    document.getElementById('success-email').textContent = email;
    document.getElementById('tracking-num').textContent = `#AERO-${Math.floor(10000 + Math.random() * 90000)}`;
    document.getElementById('checkout-success-view').style.display = 'block';

    // 4. Trigger Confetti
    triggerConfetti();

    // 5. Success toast
    showToast('Payment Successful', 'Order completed and confirmation email sent!', 'success');
  }, 2000);
}

function closeCheckoutAndReset() {
  // Reset modals
  document.getElementById('checkout-modal-overlay').classList.remove('active');
  document.getElementById('checkout-success-view').style.display = 'none';
  
  // Clear forms
  document.getElementById('checkout-step-1-form').reset();
  document.getElementById('checkout-step-2-form').reset();
  
  // Clear State
  cart = [];
  appliedPromo = null;
  document.getElementById('promo-code-input').value = '';
  document.getElementById('promo-feedback').textContent = '';
  
  // Reset payment selector
  document.querySelector('.payment-selector').click();

  updateCartUI();
}

/* ==========================================
   CONFETTI CANVAS ANIMATION ENGINE
   ========================================== */
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  
  // Set resize listener
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  const colors = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#fbbf24', '#ef4444'];
  const particles = [];
  
  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height - height;
      this.r = Math.random() * 6 + 4;
      this.d = Math.random() * height;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.tilt = Math.random() * 10 - 5;
      this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
      this.tiltAngle = 0;
    }
    
    update() {
      this.tiltAngle += this.tiltAngleIncremental;
      this.y += (Math.cos(this.d) + 3 + this.r / 2) / 2;
      this.x += Math.sin(this.tiltAngle);
      this.tilt = Math.sin(this.tiltAngle - (this.r / 2)) * 15;
    }
  }

  for (let i = 0; i < 150; i++) {
    particles.push(new ConfettiParticle());
  }

  let animationFrameId;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    
    let active = false;
    particles.forEach(p => {
      p.update();
      
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      if (p.y < height) {
        active = true;
      }
    });

    if (active) {
      animationFrameId = requestAnimationFrame(draw);
    } else {
      canvas.style.display = 'none';
      cancelAnimationFrame(animationFrameId);
    }
  }

  draw();
  
  // Stop after 6 seconds anyway
  setTimeout(() => {
    canvas.style.display = 'none';
    cancelAnimationFrame(animationFrameId);
  }, 6000);
}

/* ==========================================
   DYNAMIC TOAST NOTIFICATION SYSTEM
   ========================================== */
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-solid fa-circle-check text-green' : 'fa-solid fa-circle-info text-blue';

  toast.innerHTML = `
    <div class="toast-icon"><i class="${iconClass}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close Notification"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  // Close event
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/* ==========================================
   INVOICE EXPORTER (PRINT STYLING MOCK)
   ========================================== */
function downloadInvoice() {
  const fn = document.getElementById('shipping-firstname').value;
  const ln = document.getElementById('shipping-lastname').value;
  const address = document.getElementById('shipping-address').value;
  const city = document.getElementById('shipping-city').value;
  const state = document.getElementById('shipping-state').value;
  const zip = document.getElementById('shipping-zip').value;
  
  const subtotal = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  let discount = 0;
  if (appliedPromo) {
    discount = subtotal * appliedPromo.discount;
  }
  const shipping = subtotal > 150 ? 0 : 15;
  const total = subtotal - discount + shipping;

  const invoiceWindow = window.open('', '_blank');
  invoiceWindow.document.write(`
    <html>
      <head>
        <title>Invoice - Aero Store</title>
        <style>
          body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
          .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: 800; }
          .billing-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .billing-details h3 { font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; }
          .billing-details p { font-size: 15px; line-height: 1.5; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 14px; text-transform: uppercase; color: #64748b; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 15px; }
          .totals { margin-left: auto; width: 300px; display: flex; flex-direction: column; gap: 12px; font-size: 15px; }
          .total-row { display: flex; justify-content: space-between; }
          .grand-total { font-size: 18px; font-weight: 800; border-top: 2px solid #e2e8f0; padding-top: 12px; color: #0f172a; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="logo">AERO STORE</div>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">Receipt ID: #AERO-${Math.floor(10000 + Math.random() * 90000)}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 600;">Date: ${new Date().toLocaleDateString()}</p>
            <button class="no-print" onclick="window.print()" style="margin-top: 12px; padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Invoice</button>
          </div>
        </div>
        
        <div class="billing-details">
          <div>
            <h3>Shipped To</h3>
            <p>${fn} ${ln}</p>
            <p>${address}</p>
            <p>${city}, ${state} ${zip}</p>
          </div>
          <div>
            <h3>Supplier Info</h3>
            <p>Aero Inc.</p>
            <p>Infinite Loop 1, Cupertino</p>
            <p>California, US</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Color</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(item => `
              <tr>
                <td><strong>${item.product.name}</strong></td>
                <td><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${item.color}; border:1px solid #cbd5e1;"></span></td>
                <td>${item.quantity}</td>
                <td>$${item.product.price}</td>
                <td>$${(item.product.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>$${subtotal.toLocaleString()}</span></div>
          ${appliedPromo ? `<div class="total-row" style="color: #10b981;"><span>Discount (${appliedPromo.code})</span><span>-$${discount.toLocaleString()}</span></div>` : ''}
          <div class="total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : `$${shipping}`}</span></div>
          <div class="total-row grand-total"><span>Grand Total</span><span>$${total.toLocaleString()}</span></div>
        </div>
      </body>
    </html>
  `);
  invoiceWindow.document.close();
}
