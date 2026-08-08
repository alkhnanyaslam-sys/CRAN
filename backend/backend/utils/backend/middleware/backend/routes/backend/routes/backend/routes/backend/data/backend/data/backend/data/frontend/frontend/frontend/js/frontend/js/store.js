// js/store.js
// Storefront behavior: load products from the API, manage the cart
// in memory, and submit orders through Api.placeOrder().

let PRODUCTS = [];
let CART = []; // {productId, name, price, size, qty, emoji}
const selectedSize = {};

async function init() {
  try {
    PRODUCTS = await Api.getProducts();
  } catch (e) {
    toast('تعذر تحميل المنتجات — تأكد إن السيرفر شغال');
    PRODUCTS = [];
  }
  renderProducts();
  renderCart();
}
init();

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- PRODUCTS ---------------- */
function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  PRODUCTS.forEach((p) => {
    if (!selectedSize[p.id]) selectedSize[p.id] = p.sizes.find((s) => p.stock[s] > 0) || p.sizes[0];
    const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img">${p.emoji}</div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-price">${p.price} ج.م</div>
        <div class="card-sizes">${p.sizes.map((s) => `<span class="size-chip ${selectedSize[p.id] === s ? 'active' : ''}" ${p.stock[s] <= 0 ? 'style="opacity:.35;text-decoration:line-through;"' : ''} onclick="pickSize('${p.id}','${s}')">${s}</span>`).join('')}</div>
        ${totalStock <= 5 && totalStock > 0 ? `<div class="stock-low">باقي ${totalStock} قطع بس!</div>` : ''}
        <button class="add-btn" ${p.stock[selectedSize[p.id]] <= 0 ? 'disabled' : ''} onclick="addToCart('${p.id}')">${p.stock[selectedSize[p.id]] <= 0 ? 'نفدت الكمية' : 'أضف للسلة'}</button>
      </div>`;
    grid.appendChild(card);
  });
}
function pickSize(pid, size) {
  selectedSize[pid] = size;
  renderProducts();
}
function addToCart(pid) {
  const p = PRODUCTS.find((x) => x.id === pid);
  const size = selectedSize[pid];
  if (p.stock[size] <= 0) { toast('نفدت هذه الكمية'); return; }
  const existing = CART.find((c) => c.productId === pid && c.size === size);
  if (existing) {
    if (existing.qty >= p.stock[size]) { toast('وصلت للحد الأقصى المتاح'); return; }
    existing.qty += 1;
  } else {
    CART.push({ productId: pid, name: p.name, price: p.price, size, qty: 1, emoji: p.emoji });
  }
  renderCart();
  toast('اتضافت للسلة ✓');
}

/* ---------------- CART ---------------- */
function openCart() { document.getElementById('drawer').classList.add('show'); document.getElementById('overlay').classList.add('show'); }
function closeCart() { document.getElementById('drawer').classList.remove('show'); document.getElementById('overlay').classList.remove('show'); }
function closeAll() { closeCart(); closeCheckout(); }

function renderCart() {
  const body = document.getElementById('cart-body');
  const count = CART.reduce((a, c) => a + c.qty, 0);
  document.getElementById('cart-count').textContent = count;
  document.getElementById('checkout-open-btn').disabled = CART.length === 0;

  if (CART.length === 0) {
    body.innerHTML = '<div class="empty-cart">السلة فاضية — يلا اختار حاجة تعجبك 👑</div>';
  } else {
    body.innerHTML = CART.map((c, i) => `
      <div class="cart-item">
        <div class="cart-item-img">${c.emoji}</div>
        <div class="cart-item-info">
          <div class="n">${c.name}</div>
          <div class="m">مقاس: ${c.size} — ${c.price} ج.م</div>
          <div class="qty-row">
            <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
            <span>${c.qty}</span>
            <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
            <button class="remove-btn" onclick="removeItem(${i})">حذف</button>
          </div>
        </div>
      </div>`).join('');
  }
  const total = CART.reduce((a, c) => a + c.price * c.qty, 0);
  document.getElementById('cart-total').textContent = total + ' ج.م';
}
function changeQty(i, delta) {
  const item = CART[i];
  const p = PRODUCTS.find((x) => x.id === item.productId);
  const newQty = item.qty + delta;
  if (newQty <= 0) { CART.splice(i, 1); }
  else if (newQty > p.stock[item.size]) { toast('مفيش كمية أكتر من كده متاحة'); return; }
  else { item.qty = newQty; }
  renderCart();
}
function removeItem(i) { CART.splice(i, 1); renderCart(); }

/* ---------------- CHECKOUT ---------------- */
const PAY_METHODS = [
  { id: 'cod', icon: '💵', title: 'الدفع عند الاستلام (COD)', sub: 'تدفع كاش لما الطلب يوصلك' },
  { id: 'vodafone', icon: '📱', title: 'فودافون كاش', sub: 'تحويل على رقم المحفظة' },
  { id: 'instapay', icon: '🏦', title: 'InstaPay', sub: 'تحويل فوري من أي بنك' },
  { id: 'fawry', icon: '🧾', title: 'فوري', sub: 'كود دفع تدفعه من أقرب فوري' },
];
let selectedPay = 'cod';

function openCheckout() {
  closeCart();
  renderPayOptions();
  document.getElementById('checkout-modal').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}
function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}
function renderPayOptions() {
  const wrap = document.getElementById('pay-options');
  wrap.innerHTML = PAY_METHODS.map((m) => `
    <label class="pay-opt ${selectedPay === m.id ? 'active' : ''}" onclick="selectPay('${m.id}')">
      <input type="radio" name="pay" ${selectedPay === m.id ? 'checked' : ''}>
      <span class="pi">${m.icon}</span>
      <span>
        <div class="pt">${m.title}</div>
        <div class="ps">${m.sub}</div>
      </span>
    </label>`).join('');
  updatePayNote();
}
function selectPay(id) { selectedPay = id; renderPayOptions(); }
function updatePayNote() {
  const notes = {
    cod: 'هيتصل بيك المندوب لتأكيد الطلب قبل الشحن.',
    vodafone: 'بعد تأكيد الطلب هيوصلك رقم المحفظة على الواتساب لتحويل المبلغ.',
    instapay: 'بعد تأكيد الطلب هيوصلك لينك الدفع عبر InstaPay.',
    fawry: 'بعد تأكيد الطلب هتاخد كود فوري صالح 48 ساعة.',
  };
  document.getElementById('pay-note').textContent = notes[selectedPay];
}

async function placeOrder() {
  const name = document.getElementById('ck-name').value.trim();
  const phone = document.getElementById('ck-phone').value.trim();
  const city = document.getElementById('ck-city').value.trim();
  const address = document.getElementById('ck-address').value.trim();

  if (!name || !phone || !city || !address) { toast('من فضلك املأ كل البيانات'); return; }
  if (!/^01[0-9]{9}$/.test(phone)) { toast('رقم الموبايل غلط — تأكد إنه يبدأ بـ 01'); return; }

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true; btn.textContent = 'جاري تأكيد الطلب...';

  try {
    const order = await Api.placeOrder({
      items: CART.map((c) => ({ productId: c.productId, size: c.size, qty: c.qty })),
      customer: { name, phone, city, address },
      payment: PAY_METHODS.find((m) => m.id === selectedPay).title,
    });

    document.getElementById('checkout-body').innerHTML = `
      <div class="order-success">
        <div class="chk">✅</div>
        <h3>تم استلام طلبك!</h3>
        <p>رقم الطلب: <b>${order.id}</b><br>الإجمالي: <b>${order.total} ج.م</b><br>${document.getElementById('pay-note').textContent}</p>
        <button class="place-btn" style="margin-top:20px;" onclick="location.reload()">تمام</button>
      </div>`;

    CART = [];
  } catch (e) {
    toast(e.message);
    btn.disabled = false; btn.textContent = 'تأكيد الطلب';
  }
    }
