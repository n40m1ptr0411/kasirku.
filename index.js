const hamburgerMenu = document.querySelector("#hamburger-menu");
const navbarNav = document.querySelector(".navbar-nav");
const savedCart = localStorage.getItem("cart");
const cart = savedCart ? JSON.parse(savedCart) : [];

hamburgerMenu?.addEventListener("click", (event) => {
  event.preventDefault();

  const isOpen = navbarNav.classList.toggle("active");
  hamburgerMenu.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", (event) => {
  if (
    navbarNav &&
    hamburgerMenu &&
    !navbarNav.contains(event.target) &&
    !hamburgerMenu.contains(event.target)
  ) {
    navbarNav.classList.remove("active");
    hamburgerMenu.setAttribute("aria-expanded", "false");
  }
});

// Fungsi untuk memformat angka menjadi format Rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

// Fungsi untuk membuat HTML dari 1 item produk
function createProductCard(product) {
  return `
    <div class="card" data-id="${product.id}">
      <img src="${product.image}" alt="${product.alt || product.name}" />
      <h2>${product.name}</h2>
      <p>${product.description}</p>
      <h2 class="price">${formatRupiah(product.price)}</h2>
      <button class="buy-btn" type="button">Beli Sekarang!</button>
    </div>
  `;
}

function createCartCard(item) {
  return `
    <div class="card cart-card" data-id="${item.product.id}">
      <img src="${item.product.image}" alt="${item.product.alt || item.product.name}" />
      <h2>${item.product.name}</h2>
      <p>${item.product.description}</p>
      <h2 class="price">${formatRupiah(item.product.price)}</h2>
      <div class="quantity-control">
        <button class="quantity-btn" type="button" data-action="decrease" aria-label="Kurangi jumlah">-</button>
        <input class="quantity-input" type="number" min="1" value="${item.quantity}" aria-label="Jumlah ${item.product.name}" />
        <button class="quantity-btn" type="button" data-action="increase" aria-label="Tambah jumlah">+</button>
      </div>
      <button class="remove-btn" type="button" data-action="remove">Hapus</button>
    </div>
  `;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartSummary() {
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const cartItems = document.querySelector("#cart-items");
  const totalQuantityElement = document.querySelector("#cart-total-quantity");
  const totalPriceElement = document.querySelector("#cart-total-price");
  const cartCount = document.querySelector("#cart-count");

  if (cartItems) {
    cartItems.innerHTML = cart.length
      ? cart.map(createCartCard).join("")
      : '<p class="empty-cart">Keranjang masih kosong.</p>';
  }
  if (totalQuantityElement) totalQuantityElement.textContent = totalQuantity;
  if (totalPriceElement)
    totalPriceElement.textContent = formatRupiah(totalPrice);
  if (cartCount) cartCount.textContent = totalQuantity;
}

function addToCart(productId) {
  const product = productsData.find((item) => item.id === productId);
  const existingItem = cart.find((item) => item.product.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else if (product) {
    cart.push({ product, quantity: 1 });
  }

  saveCart();
  updateCartSummary();
}

function updateCartQuantity(productId, quantity) {
  const item = cart.find((cartItem) => cartItem.product.id === productId);
  if (!item) return;

  item.quantity = Math.max(1, Number(quantity) || 1);
  saveCart();
  updateCartSummary();
}

function handleCartAction(event) {
  const button = event.target.closest("button");
  const card = event.target.closest(".cart-card");

  if (button?.classList.contains("buy-btn")) {
    addToCart(button.closest(".card").dataset.id);
    return;
  }

  if (!card) return;

  const item = cart.find((cartItem) => cartItem.product.id === card.dataset.id);
  if (!item) return;

  if (button?.dataset.action === "increase") {
    updateCartQuantity(card.dataset.id, item.quantity + 1);
  } else if (button?.dataset.action === "decrease") {
    updateCartQuantity(card.dataset.id, item.quantity - 1);
  } else if (button?.dataset.action === "remove") {
    cart.splice(cart.indexOf(item), 1);
    saveCart();
    updateCartSummary();
  }
}

function handleQuantityInput(event) {
  if (!event.target.classList.contains("quantity-input")) return;
  updateCartQuantity(
    event.target.closest(".cart-card").dataset.id,
    event.target.value,
  );
}

function goToCheckout() {
  if (!cart.length) return;
  window.location.href = "checkout.html";
}

function calculateTransaction() {
  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const discountRate = subtotal >= 500000 ? 0.1 : subtotal >= 300000 ? 0.05 : 0;
  const discount = subtotal * discountRate;

  return {
    totalQuantity,
    subtotal,
    discount,
    totalPayment: subtotal - discount,
  };
}

function renderCheckout() {
  const checkoutItems = document.querySelector("#checkout-items");
  if (!checkoutItems) return;

  const transaction = calculateTransaction();

  checkoutItems.innerHTML = cart.length
    ? cart
        .map(
          (item) => `
            <div class="checkout-item">
              <span>${item.product.name} x ${item.quantity}</span>
              <strong>${formatRupiah(item.product.price * item.quantity)}</strong>
            </div>
          `,
        )
        .join("")
    : '<p class="empty-cart">Keranjang masih kosong.</p>';

  document.querySelector("#checkout-total-quantity").textContent =
    transaction.totalQuantity;
  document.querySelector("#checkout-subtotal").textContent = formatRupiah(
    transaction.subtotal,
  );
  document.querySelector("#checkout-discount").textContent = formatRupiah(
    transaction.discount,
  );
  document.querySelector("#checkout-total-price").textContent = formatRupiah(
    transaction.totalPayment,
  );
}

function confirmOrder() {
  if (!cart.length) {
    alert("Keranjang kamu masih kosong!");
    return;
  }

  const result = document.querySelector("#transaction-result");
  const transaction = calculateTransaction();

  if (result) {
    result.innerHTML = `
      <h2>Transaksi Berhasil</h2>
      <p>Total jumlah barang: <strong>${transaction.totalQuantity}</strong></p>
      <p>Subtotal: <strong>${formatRupiah(transaction.subtotal)}</strong></p>
      <p>Diskon: <strong>${formatRupiah(transaction.discount)}</strong></p>
      <p>Total pembayaran: <strong>${formatRupiah(transaction.totalPayment)}</strong></p>
    `;
    result.hidden = false;
  }

  document.querySelector("#confirm-order-btn").disabled = true;
  localStorage.removeItem("cart");
}

// Event Listener tambahan
document
  .querySelector("#confirm-order-btn")
  ?.addEventListener("click", confirmOrder);

// Fungsi untuk merender seluruh produk berdasarkan kategorinya
function renderProducts() {
  if (typeof productsData === "undefined") {
    return;
  }

  // Ambil semua elemen wadah/container di HTML berdasarkan id kategori
  const categories = ["electronic", "life-style", "home-supplies", "health"];

  categories.forEach((category) => {
    const container = document.querySelector(`#${category} .product-row`);
    if (container) {
      // Filter produk berdasarkan kategori
      const filteredProducts = productsData.filter(
        (p) => p.category === category,
      );

      // Gabungkan HTML product card dan masukkan ke container
      container.innerHTML = filteredProducts
        .map((product) => createProductCard(product))
        .join("");
    }
  });
}

// Jalankan fungsi render setelah halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartSummary();
  renderCheckout();
});
document.addEventListener("click", handleCartAction);
document.addEventListener("change", handleQuantityInput);
document
  .querySelector("#checkout-btn")
  ?.addEventListener("click", goToCheckout);
