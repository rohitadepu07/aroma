// Aroma Qasr - Authentication, User Profile & Order History Portal
// Provides Navbar Login Button, Blue Arrow Popup, Interception for Add/Buy Actions,
// Edit Profile Modal, and Previous Orders Tracking

(function () {
  const STORAGE_KEY = 'aroma_auth_user';
  const ORDERS_KEY = 'aroma_order_history';
  let pendingAuthAction = null;

  // 1. Storage Helpers
  function getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    updateAuthNavbar();
    showToast(`Welcome back, ${user.name || 'valued customer'}!`);
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY);
    updateAuthNavbar();
    showToast('You have been logged out.');
  }

  function getOrderHistory() {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      if (orders.length === 0) {
        // Check if there is an active/recent order in localStorage
        const lastOrderId = localStorage.getItem('aroma_last_order_id');
        const lastItems = JSON.parse(localStorage.getItem('aroma_last_order_items') || '[]');
        if (lastOrderId && lastItems.length > 0) {
          const total = lastItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
          const newOrder = {
            id: lastOrderId.startsWith('#') ? lastOrderId : '#' + lastOrderId,
            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
            status: 'Confirmed',
            items: lastItems,
            total: total
          };
          orders.push(newOrder);
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        } else {
          // Provide a realistic demo initial order for the luxury collector
          const sampleOrder = {
            id: '#AQ-74910',
            date: 'October 8, 2026',
            status: 'Delivered',
            items: [
              {
                name: 'Aroma Qasr Vani Extrait',
                size: '50ml - Extrait De Parfum',
                price: 1999,
                quantity: 1,
                image: 'images/Vani.png'
              }
            ],
            total: 1999
          };
          orders.push(sampleOrder);
          localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        }
      }
      return orders;
    } catch (e) {
      return [];
    }
  }

  // 2. Toast Notification Helper
  function showToast(msg) {
    let toast = document.getElementById('auth-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'auth-toast';
      toast.className = 'auth-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // 3. Inject Modal Elements into Document Body
  function injectModalElements() {
    if (document.getElementById('auth-modal-backdrop')) return;

    const modalHTML = `
      <!-- 1. Sign In / Register Modal -->
      <div class="auth-modal-backdrop" id="auth-modal-backdrop" onclick="window.closeLoginModal()"></div>
      <div class="auth-modal-dialog" id="auth-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button class="auth-modal-close" onclick="window.closeLoginModal()" aria-label="Close modal">&times;</button>
        <div class="auth-modal-header">
          <div class="auth-modal-logo">Aroma Qasr</div>
          <h3 class="auth-modal-title" id="auth-modal-title">Sign In / Register</h3>
          <p class="auth-modal-subtitle">Sign in to add luxury fragrances & checkout</p>
        </div>

        <form id="auth-modal-form" onsubmit="window.handleAuthFormSubmit(event)">
          <div class="auth-form-group">
            <label class="auth-form-label" for="auth-input-ident">Mobile Number or Email</label>
            <input type="text" id="auth-input-ident" class="auth-form-input" placeholder="e.g. +91 9137961830 or you@domain.com" required autocomplete="username" />
          </div>

          <div class="auth-form-group">
            <label class="auth-form-label" for="auth-input-name">Your Full Name (Optional)</label>
            <input type="text" id="auth-input-name" class="auth-form-input" placeholder="e.g. Rohit Sharma" autocomplete="name" />
          </div>

          <button type="submit" class="auth-submit-btn" id="auth-submit-btn">Continue to Login</button>
        </form>

        <button type="button" class="auth-demo-quick-btn" onclick="window.quickDemoLogin()">
          ⚡ Quick 1-Click Login (Demo Account)
        </button>

        <div class="auth-modal-footer">
          By continuing, you agree to Aroma Qasr's <a href="about.html">Terms of Service</a> & <a href="about.html">Privacy Policy</a>.
        </div>
      </div>

      <!-- 2. Account Portal Modal (Edit Profile & Previous Orders) -->
      <div class="auth-modal-backdrop" id="account-portal-backdrop" onclick="window.closeAccountModal()"></div>
      <div class="account-portal-dialog" id="account-portal-dialog" role="dialog" aria-modal="true" aria-labelledby="account-portal-title">
        <div class="account-portal-header">
          <div class="account-user-badge-wrap">
            <div class="account-user-avatar" id="account-header-avatar">R</div>
            <div class="account-user-meta">
              <h3 id="account-header-name">Rohit Sharma</h3>
              <span id="account-header-status">VIP Fragrance Collector • Aroma Qasr House</span>
            </div>
          </div>
          <button class="auth-modal-close" style="position:static;" onclick="window.closeAccountModal()" aria-label="Close portal">&times;</button>
        </div>

        <!-- Tabs Nav -->
        <div class="account-tabs-nav">
          <button class="account-tab-btn active" id="tab-btn-profile" onclick="window.switchAccountTab('profile')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Edit Profile
          </button>
          <button class="account-tab-btn" id="tab-btn-orders" onclick="window.switchAccountTab('orders')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            Previous Orders <span id="orders-count-badge" style="font-size:11px; background:rgba(0,0,0,0.08); padding:2px 7px; border-radius:10px; margin-left:2px;">(1)</span>
          </button>
        </div>

        <!-- Tab Panes Container -->
        <div class="account-tab-content-wrap">
          <!-- Pane 1: Edit Profile -->
          <div class="account-tab-pane active" id="pane-profile">
            <form id="edit-profile-form" onsubmit="window.saveUserProfile(event)">
              <div class="profile-form-grid">
                <div>
                  <label class="auth-form-label" for="prof-name">Full Name</label>
                  <input type="text" id="prof-name" class="auth-form-input" required />
                </div>
                <div>
                  <label class="auth-form-label" for="prof-email">Email Address</label>
                  <input type="email" id="prof-email" class="auth-form-input" required />
                </div>
                <div>
                  <label class="auth-form-label" for="prof-phone">Mobile Phone</label>
                  <input type="tel" id="prof-phone" class="auth-form-input" placeholder="+91 9137961830" />
                </div>
                <div>
                  <label class="auth-form-label" for="prof-pref">Preferred Olfactory Note</label>
                  <select id="prof-pref" class="auth-form-input" style="cursor:pointer;">
                    <option value="Vanilla & Warm Spices">Vanilla & Warm Spices (Vani)</option>
                    <option value="Royal Oud & Amber">Royal Oud & Amber (Vökka Thai Oud)</option>
                    <option value="Marine Aquatic & Fresh">Marine Aquatic & Fresh (Aqua)</option>
                    <option value="Floral & Rose Extrait">Floral & Rose Extrait (Cupinos)</option>
                  </select>
                </div>
                <div class="full-span">
                  <label class="auth-form-label" for="prof-address">Delivery / Shipping Address</label>
                  <input type="text" id="prof-address" class="auth-form-input" placeholder="Apartment / Suite, Street Address" />
                </div>
                <div>
                  <label class="auth-form-label" for="prof-city">City</label>
                  <input type="text" id="prof-city" class="auth-form-input" placeholder="Mumbai" />
                </div>
                <div>
                  <label class="auth-form-label" for="prof-pincode">Pincode / Postal Code</label>
                  <input type="text" id="prof-pincode" class="auth-form-input" placeholder="400001" />
                </div>
              </div>

              <div style="margin-top: 24px; display:flex; justify-content:flex-end; gap:12px;">
                <button type="button" class="auth-demo-quick-btn" style="width:auto; margin:0; padding:12px 20px;" onclick="window.closeAccountModal()">Cancel</button>
                <button type="submit" class="profile-save-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          <!-- Pane 2: Previous Orders -->
          <div class="account-tab-pane" id="pane-orders">
            <div class="orders-list-container" id="orders-list-container">
              <!-- Orders injected dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHTML;
    while (div.firstChild) {
      document.body.appendChild(div.firstChild);
    }
  }

  // 4. Inject Login Button & Popup into Navigation
  function injectNavbarAuth() {
    const navActions = document.querySelector('.nav-actions');
    const cartTrigger = document.querySelector('.cart-trigger-btn');

    if (!cartTrigger) return;
    if (document.getElementById('nav-auth-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'nav-auth-wrapper';
    wrapper.id = 'nav-auth-wrapper';

    wrapper.innerHTML = `
      <button class="nav-login-btn" id="nav-login-btn" onclick="window.toggleAuthMenu(event)" aria-label="Account Login">
        <svg class="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span id="nav-login-text">Login</span>
        <svg class="auth-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- Blue Arrow Popup matching user's exact mockup -->
      <div class="auth-popup-bubble" id="auth-popup-bubble">
        <button class="bubble-login-btn" onclick="window.openLoginModal(event)">Login</button>
        <div class="bubble-subtext">
          New to Aroma Qasr? <a onclick="window.openLoginModal(event)">Sign Up</a>
        </div>
      </div>

      <!-- Logged In User Dropdown -->
      <div class="auth-user-dropdown" id="auth-user-dropdown">
        <div class="auth-user-dropdown-header">
          <strong id="auth-dropdown-username">Rohit Sharma</strong>
          <span id="auth-dropdown-ident">rohit@example.com</span>
        </div>
        <button class="auth-dropdown-link" onclick="window.openAccountModal('profile')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Edit Profile
        </button>
        <button class="auth-dropdown-link" onclick="window.openAccountModal('orders')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          Previous Orders
        </button>
        <a href="collections.html" class="auth-dropdown-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
          Shop Fragrances
        </a>
        <button class="auth-dropdown-link logout" onclick="window.logoutUser()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>
    `;

    if (navActions) {
      navActions.insertBefore(wrapper, cartTrigger);
    } else if (cartTrigger.parentElement) {
      cartTrigger.parentElement.insertBefore(wrapper, cartTrigger);
    }

    updateAuthNavbar();
  }

  // 5. Update Navbar State
  function updateAuthNavbar() {
    const user = getUser();
    const btn = document.getElementById('nav-login-btn');
    const text = document.getElementById('nav-login-text');
    const bubble = document.getElementById('auth-popup-bubble');
    const dropdown = document.getElementById('auth-user-dropdown');
    const dropdownName = document.getElementById('auth-dropdown-username');
    const dropdownIdent = document.getElementById('auth-dropdown-ident');

    if (!btn || !text) return;

    if (user) {
      btn.classList.add('logged-in');
      text.textContent = user.name ? user.name.split(' ')[0] : 'Account';
      if (dropdownName) dropdownName.textContent = user.name || 'Valued Collector';
      if (dropdownIdent) dropdownIdent.textContent = user.email || user.phone || 'Aroma Qasr Member';
    } else {
      btn.classList.remove('logged-in');
      text.textContent = 'Login';
    }

    if (bubble) bubble.classList.remove('show');
    if (dropdown) dropdown.classList.remove('show');
    const wrapper = document.getElementById('nav-auth-wrapper');
    if (wrapper) {
      wrapper.classList.remove('active');
      wrapper.classList.remove('prompt-highlight');
    }
  }

  // 6. Account Portal (Profile & Orders) Handlers
  window.openAccountModal = function (tab = 'profile') {
    const user = getUser();
    if (!user) {
      window.openLoginModal();
      return;
    }

    // Close any dropdown
    const dropdown = document.getElementById('auth-user-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    const wrapper = document.getElementById('nav-auth-wrapper');
    if (wrapper) wrapper.classList.remove('active');

    // Populate user profile info
    const avatar = document.getElementById('account-header-avatar');
    const nameHeader = document.getElementById('account-header-name');
    if (avatar) avatar.textContent = (user.name || 'R').charAt(0).toUpperCase();
    if (nameHeader) nameHeader.textContent = user.name || 'Rohit Sharma';

    const profName = document.getElementById('prof-name');
    const profEmail = document.getElementById('prof-email');
    const profPhone = document.getElementById('prof-phone');
    const profAddress = document.getElementById('prof-address');
    const profCity = document.getElementById('prof-city');
    const profPincode = document.getElementById('prof-pincode');
    const profPref = document.getElementById('prof-pref');

    if (profName) profName.value = user.name || '';
    if (profEmail) profEmail.value = user.email || '';
    if (profPhone) profPhone.value = user.phone || '+91 9137961830';
    if (profAddress) profAddress.value = user.address || 'Signature Towers, Bandra West';
    if (profCity) profCity.value = user.city || 'Mumbai';
    if (profPincode) profPincode.value = user.pincode || '400050';
    if (profPref && user.preference) profPref.value = user.preference;

    // Render Previous Orders
    renderOrdersList();

    // Switch to requested tab
    window.switchAccountTab(tab);

    const backdrop = document.getElementById('account-portal-backdrop');
    const dialog = document.getElementById('account-portal-dialog');
    if (backdrop && dialog) {
      backdrop.classList.add('open');
      dialog.classList.add('open');
    }
  };

  window.closeAccountModal = function () {
    const backdrop = document.getElementById('account-portal-backdrop');
    const dialog = document.getElementById('account-portal-dialog');
    if (backdrop && dialog) {
      backdrop.classList.remove('open');
      dialog.classList.remove('open');
    }
  };

  window.switchAccountTab = function (tab) {
    const tabProfileBtn = document.getElementById('tab-btn-profile');
    const tabOrdersBtn = document.getElementById('tab-btn-orders');
    const paneProfile = document.getElementById('pane-profile');
    const paneOrders = document.getElementById('pane-orders');

    if (tab === 'profile') {
      if (tabProfileBtn) tabProfileBtn.classList.add('active');
      if (tabOrdersBtn) tabOrdersBtn.classList.remove('active');
      if (paneProfile) paneProfile.classList.add('active');
      if (paneOrders) paneOrders.classList.remove('active');
    } else {
      if (tabProfileBtn) tabProfileBtn.classList.remove('active');
      if (tabOrdersBtn) tabOrdersBtn.classList.add('active');
      if (paneProfile) paneProfile.classList.remove('active');
      if (paneOrders) paneOrders.classList.add('active');
    }
  };

  window.saveUserProfile = function (e) {
    e.preventDefault();
    const currentUser = getUser() || {};

    const name = document.getElementById('prof-name')?.value.trim() || currentUser.name;
    const email = document.getElementById('prof-email')?.value.trim() || currentUser.email;
    const phone = document.getElementById('prof-phone')?.value.trim() || currentUser.phone;
    const address = document.getElementById('prof-address')?.value.trim() || '';
    const city = document.getElementById('prof-city')?.value.trim() || '';
    const pincode = document.getElementById('prof-pincode')?.value.trim() || '';
    const preference = document.getElementById('prof-pref')?.value || '';

    const updatedUser = {
      ...currentUser,
      name,
      email,
      phone,
      address,
      city,
      pincode,
      preference
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    updateAuthNavbar();

    const avatar = document.getElementById('account-header-avatar');
    const nameHeader = document.getElementById('account-header-name');
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    if (nameHeader) nameHeader.textContent = name;

    showToast('Profile updated successfully!');
    setTimeout(() => {
      window.closeAccountModal();
    }, 450);
  };

  function renderOrdersList() {
    const container = document.getElementById('orders-list-container');
    const badge = document.getElementById('orders-count-badge');
    if (!container) return;

    const orders = getOrderHistory();
    if (badge) badge.textContent = `(${orders.length})`;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="order-empty-state">
          <svg class="order-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <div class="order-empty-title">No Previous Orders Yet</div>
          <p class="order-empty-desc">Explore our signature olfactory collection and place your first order.</p>
          <a href="collections.html" class="profile-save-btn" style="text-decoration:none;">Discover Fragrances &rarr;</a>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map((order, orderIdx) => {
      const items = order.items || [];
      const statusClass = order.status === 'In Transit' ? 'in-transit' : (order.status === 'Processing' ? 'processing' : '');
      const orderIdClean = order.id.replace('#', '');

      return `
        <div class="order-history-card">
          <div class="order-card-top">
            <div class="order-card-id-block">
              <span class="order-card-id">${order.id}</span>
              <span class="order-card-date">• ${order.date}</span>
            </div>
            <span class="order-status-badge ${statusClass}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"></circle></svg>
              ${order.status || 'Confirmed'}
            </span>
          </div>

          <div class="order-card-items">
            ${items.map(item => `
              <div class="order-item-mini">
                <div class="order-item-mini-info">
                  <img src="${item.image || 'images/Vani.png'}" alt="${item.name}" class="order-item-mini-thumb">
                  <div>
                    <h4 class="order-item-mini-name">${item.name}</h4>
                    <span class="order-item-mini-sub">Qty: ${item.quantity || 1} • ${item.size || '50ml Eau De Parfum'}</span>
                  </div>
                </div>
                <span class="order-item-mini-price">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
              </div>
            `).join('')}
          </div>

          <div class="order-card-bottom">
            <div>
              <span style="font-size:12px; color:#777;">Order Total: </span>
              <span class="order-total-amount">₹${(order.total || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="order-action-links">
              <a href="order-confirmation.html?order_id=${orderIdClean}" class="order-view-receipt-btn">View Invoice</a>
              <button class="order-view-receipt-btn" style="background:#E85038; color:#FFF;" onclick="window.reorderItems(${orderIdx})">Reorder</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.reorderItems = function (orderIdx) {
    const orders = getOrderHistory();
    const order = orders[orderIdx];
    if (!order || !order.items) return;

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('Aroma Qasr_cart')) || [];
    } catch (e) { }

    order.items.forEach(item => {
      const existing = cart.find(i => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        cart.push({ ...item, quantity: item.quantity || 1 });
      }
    });

    localStorage.setItem('Aroma Qasr_cart', JSON.stringify(cart));
    window.closeAccountModal();
    if (window.updateCartUI) window.updateCartUI();
    if (window.openCart) window.openCart();
    showToast('Items added to your bag!');
  };

  // Helper for order-confirmation.html to record confirmed orders
  window.addConfirmedOrderToHistory = function (order) {
    if (!order || !order.id) return;
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      const exists = orders.some(o => o.id === order.id);
      if (!exists) {
        orders.unshift(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      }
    } catch (e) { }
  };

  // 7. Global Window Handlers
  window.isUserLoggedIn = function () {
    return getUser() !== null;
  };

  window.toggleAuthMenu = function (e) {
    if (e) e.stopPropagation();
    const user = getUser();
    const bubble = document.getElementById('auth-popup-bubble');
    const dropdown = document.getElementById('auth-user-dropdown');
    const wrapper = document.getElementById('nav-auth-wrapper');

    if (user) {
      if (dropdown) dropdown.classList.toggle('show');
      if (bubble) bubble.classList.remove('show');
      if (wrapper) wrapper.classList.toggle('active', dropdown && dropdown.classList.contains('show'));
    } else {
      if (bubble) bubble.classList.toggle('show');
      if (dropdown) dropdown.classList.remove('show');
      if (wrapper) wrapper.classList.toggle('active', bubble && bubble.classList.contains('show'));
    }
  };

  window.openLoginModal = function (e) {
    if (e) e.stopPropagation();
    const bubble = document.getElementById('auth-popup-bubble');
    if (bubble) bubble.classList.remove('show');
    const dropdown = document.getElementById('auth-user-dropdown');
    if (dropdown) dropdown.classList.remove('show');
    const wrapper = document.getElementById('nav-auth-wrapper');
    if (wrapper) wrapper.classList.remove('active');

    const backdrop = document.getElementById('auth-modal-backdrop');
    const dialog = document.getElementById('auth-modal-dialog');
    if (backdrop && dialog) {
      backdrop.classList.add('open');
      dialog.classList.add('open');
      const input = document.getElementById('auth-input-ident');
      if (input) setTimeout(() => input.focus(), 150);
    }
  };

  window.closeLoginModal = function () {
    const backdrop = document.getElementById('auth-modal-backdrop');
    const dialog = document.getElementById('auth-modal-dialog');
    if (backdrop && dialog) {
      backdrop.classList.remove('open');
      dialog.classList.remove('open');
    }
  };

  window.handleAuthFormSubmit = function (e) {
    e.preventDefault();
    const identInput = document.getElementById('auth-input-ident');
    const nameInput = document.getElementById('auth-input-name');

    const ident = identInput ? identInput.value.trim() : '';
    let name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      name = ident.includes('@') ? ident.split('@')[0] : 'Rohit Sharma';
    }

    const newUser = {
      name: name,
      email: ident.includes('@') ? ident : `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      phone: !ident.includes('@') ? ident : '+91 9137961830',
      address: 'Signature Towers, Bandra West',
      city: 'Mumbai',
      pincode: '400050',
      preference: 'Vanilla & Warm Spices',
      loginTime: new Date().toISOString()
    };

    setUser(newUser);
    window.closeLoginModal();

    if (typeof pendingAuthAction === 'function') {
      const action = pendingAuthAction;
      pendingAuthAction = null;
      setTimeout(() => action(), 200);
    }
  };

  window.quickDemoLogin = function () {
    const demoUser = {
      name: 'Rohit Sharma',
      email: 'rohit@aromaqasr.com',
      phone: '+91 9137961830',
      address: 'Sea Green Residences, Colaba',
      city: 'Mumbai',
      pincode: '400005',
      preference: 'Royal Oud & Amber',
      loginTime: new Date().toISOString()
    };
    setUser(demoUser);
    window.closeLoginModal();

    if (typeof pendingAuthAction === 'function') {
      const action = pendingAuthAction;
      pendingAuthAction = null;
      setTimeout(() => action(), 200);
    }
  };

  window.logoutUser = function () {
    clearUser();
  };

  // 8. Core Interceptor: requireAuth
  window.requireAuth = function (onAuthorizedCallback, actionDescription = 'add items to your shopping bag') {
    if (window.isUserLoggedIn()) {
      if (typeof onAuthorizedCallback === 'function') {
        onAuthorizedCallback();
      }
      return true;
    }

    pendingAuthAction = onAuthorizedCallback;

    const wrapper = document.getElementById('nav-auth-wrapper');
    const bubble = document.getElementById('auth-popup-bubble');

    if (window.scrollY > 150) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (wrapper) {
      wrapper.classList.add('prompt-highlight');
      wrapper.classList.add('active');
    }
    if (bubble) {
      bubble.classList.add('show');
    }

    showToast(`Please sign in to ${actionDescription}`);

    setTimeout(() => {
      window.openLoginModal();
    }, 600);

    return false;
  };

  // Close menus on outside click
  document.addEventListener('click', function (e) {
    const wrapper = document.getElementById('nav-auth-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      const bubble = document.getElementById('auth-popup-bubble');
      const dropdown = document.getElementById('auth-user-dropdown');
      if (bubble) bubble.classList.remove('show');
      if (dropdown) dropdown.classList.remove('show');
      wrapper.classList.remove('active');
      wrapper.classList.remove('prompt-highlight');
    }
  });

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectModalElements();
      injectNavbarAuth();
    });
  } else {
    injectModalElements();
    injectNavbarAuth();
  }
})();
