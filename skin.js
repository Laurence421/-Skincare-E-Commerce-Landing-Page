const menuBtn = document.querySelector('#menuBtn');
const items = document.querySelector('#menu');
menuBtn.addEventListener('click', () =>{
    items.classList.toggle('open-items');
});

document.querySelector('main').addEventListener('click', () =>{
    items.classList.remove('open-items');
});

// Close the mobile menu after a link inside it is chosen
items.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => items.classList.remove('open-items'));
});

let lastScrollTop = 0;

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  if (currentScroll > lastScrollTop) {

    items.classList.remove('open-items');

  }

  // Prevent negative scrolling bugs on mobile devices
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

// ---------- Helpers ----------
const naira = n => '₦' + n.toLocaleString('en-NG');

function load(key, fallback){
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
}
function save(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const toast = document.querySelector('#toast');
let toastId;
function showToast(message){
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastId);
    toastId = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ---------- Products ----------
const cards = [...document.querySelectorAll('.product-card')];
const products = {};
cards.forEach(card => {
    const { id, name, price, img } = card.dataset;
    products[id] = { id, name, price: Number(price), img };
});

// ---------- Cart & wishlist state ----------
let cart = load('xg-cart', {});          // { productId: quantity }
let wishlist = load('xg-wishlist', []);  // [productId]
let promo = load('xg-promo', false);

const cartCount = document.querySelector('#cartCount');
const wishCount = document.querySelector('#wishCount');

function updateBadges(){
    const cartTotal = Object.values(cart).reduce((a, b) => a + b, 0);
    cartCount.textContent = cartTotal;
    cartCount.classList.toggle('hidden', cartTotal === 0);
    wishCount.textContent = wishlist.length;
    wishCount.classList.toggle('hidden', wishlist.length === 0);

    cards.forEach(card => {
        const saved = wishlist.includes(card.dataset.id);
        const btn = card.querySelector('.wish-btn');
        btn.classList.toggle('active', saved);
        btn.setAttribute('aria-label', saved ? 'Remove from wishlist' : 'Add to wishlist');
    });
}

function addToCart(id){
    cart[id] = (cart[id] || 0) + 1;
    save('xg-cart', cart);
    updateBadges();
    renderDrawer();
}

function toggleWish(id){
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(w => w !== id);
        showToast(`${products[id].name} removed from wishlist`);
    } else {
        wishlist.push(id);
        showToast(`${products[id].name} added to wishlist`);
    }
    save('xg-wishlist', wishlist);
    updateBadges();
    renderDrawer();
}

cards.forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.add-to-cart').addEventListener('click', () => {
        addToCart(id);
        showToast(`${products[id].name} added to cart`);
    });
    card.querySelector('.wish-btn').addEventListener('click', () => toggleWish(id));
});

// ---------- Drawer (cart / wishlist) ----------
const drawer = document.querySelector('#drawer');
const overlay = document.querySelector('#overlay');
const drawerTitle = document.querySelector('#drawerTitle');
const drawerList = document.querySelector('#drawerList');
const cartFooter = document.querySelector('#cartFooter');
let drawerMode = 'cart';

function openDrawer(mode){
    drawerMode = mode;
    renderDrawer();
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('hidden');
    items.classList.remove('open-items');
}
function closeDrawer(){
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.add('hidden');
}

document.querySelector('#cartBtn').addEventListener('click', e => { e.stopPropagation(); openDrawer('cart'); });
document.querySelector('#wishBtn').addEventListener('click', e => { e.stopPropagation(); openDrawer('wishlist'); });
document.querySelector('#drawerClose').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

function itemRow(p, controls){
    return `
    <li class="flex gap-3 items-center bg-[#F0F0F0] rounded-lg p-3">
        <img src="${p.img}" alt="${p.name}" class="w-16 h-16 object-contain">
        <section class="flex-1">
            <p class="font-medium">${p.name}</p>
            <p class="text-gray-600">${naira(p.price)}</p>
            ${controls}
        </section>
    </li>`;
}

