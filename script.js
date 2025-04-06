// Ожидаем полной загрузки DOM перед выполнением скрипта
document.addEventListener('DOMContentLoaded', () => {

    // --- Глобальные переменные и константы ---
    const WHATSAPP_NUMBER = '+79374897407';
    let cart = {};
    let activeCategory = 'all';
    let currentCategoryIndex = 0;

    // --- Получение ссылок на элементы DOM ---
    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    const cartButton = document.getElementById('cartButton');
    const cartCounter = document.getElementById('cartCounter');
    const cartPopup = document.getElementById('cartPopup');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const sticksInput = document.getElementById('sticks');
    const checkoutButton = document.getElementById('checkoutButton');
    const clearCartButton = document.getElementById('clearCartButton');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const desktopNavContainer = document.querySelector('.desktop-nav');
    const allNavContainers = document.querySelectorAll('.desktop-nav, .mobile-nav');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    const sliderTrack = document.getElementById('sliderTrack');
    const shapesContainer = document.querySelector('.shapes');
    const confirmationPopup = document.getElementById('confirmationPopup');
    const confirmationOverlay = document.getElementById('confirmationOverlay');
    const addressSection = document.getElementById('addressSection');
    const addressInput = document.getElementById('address');
    const commentInput = document.getElementById('comment');
    const confirmOrderButton = document.getElementById('confirmOrderButton');
    const cancelOrderButton = document.getElementById('cancelOrderButton');
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const toastContainer = document.getElementById('toast-container');

    // --- Инициализация ---
    updateCartPopup();
    updatePriceFilterValue();
    initSlider();
    initShapes();

    // --- Функции ---
    function showToast(message, type = 'info') {
        if (!toastContainer) return; const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.textContent = message; toastContainer.appendChild(toast); toast.offsetHeight; setTimeout(() => { toast.classList.add('hide'); toast.addEventListener('transitionend', () => { if (toast.parentNode) toast.remove(); }, { once: true }); }, 3000);
    }

    function filterProducts() {
        if (!productGrid) return; const searchTerm = searchInput ? searchInput.value.toLowerCase() : ''; const maxPrice = priceRange ? parseInt(priceRange.value, 10) : Infinity; const cards = productGrid.querySelectorAll('.card'); const itemsToShow = []; const itemsToHide = []; cards.forEach(card => { const category = card.dataset.category; const basePriceAttr = card.querySelector('.size-options button[data-size="small"], .size-options button:first-child, .add-to-cart-btn'); const basePrice = basePriceAttr ? parseInt(basePriceAttr.dataset.price, 10) : parseInt(card.dataset.price || 0, 10); const name = card.querySelector('.product-name')?.textContent.toLowerCase() || ''; const matchesCategory = activeCategory === 'all' || category === activeCategory; const matchesPrice = basePrice <= maxPrice; const matchesSearch = name.includes(searchTerm); const shouldBeVisible = matchesCategory && matchesPrice && matchesSearch; const isCurrentlyVisible = card.style.display !== 'none' && !card.classList.contains('card-hiding'); if (isCurrentlyVisible && !shouldBeVisible) { itemsToHide.push(card); } else if (!isCurrentlyVisible && shouldBeVisible) { card.style.display = ''; card.classList.remove('card-hiding'); itemsToShow.push(card); } else if (isCurrentlyVisible && shouldBeVisible) { card.classList.remove('card-hiding'); } }); itemsToHide.forEach(card => { card.classList.add('card-hiding'); setTimeout(() => { card.style.display = 'none'; }, 300); }); requestAnimationFrame(() => { itemsToShow.forEach(card => { card.classList.remove('card-hiding'); }); });
    }

    function updatePriceFilterValue() {
        if (priceValue && priceRange) priceValue.textContent = `до ${priceRange.value} ₽`;
        filterProducts();
    }

    function filterCategory(category) {
        activeCategory = category; allNavContainers.forEach(container => { container.querySelectorAll('.category-button').forEach(btn => { btn.classList.toggle('active', btn.dataset.category === category); }); }); filterProducts(); if (mobileNav?.classList.contains('active')) { toggleMobileMenu(); }
    }

    function handleSizeSelection(selectedButton) {
        const card = selectedButton.closest('.card'); if (!card) return; const priceElement = card.querySelector('.price'); const addToCartButton = card.querySelector('.add-to-cart-btn'); card.querySelectorAll('.size-options button').forEach(btn => btn.classList.remove('selected')); selectedButton.classList.add('selected'); const newPrice = selectedButton.dataset.price; if (priceElement) priceElement.textContent = `${newPrice} ₽`; if (addToCartButton) addToCartButton.dataset.price = newPrice;
    }

    // Функция animateToCart УДАЛЕНА
    /*
    function animateToCart(imgElement) {
        // ...
    }
    */

    // Вызов animateToCart удален из этой функции
    function addToCart(name, price, imgElement, event, size = null) {
         if (event) event.stopPropagation();
         const cartKey = size ? `${name} (${size})` : name;
         const numericPrice = parseFloat(price);
         if (isNaN(numericPrice)) {
             console.error("Invalid price for item:", name, price);
             showToast(`Ошибка цены для товара "${name}"`, "error");
             return;
         }
         if (cart[cartKey]) {
             cart[cartKey].quantity++;
         } else {
             cart[cartKey] = { quantity: 1, price: numericPrice, size: size, name: name };
         }
         // animateToCart(imgElement); // <-- Удален вызов
         showToast(`${name} ${size ? '('+size+')' : ''} добавлен в корзину!`, 'success');
         updateCartPopup();
    }

    function incrementCart(itemNameKey) {
        if (cart[itemNameKey]) cart[itemNameKey].quantity++; updateCartPopup();
    }

    function decrementCart(itemNameKey) {
        if (!cart[itemNameKey]) return; cart[itemNameKey].quantity--; if (cart[itemNameKey].quantity <= 0) { const itemElement = cartItemsContainer?.querySelector(`button[data-item="${itemNameKey}"]`)?.closest('.cart-item'); if (itemElement) { itemElement.classList.add('removing'); const handleTransitionEnd = () => { if(itemElement.parentNode) { itemElement.removeEventListener('transitionend', handleTransitionEnd); delete cart[itemNameKey]; updateCartPopup(); } }; itemElement.addEventListener('transitionend', handleTransitionEnd, { once: true }); setTimeout(() => { if (cart[itemNameKey]?.quantity <= 0) { delete cart[itemNameKey]; updateCartPopup(); } }, 350); return; } else { delete cart[itemNameKey]; } } updateCartPopup();
    }

    function updateCartPopup() {
        if (!cartItemsContainer || !cartTotalElement || !cartCounter || !checkoutButton) return; const scrollTop = cartItemsContainer.scrollTop; cartItemsContainer.innerHTML = ''; let total = 0; let itemCount = 0; const sortedCartKeys = Object.keys(cart).sort(); if (sortedCartKeys.length === 0) { cartPopup?.classList.add('empty'); } else { cartPopup?.classList.remove('empty'); sortedCartKeys.forEach(key => { if (!cart[key] || cart[key].quantity <= 0) { delete cart[key]; return; } const item = cart[key]; const itemElement = document.createElement('div'); itemElement.classList.add('cart-item'); const displayName = item.size ? `${item.name} (${item.size})` : item.name; itemElement.innerHTML = `<span>${displayName}</span><div class="quantity-controls"><button type="button" class="quantity-btn decrement-btn" data-item="${key}" aria-label="Уменьшить количество ${displayName}">-</button><span class="quantity">${item.quantity}</span><button type="button" class="quantity-btn increment-btn" data-item="${key}" aria-label="Увеличить количество ${displayName}">+</button></div><span class="item-price">${item.price * item.quantity} ₽</span>`; cartItemsContainer.appendChild(itemElement); total += item.price * item.quantity; itemCount += item.quantity; itemElement.querySelector('.decrement-btn')?.addEventListener('click', (e) => { e.stopPropagation(); decrementCart(key); }); itemElement.querySelector('.increment-btn')?.addEventListener('click', (e) => { e.stopPropagation(); incrementCart(key); }); }); } cartTotalElement.textContent = `${total} ₽`; cartCounter.textContent = itemCount; cartCounter.style.display = itemCount > 0 ? 'inline-block' : 'none'; checkoutButton.disabled = itemCount === 0; checkoutButton.style.opacity = itemCount === 0 ? '0.5' : '1'; checkoutButton.style.cursor = itemCount === 0 ? 'not-allowed' : 'pointer'; cartItemsContainer.scrollTop = scrollTop;
    }

    function toggleCartPopup() {
        if (!cartPopup) return; const isOpen = cartPopup.classList.toggle('active'); document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function clearCart() {
        cart = {}; updateCartPopup(); showToast('Корзина очищена', 'warning');
    }

    function toggleMobileMenu() {
        if (!mobileNav || !mobileMenuToggle) return; const isActive = mobileNav.classList.toggle('active'); document.body.style.overflow = isActive ? 'hidden' : ''; mobileMenuToggle.textContent = isActive ? '✕' : '☰'; mobileMenuToggle.setAttribute('aria-expanded', String(isActive));
    }

    function scrollNav(direction) {
       const scrollAmount = 200; if (desktopNavContainer) { desktopNavContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' }); }
    }

    function checkNavScroll() {
         if (!desktopNavContainer || !scrollLeftBtn || !scrollRightBtn) return; setTimeout(() => { const { scrollLeft, scrollWidth, clientWidth } = desktopNavContainer; scrollLeftBtn.style.display = scrollLeft > 1 ? 'flex' : 'none'; scrollRightBtn.style.display = scrollWidth > clientWidth + scrollLeft + 1 ? 'flex' : 'none'; }, 100);
    }

    function checkoutOrder() {
        if (Object.keys(cart).length === 0) { showToast("Ваша корзина пуста!", "error"); return; }
        if (!confirmationPopup || !confirmationOverlay) return;
        confirmationPopup.classList.add('visible');
        confirmationOverlay.classList.add('active');
        if (cartPopup?.classList.contains('active')) toggleCartPopup();
        const deliveryMethod = document.querySelector('input[name="delivery"]:checked')?.value;
        if(addressSection) { addressSection.style.display = deliveryMethod === 'delivery' ? 'block' : 'none'; if(addressInput) addressInput.required = (deliveryMethod === 'delivery'); }
        if(addressInput) addressInput.classList.remove('error'); document.body.style.overflow = 'hidden';
    }

    function confirmOrder() {
        const deliveryMethod = document.querySelector('input[name="delivery"]:checked')?.value; const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value; const address = addressInput ? addressInput.value.trim() : ''; const comment = commentInput ? commentInput.value.trim() : ''; const sticksCount = sticksInput ? (parseInt(sticksInput.value, 10) || 0) : 0; if (deliveryMethod === 'delivery' && address === '') { showToast('Пожалуйста, укажите адрес доставки.', 'error'); if(addressInput) { addressInput.focus(); addressInput.classList.add('error'); } return; } else if (addressInput) { addressInput.classList.remove('error'); } let orderDetails = "Здравствуйте! Хочу сделать заказ:\n\n"; let total = 0; Object.keys(cart).forEach(key => { const item = cart[key]; const displayName = item.size ? `${item.name} (${item.size})` : item.name; orderDetails += `- ${displayName}: ${item.quantity} шт. x ${item.price} ₽ = ${item.quantity * item.price} ₽\n`; total += item.quantity * item.price; }); orderDetails += `\nОбщая сумма: ${total} ₽\n`; orderDetails += `Палочки/Приборы: ${sticksCount} чел.\n`; orderDetails += `Способ получения: ${deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}\n`; if (deliveryMethod === 'delivery') orderDetails += `Адрес: ${address}\n`; orderDetails += `Способ оплаты: `; switch (paymentMethod) { case 'cash': orderDetails += 'Наличные'; break; case 'card': orderDetails += 'Карта курьеру'; break; case 'online': orderDetails += 'Онлайн (Перевод)'; break; default: orderDetails += 'Не указан'; break; } orderDetails += '\n'; if (comment) orderDetails += `Комментарий: ${comment}\n`; const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderDetails)}`;
        window.open(whatsappUrl, '_blank');
        if(confirmationPopup) confirmationPopup.classList.remove('visible');
        if(confirmationOverlay) confirmationOverlay.classList.remove('active');
        document.body.style.overflow = ''; clearCart(); showToast('Заказ сформирован и готов к отправке в WhatsApp!', 'success');
        if(addressInput) addressInput.value = ''; if(commentInput) commentInput.value = ''; document.querySelector('input[name="delivery"][value="pickup"]')?.setAttribute('checked', 'true'); document.querySelector('input[name="payment"][value="cash"]')?.setAttribute('checked', 'true'); if(addressSection) addressSection.style.display = 'none'; if(addressInput) addressInput.classList.remove('error');
    }

    function cancelOrder() {
        if(confirmationPopup) confirmationPopup.classList.remove('visible');
        if(confirmationOverlay) confirmationOverlay.classList.remove('active');
        document.body.style.overflow = ''; if(addressInput) addressInput.classList.remove('error');
    }

    function initSlider() {
        if (!sliderTrack) return; const sliderItems = sliderTrack.querySelectorAll('.slider-item'); if (sliderItems.length <= 1) return; let currentSlide = 0; let intervalId = setInterval(() => { currentSlide = (currentSlide + 1) % sliderItems.length; sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`; }, 3000); sliderTrack.addEventListener('mouseenter', () => clearInterval(intervalId)); sliderTrack.addEventListener('mouseleave', () => { intervalId = setInterval(() => { currentSlide = (currentSlide + 1) % sliderItems.length; sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`; }, 3000); });
    }

    function initShapes() {
        if (!shapesContainer) return; const shapes = shapesContainer.querySelectorAll('.shape'); if (shapes.length === 0) return; let shapeData = []; shapes.forEach(shape => { const rect = shape.getBoundingClientRect(); const shapeWidth = rect.width || 50; const shapeHeight = rect.height || 50; const x = Math.random() * (window.innerWidth - shapeWidth); const y = Math.random() * (window.innerHeight - shapeHeight); const dx = (Math.random() * 2 - 1) * 0.5; const dy = (Math.random() * 2 - 1) * 0.5; shape.style.left = `${x}px`; shape.style.top = `${y}px`; shapeData.push({ element: shape, x, y, dx, dy, width: shapeWidth, height: shapeHeight }); }); let animationFrameId = null; function updateShapes() { shapeData.forEach(data => { data.x += data.dx; data.y += data.dy; if (data.x < 0 || data.x + data.width > window.innerWidth) { data.dx = -data.dx; data.x = Math.max(0, Math.min(data.x, window.innerWidth - data.width)); } if (data.y < 0 || data.y + data.height > window.innerHeight) { data.dy = -data.dy; data.y = Math.max(0, Math.min(data.y, window.innerHeight - data.height)); } const translateX = data.x - parseFloat(data.element.style.left || 0); const translateY = data.y - parseFloat(data.element.style.top || 0); data.element.style.transform = `translate(${translateX}px, ${translateY}px)`; }); animationFrameId = requestAnimationFrame(updateShapes); } if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = requestAnimationFrame(updateShapes);
    }


    // --- Назначение обработчиков событий ---
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (searchButton) searchButton.addEventListener('click', filterProducts);
    if (priceRange) priceRange.addEventListener('input', updatePriceFilterValue);

    allNavContainers.forEach(container => {
        container.addEventListener('click', (event) => {
            const button = event.target.closest('.category-button');
            if (button?.dataset.category) filterCategory(button.dataset.category);
        });
    });

    if (productGrid) {
        productGrid.addEventListener('click', (event) => {
             const card = event.target.closest('.card'); if (!card) return; const addButton = event.target.closest('.add-to-cart-btn'); if (addButton) { const nameElement = card.querySelector('.product-name'); const name = nameElement ? nameElement.textContent : 'Неизвестный товар'; const price = parseFloat(addButton.dataset.price); const img = card.querySelector('img'); const selectedSizeElement = card.querySelector('.size-options .selected'); const size = selectedSizeElement ? selectedSizeElement.dataset.size : null; addToCart(name, price, img, event, size); return; } const sizeButton = event.target.closest('.size-options button'); if (sizeButton) { handleSizeSelection(sizeButton); return; }
        });
    }

    if (cartButton) cartButton.addEventListener('click', toggleCartPopup);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCartPopup);
    if (clearCartButton) clearCartButton.addEventListener('click', clearCart);
    if (checkoutButton) checkoutButton.addEventListener('click', checkoutOrder);

    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', toggleMobileMenu);

    if (scrollLeftBtn) scrollLeftBtn.addEventListener('click', () => scrollNav(-1));
    if (scrollRightBtn) scrollRightBtn.addEventListener('click', () => scrollNav(1));
    if (desktopNavContainer) {
         desktopNavContainer.addEventListener('scroll', checkNavScroll, { passive: true });
         window.addEventListener('load', checkNavScroll);
         window.addEventListener('resize', checkNavScroll);
    }

    if (confirmOrderButton) confirmOrderButton.addEventListener('click', confirmOrder);
    if (cancelOrderButton) cancelOrderButton.addEventListener('click', cancelOrder);

    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (!addressSection || !addressInput) return; const isDelivery = event.target.value === 'delivery'; addressSection.style.display = isDelivery ? 'block' : 'none'; addressInput.required = isDelivery; if (!isDelivery) addressInput.classList.remove('error');
        });
    });

     if (addressInput) {
         addressInput.addEventListener('input', () => {
             if (addressInput.value.trim() !== '') addressInput.classList.remove('error');
         });
     }

}); // Конец обработчика DOMContentLoaded