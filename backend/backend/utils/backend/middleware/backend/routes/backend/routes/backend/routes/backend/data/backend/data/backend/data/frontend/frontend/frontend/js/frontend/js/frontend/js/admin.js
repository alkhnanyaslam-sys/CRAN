// js/admin.js
// Admin dashboard: PIN login, orders management, product management,
// and settings (change PIN). Talks to the backend via Api (api.js).

let TOKEN = sessionStorage.getItem('crwn_admin_token') || null;
let ORDERS = [];
let PRODUCTS = [];

if (TOKEN) {
  document.getElementById('pin-screen').style.display = 'none';
  document.getElementById('admin-view').style.display = 'block';
  loadAdminData();
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------- LOGIN ---------------- */
async function checkPin() {
  const pin = document.getElementById('pin-input').value;
  try {
    const { token } = await Api.login(pin);
    TOKEN = token;
    sessionStorage.setItem('crwn_admin_token', token);
    document.getElementById('pin-screen').style.display = 'none';
    document.getElementById('admin-view').style.display = 'block';
    loadAdminData();
  } catch (e) {
    document.getElementById('pin-error').textContent = e.message;
  }
}
function logout() {
  sessionStorage.removeItem('crwn_admin_token');
  location.reload();
}

/* ---------------- LOAD DATA ---------------- */
async function loadAdminData() {
  try {
    [ORDERS, PRODUCTS] = await Promise.all([Api.getOrders(TOKEN), Api.getProducts()]);
  } catch (e) {
    toast('انتهت الجلسة — سجل دخول تاني');
    logout();
    return;
  }
  renderStats();
  renderOrdersTab();
  renderProductsTab();
  renderSettingsTab();
}

/* ---------------- TABS ---------------- */
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.getElementById('tab-orders').style.display = name === 'orders' ? 'block' : 'none';
  document.getElementById('tab-products').style.display = name === 'products' ? 'block' : 'none';
  document.getElementById('tab-settings').style.display = name === 'settings' ? 'block' : 'none';
}

/* ---------------- STATS ---------------- */
function renderStats() {
  const totalOrders = ORDERS.length;
  const totalRevenue = ORDERS.reduce((a, o) => a + o.total, 0);
  const newOrders = ORDERS.filter((o) => o.status === 'جديد').length;
  const totalStock = PRODUCTS.reduce((a, p) => a + Object.values(p.stock).reduce((x, y) => x + y, 0), 0);
  document.getElementById('stat-row').innerHTML = `
    <div class="stat-box"><div class="v">${totalOrders}</div><div class="l">إجمالي الطلبات</div></div>
    <div class="stat-box"><div class="v">${totalRevenue}</div><div class="l">إجمالي المبيعات (ج.م)</div></div>
    <div class="stat-box"><div class="v">${newOrders}</div><div class="l">طلبات جديدة</div></div>
    <div class="stat-box"><div class="v">${totalStock}</div><div class="l">قطع متاحة بالمخزون</div></div>
  `;
}

