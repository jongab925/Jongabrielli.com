document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. GLOBAL STATE & SELECTORS
       ========================================================================== */
    let cart = [];
    const savedCart = localStorage.getItem('jg_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }

    // Lightbox data (sync with images in HTML)
    const pressImages = [
        { src: 'Assests/A14I5496.jpg', alt: 'Jon Gabrielli Headshot A14I5496' },
        { src: 'Assests/A14I5513.jpg', alt: 'Jon Gabrielli Stand-Up A14I5513' },
        { src: 'Assests/A14I5933.jpg', alt: 'Jon Gabrielli Comedy Stance A14I5933' },
        { src: 'Assests/DSC00419.jpg', alt: 'Jon Gabrielli Live Show DSC00419' },
        { src: 'Assests/DSC00424.jpg', alt: 'Jon Gabrielli Comedy Stage DSC00424' },
        { src: 'Assests/20190730_133332.jpg', alt: 'Jon Gabrielli Action Shot 2019' },
        { src: 'Assests/img_1_1755467372817.jpg', alt: 'Jon Gabrielli Laughing on Stage' }
    ];
    let currentLightboxIndex = 0;

    // DOM Elements
    const header = document.querySelector('.header');

    // Cart Elements
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-drawer-overlay');
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartFooter = document.getElementById('cart-footer');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartTotalEl = document.getElementById('cart-total');
    const shopNowBtn = document.getElementById('shop-now-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Checkout Modal Elements
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutOverlay = document.getElementById('checkout-modal-overlay');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const checkoutFormView = document.getElementById('checkout-form-view');
    const checkoutSuccessView = document.getElementById('checkout-success-view');
    const successDoneBtn = document.getElementById('success-done-btn');
    const checkoutSummaryQty = document.getElementById('checkout-summary-qty');
    const checkoutSummaryTotal = document.getElementById('checkout-summary-total');
    const paymentForm = document.getElementById('simulated-payment-form');

    // Tour Elements
    const tourSearchInput = document.getElementById('tour-search');
    const tourItems = document.querySelectorAll('.tour-item');
    const noTourResults = document.getElementById('no-tour-results');

    // Lightbox Elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const epkViewButtons = document.querySelectorAll('.press-action-btn.view-btn');

    // Newsletter Elements
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterSuccess = document.getElementById('newsletter-success');

    // EPK Documents Elements


    /* ==========================================================================
       1.5. MOBILE MENU INTERACTIVITY
       ========================================================================== */
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const navMenu = document.querySelector('.nav');
    
    if (menuToggleBtn && navMenu) {
        menuToggleBtn.addEventListener('click', () => {
            menuToggleBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggleBtn.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    /* ==========================================================================
       2. SCROLL EVENTS
       ========================================================================== */
    // Change header appearance on scroll
    window.addEventListener('scroll', () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.style.background = 'rgba(11, 12, 16, 0.95)';
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            header.style.background = 'rgba(11, 12, 16, 0.75)';
            header.style.boxShadow = 'none';
        }
    });

    /* ==========================================================================
       3. SHOPPING CART SYSTEM
       ========================================================================== */
    function saveCart() {
        localStorage.setItem('jg_cart', JSON.stringify(cart));
    }

    function toggleCart(isOpen) {
        if (!cartDrawer || !cartOverlay) return;
        if (isOpen) {
            cartDrawer.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        } else {
            cartDrawer.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function updateCartUI() {
        // Update badge count if elements exist
        const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
        if (cartBadge) {
            cartBadge.textContent = totalItemsCount;
            cartBadge.style.display = totalItemsCount > 0 ? 'flex' : 'none';
        }

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            if (cartEmptyMessage) cartEmptyMessage.style.display = 'flex';
            if (cartFooter) cartFooter.style.display = 'none';
            // Clear current items from DOM
            const existingItems = cartItemsContainer.querySelectorAll('.cart-item');
            existingItems.forEach(el => el.remove());
            return;
        }

        if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'flex';

        // Clear existing items but keep empty message element
        const existingItems = cartItemsContainer.querySelectorAll('.cart-item');
        existingItems.forEach(el => el.remove());

        let subtotal = 0;

        // Render each item
        cart.forEach(item => {
            const itemPrice = parseFloat(item.price);
            const itemSubtotal = itemPrice * item.qty;
            subtotal += itemSubtotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="cart-item-price">$${itemPrice.toFixed(2)}</span>
                    <div class="cart-item-qty-controls">
                        <button class="qty-btn dec-qty-btn" data-id="${item.id}">-</button>
                        <span class="cart-item-qty">${item.qty}</span>
                        <button class="qty-btn inc-qty-btn" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove Item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        // Set totals
        if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (cartTotalEl) cartTotalEl.textContent = `$${subtotal.toFixed(2)}`;

        // Attach event listeners to new elements in cart
        cartItemsContainer.querySelectorAll('.dec-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => changeItemQuantity(btn.dataset.id, -1));
        });
        cartItemsContainer.querySelectorAll('.inc-qty-btn').forEach(btn => {
            btn.addEventListener('click', () => changeItemQuantity(btn.dataset.id, 1));
        });
        cartItemsContainer.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });
    }

    function addToCart(id, name, price, img) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ id, name, price, img, qty: 1 });
        }
        saveCart();
        updateCartUI();
        toggleCart(true); // Automatically slide open cart drawer
    }

    function changeItemQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.qty += change;
            if (item.qty <= 0) {
                cart = cart.filter(item => item.id !== id);
            }
            saveCart();
            updateCartUI();
        }
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();
    }

    // Attach listeners for Merch Cards Add to Cart (Only on merch.html)
    document.querySelectorAll('.merch-card').forEach(card => {
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = card.dataset.price;
        const img = card.dataset.img;
        const addBtn = card.querySelector('.add-to-cart-btn');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                addToCart(id, name, price, img);
            });
        }
    });

    // Cart Button controls
    if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            toggleCart(false);
            window.location.href = 'merch.html';
        });
    }

    // Initialize cart state on load
    updateCartUI();

    /* ==========================================================================
       4. SECURE SIMULATED CHECKOUT SYSTEM
       ========================================================================== */
    function toggleCheckoutModal(isOpen) {
        if (!checkoutModal || !checkoutOverlay) return;
        if (isOpen) {
            // Populate details
            const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);
            const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
            if (checkoutSummaryQty) checkoutSummaryQty.textContent = `${totalItemsCount} item${totalItemsCount > 1 ? 's' : ''}`;
            if (checkoutSummaryTotal) checkoutSummaryTotal.textContent = `$${totalAmount.toFixed(2)}`;

            // Reset form and view states
            if (paymentForm) paymentForm.reset();
            if (checkoutFormView) checkoutFormView.style.display = 'block';
            if (checkoutSuccessView) checkoutSuccessView.style.display = 'none';

            // Show modals
            checkoutModal.classList.add('active');
            checkoutOverlay.classList.add('active');
            toggleCart(false); // Hide the cart drawer
            document.body.style.overflow = 'hidden';
        } else {
            checkoutModal.classList.remove('active');
            checkoutOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', () => toggleCheckoutModal(true));
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', () => toggleCheckoutModal(false));
    if (checkoutOverlay) checkoutOverlay.addEventListener('click', () => toggleCheckoutModal(false));

    // Handle checkout payment submit
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-purchase-btn');
            const originalText = submitBtn ? submitBtn.textContent : 'Pay Now';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing Transaction...';
            }

            // Simulate credit card processing delay
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }

                // Transition to success screen
                if (checkoutFormView) checkoutFormView.style.display = 'none';
                if (checkoutSuccessView) checkoutSuccessView.style.display = 'block';

                // Wipe Cart
                cart = [];
                saveCart();
                updateCartUI();
            }, 1500);
        });
    }

    if (successDoneBtn) {
        successDoneBtn.addEventListener('click', () => {
            toggleCheckoutModal(false);
            window.location.href = 'index.html';
        });
    }

    /* ==========================================================================
       5. LIVE TOUR DATES FILTER (Only on index.html)
       ========================================================================== */
    if (tourSearchInput && tourItems.length > 0) {
        tourSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            let visibleCount = 0;

            tourItems.forEach(item => {
                const dataLoc = item.dataset.location;
                if (dataLoc.includes(query)) {
                    item.style.display = 'grid';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });

            if (noTourResults) {
                noTourResults.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        });
    }

    /* ==========================================================================
       6. EPK MEDIA LIGHTBOX VIEWER (Only on press.html)
       ========================================================================== */
    function openLightbox(index) {
        if (!lightboxModal || !lightboxImg) return;
        currentLightboxIndex = index;
        const image = pressImages[currentLightboxIndex];
        
        lightboxImg.src = image.src;
        lightboxImg.alt = image.alt;
        if (lightboxCaption) lightboxCaption.textContent = image.alt;
        


        lightboxModal.style.display = 'flex';
        // Minor timeout to trigger transition styles
        setTimeout(() => {
            lightboxModal.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('active');
        setTimeout(() => {
            lightboxModal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
        if (!lightboxImg) return;
        currentLightboxIndex += direction;
        if (currentLightboxIndex >= pressImages.length) {
            currentLightboxIndex = 0;
        } else if (currentLightboxIndex < 0) {
            currentLightboxIndex = pressImages.length - 1;
        }
        
        const image = pressImages[currentLightboxIndex];
        
        // Brief fade-out transition for image change
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = image.src;
            lightboxImg.alt = image.alt;
            if (lightboxCaption) lightboxCaption.textContent = image.alt;

            lightboxImg.style.opacity = '1';
        }, 150);
    }

    // Event listeners for Lightbox (Only on press.html)
    if (epkViewButtons.length > 0) {
        epkViewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                openLightbox(index);
            });
        });
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener('click', () => navigateLightbox(1));
    
    // Lightbox modal keyboard navigation & close click-outside
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    });

    /* ==========================================================================
       7. DYNAMIC MAILING LIST NEWSLETTER HANDLER (Only on index.html)
       ========================================================================== */
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('nl-name');
            const emailInput = document.getElementById('nl-email');
            const cityInput = document.getElementById('nl-city');
            
            if (!nameInput || !emailInput || !cityInput) return;
            
            const nameGroup = nameInput.parentElement;
            const emailGroup = emailInput.parentElement;
            const cityGroup = cityInput.parentElement;
            
            let isValid = true;
            
            // Reset state
            if (nameGroup) nameGroup.classList.remove('has-error');
            if (emailGroup) emailGroup.classList.remove('has-error');
            if (cityGroup) cityGroup.classList.remove('has-error');

            // Validate name
            if (nameInput.value.trim() === '') {
                if (nameGroup) nameGroup.classList.add('has-error');
                isValid = false;
            }

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                if (emailGroup) emailGroup.classList.add('has-error');
                isValid = false;
            }

            // Validate city
            if (cityInput.value.trim() === '') {
                if (cityGroup) cityGroup.classList.add('has-error');
                isValid = false;
            }

            if (isValid) {
                const submitBtn = newsletterForm.querySelector('.btn-submit');
                const originalText = submitBtn ? submitBtn.textContent : 'Sign Up';
                
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Subscribing...';
                }

                // Simulate server network signup action
                setTimeout(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }
                    
                    // Keep track of the city they provide in localStorage
                    const subscribers = JSON.parse(localStorage.getItem('jg_subscribers') || '[]');
                    subscribers.push({
                        name: nameInput.value.trim(),
                        email: emailInput.value.trim(),
                        city: cityInput.value.trim(),
                        timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('jg_subscribers', JSON.stringify(subscribers));
                    console.log('New show request logged:', subscribers[subscribers.length - 1]);
                    console.log('All subscriber recommendations:', subscribers);

                    // Hide Form and Show Success message
                    newsletterForm.style.display = 'none';
                    if (newsletterSuccess) {
                        newsletterSuccess.style.display = 'flex';
                        newsletterSuccess.style.opacity = '0';
                        
                        setTimeout(() => {
                            newsletterSuccess.style.transition = 'opacity 0.5s ease';
                            newsletterSuccess.style.opacity = '1';
                        }, 50);
                    }

                }, 1200);
            }
        });
    }


});