function renderDrawer(){
    if (drawerMode === 'wishlist') {
        drawerTitle.textContent = 'Your Wishlist';
        cartFooter.classList.add('hidden');
        drawerList.innerHTML = wishlist.length
            ? wishlist.map(id => itemRow(products[id], `
                <section class="flex gap-3 mt-2">
                    <button data-action="move" data-id="${id}" class="underline cursor-pointer">Add to cart</button>
                    <button data-action="unwish" data-id="${id}" class="underline text-gray-500 cursor-pointer">Remove</button>
                </section>`)).join('')
            : '<li class="text-center text-gray-500 py-10">Your wishlist is empty.</li>';
        return;
    }

    drawerTitle.textContent = 'Your Cart';
    const ids = Object.keys(cart);
    cartFooter.classList.toggle('hidden', ids.length === 0);
    drawerList.innerHTML = ids.length
        ? ids.map(id => itemRow(products[id], `
            <section class="flex items-center gap-3 mt-2">
                <button data-action="dec" data-id="${id}" class="w-8 h-8 rounded-full bg-white border border-gray-300 cursor-pointer" aria-label="Decrease quantity">−</button>
                <span>${cart[id]}</span>
                <button data-action="inc" data-id="${id}" class="w-8 h-8 rounded-full bg-white border border-gray-300 cursor-pointer" aria-label="Increase quantity">+</button>
                <button data-action="remove" data-id="${id}" class="ml-auto underline text-gray-500 cursor-pointer">Remove</button>
            </section>`)).join('')
        : '<li class="text-center text-gray-500 py-10">Your cart is empty.</li>';

    const subtotal = ids.reduce((sum, id) => sum + products[id].price * cart[id], 0);
    const discount = promo ? Math.round(subtotal * 0.2) : 0;
    document.querySelector('#subtotal').textContent = naira(subtotal);
    document.querySelector('#discount').textContent = '-' + naira(discount);
    document.querySelector('#discountRow').classList.toggle('hidden', !promo);
    document.querySelector('#total').textContent = naira(subtotal - discount);
}

drawerList.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'inc') cart[id]++;
    if (action === 'dec') cart[id]--;
    if (action === 'remove' || cart[id] <= 0) delete cart[id];
    if (action === 'move') { addToCart(id); showToast(`${products[id].name} added to cart`); return; }
    if (action === 'unwish') { toggleWish(id); return; }
    save('xg-cart', cart);
    updateBadges();
    renderDrawer();
});

document.querySelector('#promoForm').addEventListener('submit', e => {
    e.preventDefault();
    const code = e.target.code.value.trim().toUpperCase();
    if (code === 'GLOW20') {
        promo = true;
        save('xg-promo', true);
        showToast('Promo code applied: 20% off!');
    } else {
        showToast('Invalid promo code');
    }
    e.target.reset();
    renderDrawer();
});

document.querySelector('#checkoutBtn').addEventListener('click', () => {
    cart = {};
    promo = false;
    save('xg-cart', cart);
    save('xg-promo', false);
    updateBadges();
    closeDrawer();
    showToast('Thank you! Your order has been placed.');
});

// ---------- Search & category filter ----------
const filterInfo = document.querySelector('#filterInfo');
const noResults = document.querySelector('#noResults');
const searchInputs = document.querySelectorAll('.search-input');

function applyFilter(test, label){
    let shown = 0;
    cards.forEach(card => {
        const match = test(card);
        card.classList.toggle('hidden', !match);
        if (match) shown++;
    });
    noResults.classList.toggle('hidden', shown > 0);
    filterInfo.classList.toggle('hidden', !label);
    filterInfo.innerHTML = label
        ? `Showing ${label} (${shown}) · <button id="clearFilter" class="underline font-medium cursor-pointer">Clear</button>`
        : '';
}
function clearFilter(){
    searchInputs.forEach(input => input.value = '');
    applyFilter(() => true, '');
}