/* ---------------- ORDERS ---------------- */
function renderOrdersTab() {
  const wrap = document.getElementById('tab-orders');
  if (ORDERS.length === 0) {
    wrap.innerHTML = '<p style="color:var(--muted);padding:20px 0;">لسه مفيش طلبات.</p>';
    return;
  }
  wrap.innerHTML = `
    <div style="overflow-x:auto;">
    <table class="admin-table">
      <thead><tr>
        <th>رقم الطلب</th><th>العميل</th><th>المنتجات</th><th>الدفع</th><th>الإجمالي</th><th>الحالة</th>
      </tr></thead>
      <tbody>
        ${ORDERS.map((o) => `
          <tr>
            <td>${o.id}<br><span style="color:var(--muted);font-size:11px;">${new Date(o.createdAt).toLocaleDateString('ar-EG')}</span></td>
            <td>${o.customer.name}<br><span style="color:var(--muted);font-size:11px;">${o.customer.phone}<br>${o.customer.city}</span></td>
            <td>${o.items.map((it) => `${it.name} (${it.size}) x${it.qty}`).join('<br>')}</td>
            <td>${o.payment}</td>
            <td>${o.total} ج.م</td>
            <td>
              <select class="status-select" onchange="updateStatus('${o.id}', this.value)">
                ${['جديد', 'تم التأكيد', 'تم الشحن', 'ملغي'].map((s) => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    </div>`;
}
async function updateStatus(id, status) {
  try {
    await Api.updateOrderStatus(id, status, TOKEN);
    const order = ORDERS.find((o) => o.id === id);
    order.status = status;
    renderStats();
    toast('اتحدثت حالة الطلب ✓');
  } catch (e) {
    toast(e.message);
  }
}

/* ---------------- PRODUCTS ---------------- */
function renderProductsTab() {
  const wrap = document.getElementById('tab-products');
  wrap.innerHTML = `
    <div class="admin-card">
      <h4>إضافة منتج جديد</h4>
      <div class="row-2">
        <div class="field"><label>اسم المنتج</label><input id="np-name"></div>
        <div class="field"><label>السعر (ج.م)</label><input id="np-price" type="number"></div>
      </div>
      <div class="row-2">
        <div class="field"><label>إيموجي / أيقونة</label><input id="np-emoji" placeholder="👕" value="👕"></div>
        <div class="field"><label>المقاسات (افصل بفاصلة)</label><input id="np-sizes" placeholder="S,M,L,XL" value="S,M,L,XL"></div>
      </div>
      <div class="field"><label>الكمية لكل مقاس (رقم واحد لكل المقاسات)</label><input id="np-stock" type="number" value="10"></div>
      <button class="small-btn" onclick="addProduct()">+ إضافة المنتج</button>
    </div>
    <div class="admin-card">
      <h4>المنتجات الحالية</h4>
      ${PRODUCTS.map((p) => `
        <div class="product-row">
          <div class="pimg">${p.emoji}</div>
          <div>
            <div class="pname">${p.name}</div>
            <div class="pmeta">${p.price} ج.م — مخزون: ${Object.entries(p.stock).map(([s, q]) => `${s}:${q}`).join(' | ')}</div>
          </div>
          <div class="product-actions">
            <button class="small-btn danger" onclick="deleteProduct('${p.id}')">حذف</button>
          </div>
        </div>`).join('')}
    </div>`;
}
async function addProduct() {
  const name = document.getElementById('np-name').value.trim();
  const price = parseFloat(document.getElementById('np-price').value);
  const emoji = document.getElementById('np-emoji').value.trim() || '👕';
  const sizesRaw = document.getElementById('np-sizes').value.trim();
  const stockPerSize = parseInt(document.getElementById('np-stock').value) || 0;
  if (!name || !price || !sizesRaw) { toast('املأ كل الحقول'); return; }
  const sizes = sizesRaw.split(',').map((s) => s.trim()).filter(Boolean);

  try {
    await Api.addProduct({ name, price, emoji, sizes, stockPerSize }, TOKEN);
    toast('اتضاف المنتج ✓');
    PRODUCTS = await Api.getProducts();
    renderProductsTab();
    renderStats();
  } catch (e) {
    toast(e.message);
  }
}
async function deleteProduct(id) {
  if (!confirm('متأكد إنك عايز تحذف المنتج ده؟')) return;
  try {
    await Api.deleteProduct(id, TOKEN);
    PRODUCTS = PRODUCTS.filter((p) => p.id !== id);
    renderProductsTab();
    renderStats();
  } catch (e) {
    toast(e.message);
  }
}

/* ---------------- SETTINGS ---------------- */
function renderSettingsTab() {
  const wrap = document.getElementById('tab-settings');
  wrap.innerHTML = `
    <div class="admin-card">
      <h4>تغيير الرقم السري للوحة التحكم</h4>
      <div class="field"><label>رقم سري جديد (4-6 أرقام)</label><input id="new-pin" type="password" maxlength="6"></div>
      <button class="small-btn" onclick="changePin()">حفظ</button>
    </div>
    <div class="admin-card">
      <h4>ملاحظة عن الدفع الإلكتروني</h4>
      <p style="color:var(--muted); font-size:13px; line-height:1.8;">
        طرق الدفع المفعّلة دلوقتي (كاش عند الاستلام، فودافون كاش، InstaPay، فوري) بتسجل اختيار العميل مع بيانات الطلب.
        عشان تفعّل دفع إلكتروني حقيقي أونلاين محتاج تتعاقد مع بوابة دفع زي Paymob أو Fawry Pay أو Kashier،
        وتاخد منهم مفاتيح API رسمية بعد تسجيل نشاطك التجاري.
      </p>
    </div>`;
}
async function changePin() {
  const val = document.getElementById('new-pin').value.trim();
  if (val.length < 4) { toast('لازم يكون 4 أرقام على الأقل'); return; }
  try {
    await Api.changePin(val, TOKEN);
    toast('اتغير الرقم السري ✓');
    document.getElementById('new-pin').value = '';
  } catch (e) {
    toast(e.message);
  }
}