document.querySelectorAll('.search-form').forEach(form => {
    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = form.querySelector('.search-input').value.trim().toLowerCase();
        searchInputs.forEach(input => input.value = q);
        items.classList.remove('open-items');
        if (!q) return clearFilter();
        applyFilter(card => card.dataset.name.toLowerCase().includes(q), `results for “${q}”`);
        document.querySelector('#products').scrollIntoView();
    });
});

document.querySelectorAll('[data-filter]').forEach(link => {
    link.addEventListener('click', () => {
        const cat = link.dataset.filter;
        applyFilter(card => card.dataset.category.split(' ').includes(cat), link.textContent.trim());
    });
});

document.querySelector('#viewAll').addEventListener('click', clearFilter);
document.querySelector('#clearSearch').addEventListener('click', clearFilter);
filterInfo.addEventListener('click', e => { if (e.target.id === 'clearFilter') clearFilter(); });

// ---------- Promo code copy ----------
document.querySelector('#copyCode').addEventListener('click', () => {
    navigator.clipboard?.writeText('GLOW20')
        .then(() => showToast('Code GLOW20 copied!'))
        .catch(() => showToast('Use code GLOW20 at checkout'));
});

// ---------- Blog post ----------
const guideMore = document.querySelector('#guideMore');
const guideDots = document.querySelector('#guideDots');
const continueBtn = document.querySelector('#continueReading');
function toggleGuide(){
    const open = guideMore.classList.toggle('hidden') === false;
    guideDots.classList.toggle('hidden', open);
    continueBtn.textContent = open ? 'Show less' : 'Continue Reading';
}
continueBtn.addEventListener('click', toggleGuide);
document.querySelector('#readMore').addEventListener('click', () => {
    if (guideMore.classList.contains('hidden')) toggleGuide();
    guideMore.scrollIntoView({ block: 'center' });
});

// ---------- Newsletter ----------
document.querySelector('#newsletter').addEventListener('submit', e => {
    e.preventDefault();
    const msg = document.querySelector('#newsletterMsg');
    const email = e.target.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = 'Please enter a valid email address.';
        msg.className = 'text-sm text-center min-h-5 text-red-400';
        return;
    }
    const subscribers = load('xg-subscribers', []);
    if (!subscribers.includes(email)) subscribers.push(email);
    save('xg-subscribers', subscribers);
    msg.textContent = 'Thanks for subscribing! We’ll keep you posted.';
    msg.className = 'text-sm text-center min-h-5 text-green-400';
    e.target.reset();
});

// ---------- Placeholder links ----------
document.querySelector('#accountBtn').addEventListener('click', () => showToast('Accounts are coming soon'));
document.querySelectorAll('[data-soon]').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); showToast('This page is coming soon'); });
});

document.querySelector('#year').textContent = new Date().getFullYear();

updateBadges();
renderDrawer();

// ---------- Offer countdown ----------
const timer = document.querySelector('#clock');

// Keep the same deadline across reloads; start a new offer window once it ends
const offerLength = 12 * 30 * 56 * 1000;
let deadline = load('xg-deadline', 0);
if (deadline < Date.now()) {
    deadline = Date.now() + offerLength;
    save('xg-deadline', deadline);
}

function update(){
    const totalSeconds = Math.max(0, Math.round((deadline - Date.now()) / 1000));
    if (totalSeconds <= 0) {
        clearInterval(timerId);
        timer.textContent = "Time's up!";
        return;
    }
    let hr = Math.floor((totalSeconds / 3600));
    let mn = Math.floor((totalSeconds % 3600 / 60));
    let sec = totalSeconds % 60;

    hr = String(hr).padStart(2,'0');
    mn = String(mn).padStart(2,'0');
    sec = String(sec).padStart(2,'0');

    timer.textContent = `${hr}hrs ${mn}mins ${sec}sec`;
}

const timerId = setInterval(update, 1000);
update();
