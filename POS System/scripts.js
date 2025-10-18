let products = [];
let sales = [];
let cart = [];

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  loadData();
  setupEventListeners();
  renderProducts();
  renderInventoryTable();
  renderSalesTable();
  updateDashboard();
  showTab("pos"); // Start on the POS tab
}

function loadData() {
  const savedProducts = localStorage.getItem("pos-products");
  if (savedProducts) {
    products = JSON.parse(savedProducts);
  }

  const savedSales = localStorage.getItem("pos-sales");
  if (savedSales) {
    sales = JSON.parse(savedSales);
  }
}

function saveData() {
  localStorage.setItem("pos-products", JSON.stringify(products));
  localStorage.setItem("pos-sales", JSON.stringify(sales));
}

function setupEventListeners() {
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const tab = this.getAttribute("data-tab");
      showTab(tab);

      document.querySelectorAll(".nav-links a").forEach((a) => {
        a.classList.remove("active");
      });
      this.classList.add("active");
    });
  });

  document
    .querySelector(".hamburger")
    .addEventListener("click", function () {
      document.querySelector(".nav-links").classList.toggle("active");
    });

  document
    .getElementById("total-transactions-card")
    .addEventListener("click", showTransactionDetails);
  document
    .getElementById("low-stock-items-card")
    .addEventListener("click", showLowStockItems);

  document
    .getElementById("add-product-btn")
    .addEventListener("click", function () {
      openProductModal();
    });

  document.querySelectorAll(".close-modal").forEach((button) => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.style.display = "none";
      });
    });
  });

  document
    .getElementById("product-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      saveProduct();
    });

  document
    .getElementById("product-image")
    .addEventListener("input", function () {
      updateImagePreview(this.value);
    });

  document
    .getElementById("checkout-btn")
    .addEventListener("click", function () {
      if (cart.length > 0) {
        openCheckoutModal();
      } else {
        showNotification("Your cart is empty!", "warning");
      }
    });

  document
    .getElementById("cancel-sale-btn")
    .addEventListener("click", function () {
      if (confirm("Are you sure you want to cancel this sale?")) {
        cart = [];
        renderCart();
        showNotification("Sale cancelled", "warning");
      }
    });

  document
    .getElementById("new-sale-btn")
    .addEventListener("click", function () {
      cart = [];
      renderCart();
      showNotification("New sale started", "success");
    });

  document
    .getElementById("complete-sale-btn")
    .addEventListener("click", function () {
      completeSale();
    });

  document
    .getElementById("print-receipt-btn")
    .addEventListener("click", function () {
      printReceipt();
    });

  document
    .getElementById("amount-tendered")
    .addEventListener("input", function () {
      calculateChange();
    });

  document
    .getElementById("pos-search-product")
    .addEventListener("input", function () {
      filterPOSProducts();
    });

  document
    .getElementById("pos-category-filter")
    .addEventListener("change", function () {
      filterPOSProducts();
    });

  document
    .getElementById("search-product")
    .addEventListener("input", function () {
      filterProducts(this.value);
    });

  document
    .getElementById("export-inventory-btn")
    .addEventListener("click", exportInventory);
  document
    .getElementById("export-sales-btn")
    .addEventListener("click", exportSales);

  document
    .getElementById("apply-filters-btn")
    .addEventListener("click", applySalesFilters);

  document
    .getElementById("generate-report-action-btn")
    .addEventListener("click", renderReports);

  window.addEventListener("click", function (e) {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });

  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("edit-product") ||
      e.target.closest(".edit-product")
    ) {
      const button = e.target.classList.contains("edit-product")
        ? e.target
        : e.target.closest(".edit-product");
      const productId = parseInt(button.getAttribute("data-id"));
      const product = products.find((p) => p.id === productId);
      if (product) {
        openProductModal(product);
      } else {
        showNotification("Product not found!", "error");
        renderInventoryTable();
      }
    }

    if (
      e.target.classList.contains("delete-product") ||
      e.target.closest(".delete-product")
    ) {
      const button = e.target.classList.contains("delete-product")
        ? e.target
        : e.target.closest(".delete-product");
      const productId = parseInt(button.getAttribute("data-id"));
      deleteProduct(productId);
    }
  });
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function showTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.getElementById(tabName).classList.add("active");

  if (tabName === "reports") {
    renderReports();
  }
}

function renderProducts() {
  const productsGrid = document.getElementById("products-grid");
  productsGrid.innerHTML = "";

  updatePOSCategoryFilter();

  products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    let imageHtml = "";
    if (product.image) {
      imageHtml = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    imageHtml += `<div class="placeholder" ${
      product.image ? 'style="display:none;"' : ""
    }><i class="fas fa-box"></i></div>`;

    productCard.innerHTML = `
                  <div class="product-image">
                      ${imageHtml}
                  </div>
                  <div class="product-name">${product.name}</div>
                  <div class="product-price">$${product.price.toFixed(
                    2
                  )}</div>
                  <div class="product-stock ${
                    product.stock < 10 ? "stock-low" : ""
                  }">Stock: ${product.stock}</div>
              `;

    productCard.addEventListener("click", function () {
      addToCart(product);
    });

    productsGrid.appendChild(productCard);
  });
}

function updatePOSCategoryFilter() {
  const categoryFilter = document.getElementById("pos-category-filter");

  while (categoryFilter.children.length > 1) {
    categoryFilter.removeChild(categoryFilter.lastChild);
  }

  const categories = [
    ...new Set(products.map((product) => product.category)),
  ];

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function filterPOSProducts() {
  const searchTerm = document
    .getElementById("pos-search-product")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("pos-category-filter").value;

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const productsGrid = document.getElementById("products-grid");
  productsGrid.innerHTML = "";

  filteredProducts.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    let imageHtml = "";
    if (product.image) {
      imageHtml = `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`;
    }
    imageHtml += `<div class="placeholder" ${
      product.image ? 'style="display:none;"' : ""
    }><i class="fas fa-box"></i></div>`;

    productCard.innerHTML = `
                  <div class="product-image">
                      ${imageHtml}
                  </div>
                  <div class="product-name">${product.name}</div>
                  <div class="product-price">$${product.price.toFixed(
                    2
                  )}</div>
                  <div class="product-stock ${
                    product.stock < 10 ? "stock-low" : ""
                  }">Stock: ${product.stock}</div>
              `;

    productCard.addEventListener("click", function () {
      addToCart(product);
    });

    productsGrid.appendChild(productCard);
  });
}

function filterProducts(searchTerm) {
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tableBody = document.querySelector("#inventory-table tbody");
  tableBody.innerHTML = "";

  filteredProducts.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                  <td>
                      ${
                        product.image
                          ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" onerror="this.style.display='none'">`
                          : '<i class="fas fa-box" style="font-size: 1.5rem;"></i>'
                      }
                  </td>
                  <td>${product.id}</td>
                  <td>${product.name}</td>
                  <td>${product.category}</td>
                  <td>$${product.price.toFixed(2)}</td>
                  <td>${product.stock}</td>
                  <td>${
                    product.stock < 10
                      ? '<span style="color: red;">Low Stock</span>'
                      : "In Stock"
                  }</td>
                  <td>
                      <div class="action-buttons">
                          <button class="btn btn-outline edit-product" data-id="${
                            product.id
                          }">
                              <i class="fas fa-edit"></i> Edit
                          </button>
                          <button class="btn btn-danger delete-product" data-id="${
                            product.id
                          }">
                              <i class="fas fa-trash"></i> Delete
                          </button>
                      </div>
                  </td>
              `;

    tableBody.appendChild(row);
  });
}

function addToCart(product) {
  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++;
    } else {
      showNotification(
        `Not enough stock for ${product.name}. Only ${product.stock} available.`,
        "warning"
      );
      return;
    }
  } else {
    if (product.stock > 0) {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    } else {
      showNotification(`${product.name} is out of stock.`, "warning");
      return;
    }
  }

  renderCart();
  showNotification(`${product.name} added to cart`, "success");
}

function renderCart() {
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");

  cartItems.innerHTML = "";

  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
                  <div class="cart-item-info">
                      <div class="cart-item-name">${item.name}</div>
                      <div class="cart-item-price">$${item.price.toFixed(
                        2
                      )} x ${item.quantity}</div>
                  </div>
                  <div class="cart-item-quantity">
                      <div class="quantity-btn minus" data-id="${
                        item.id
                      }">-</div>
                      <span>${item.quantity}</span>
                      <div class="quantity-btn plus" data-id="${
                        item.id
                      }">+</div>
                  </div>
              `;

    cartItems.appendChild(cartItem);
  });

  document.querySelectorAll(".quantity-btn.minus").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productId = parseInt(this.getAttribute("data-id"));
      decreaseQuantity(productId);
    });
  });

  document.querySelectorAll(".quantity-btn.plus").forEach((btn) => {
    btn.addEventListener("click", function () {
      const productId = parseInt(this.getAttribute("data-id"));
      increaseQuantity(productId);
    });
  });

  cartTotal.textContent = `$${total.toFixed(2)}`;
}

function increaseQuantity(productId) {
  const cartItem = cart.find((item) => item.id === productId);
  const product = products.find((p) => p.id === productId);

  if (cartItem.quantity < product.stock) {
    cartItem.quantity++;
    renderCart();
  } else {
    showNotification(
      `Not enough stock for ${product.name}. Only ${product.stock} available.`,
      "warning"
    );
  }
}

function decreaseQuantity(productId) {
  const cartItem = cart.find((item) => item.id === productId);

  if (cartItem.quantity > 1) {
    cartItem.quantity--;
  } else {
    cart = cart.filter((item) => item.id !== productId);
  }

  renderCart();
}

function openCheckoutModal() {
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutSummary = document.getElementById("checkout-summary");

  checkoutSummary.innerHTML = "";

  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const summaryItem = document.createElement("div");
    summaryItem.className = "cart-item";
    summaryItem.innerHTML = `
              <div class="cart-item-info">
                  <div class="cart-item-name">${item.name}</div>
                  <div class="cart-item-price">$${item.price.toFixed(
                    2
                  )} x ${item.quantity}</div>
              </div>
              <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
          `;

    checkoutSummary.appendChild(summaryItem);
  });

  const totalElement = document.createElement("div");
  totalElement.className = "cart-total";
  totalElement.innerHTML = `
              <span>Total:</span>
              <span>$${total.toFixed(2)}</span>
          `;

  checkoutSummary.appendChild(totalElement);

  document.getElementById("amount-tendered").value = "";
  document.getElementById("change").value = "";

  checkoutModal.style.display = "flex";
}

function calculateChange() {
  const amountTendered =
    parseFloat(document.getElementById("amount-tendered").value) || 0;
  const total = getCartTotal();
  const change = amountTendered - total;

  document.getElementById("change").value =
    change >= 0 ? `$${change.toFixed(2)}` : "-";
}

function getCartTotal() {
  return cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

function completeSale() {
  const paymentMethod = document.getElementById("payment-method").value;
  const amountTendered =
    parseFloat(document.getElementById("amount-tendered").value) || 0;
  const total = getCartTotal();

  if (amountTendered < total) {
    showNotification(
      `Insufficient payment. Total is $${total.toFixed(
        2
      )} but only $${amountTendered.toFixed(2)} was tendered.`,
      "error"
    );
    return;
  }

  for (const cartItem of cart) {
    const product = products.find((p) => p.id === cartItem.id);
    if (!product || product.stock < cartItem.quantity) {
      showNotification(
        `Not enough stock for ${cartItem.name}. Only ${
          product ? product.stock : 0
        } available.`,
        "error"
      );
      return;
    }
  }

  const sale = {
    id: generateTransactionId(),
    date: new Date().toISOString(),
    items: [...cart],
    total: total,
    paymentMethod: paymentMethod,
    amountTendered: amountTendered,
    change: amountTendered - total,
  };

  sales.push(sale);

  cart.forEach((cartItem) => {
    const product = products.find((p) => p.id === cartItem.id);
    if (product) {
      product.stock -= cartItem.quantity;
    }
  });

  saveData();

  cart = [];
  renderCart();

  document.getElementById("checkout-modal").style.display = "none";

  updateDashboard();
  renderInventoryTable();
  renderSalesTable();

  showNotification(
    `Sale completed successfully! Transaction ID: ${sale.id}`,
    "success"
  );

  showReceipt(sale);
  setTimeout(() => {
    printReceipt();
  }, 500);
}

function showReceipt(sale) {
  const receipt = document.getElementById("receipt");
  const receiptItems = document.getElementById("receipt-items");
  const receiptTotal = document.getElementById("receipt-total");
  const receiptDate = document.getElementById("receipt-date");
  const receiptTransaction = document.getElementById("receipt-transaction");

  receiptItems.innerHTML = "";

  sale.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;

    const receiptItem = document.createElement("div");
    receiptItem.className = "receipt-item";
    receiptItem.innerHTML = `
              <div>${item.name} x${item.quantity}</div>
              <div>$${itemTotal.toFixed(2)}</div>
          `;

    receiptItems.appendChild(receiptItem);
  });

  receiptTotal.textContent = `$${sale.total.toFixed(2)}`;
  receiptDate.textContent = `Date: ${new Date(sale.date).toLocaleString()}`;
  receiptTransaction.textContent = `Transaction: ${sale.id}`;

  receipt.style.display = "block";
}

function printReceipt() {
  const receipt = document.getElementById("receipt");
  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
          <html>
              <head>
                  <title>Receipt</title>
                  <style>
                      body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                      .receipt-header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                      .receipt-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                      .receipt-total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; display: flex; justify-content: space-between; }
                  </style>
              </head>
              <body>
                  ${receipt.outerHTML}
              </body>
          </html>
      `);

  printWindow.document.close();
  printWindow.print();
}

function openProductModal(product = null) {
  const modal = document.getElementById("product-modal");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("product-form");

  if (product) {
    // Edit mode
    modalTitle.textContent = "Edit Product";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-price").value = product.price;
    document.getElementById("product-cost").value = product.cost;
    document.getElementById("product-stock").value = product.stock;
    document.getElementById("product-image").value = product.image || "";
    document.getElementById("product-description").value =
      product.description;

    updateImagePreview(product.image || "");
  } else {
    modalTitle.textContent = "Add New Product";
    form.reset();
    document.getElementById("product-id").value = "";
    updateImagePreview("");
  }

  modal.style.display = "flex";
}

function updateImagePreview(imageUrl) {
  const imagePreview = document.getElementById("image-preview");
  imagePreview.innerHTML = "";

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Product Preview";
    img.onerror = function () {
      imagePreview.innerHTML = "<p>Invalid image URL</p>";
    };
    imagePreview.appendChild(img);
  } else {
    imagePreview.innerHTML = "<p>No image selected</p>";
  }
}

function saveProduct() {
  const id = document.getElementById("product-id").value;
  const name = document.getElementById("product-name").value;
  const category = document.getElementById("product-category").value;
  const price = parseFloat(document.getElementById("product-price").value);
  const cost = parseFloat(document.getElementById("product-cost").value);
  const stock = parseInt(document.getElementById("product-stock").value);
  const image = document.getElementById("product-image").value;
  const description = document.getElementById("product-description").value;

  // Validation
  if (!name || !category || !price || !cost || stock < 0) {
    showNotification(
      "Please fill in all required fields with valid values",
      "error"
    );
    return;
  }

  if (price < cost) {
    showNotification(
      "Price should be greater than cost for profitability",
      "warning"
    );
    return;
  }

  if (id) {
    // Update existing product
    const index = products.findIndex((p) => p.id == id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name,
        category,
        price,
        cost,
        stock,
        image,
        description,
      };
      showNotification(`Product "${name}" updated successfully`, "success");
    }
  } else {
    const newProduct = {
      id: generateId(),
      name,
      category,
      price,
      cost,
      stock,
      image,
      description,
    };
    products.push(newProduct);
    showNotification(`Product "${name}" added successfully`, "success");
  }

  saveData();

  renderProducts();
  renderInventoryTable();
  updateDashboard();

  document.getElementById("product-modal").style.display = "none";
}

function deleteProduct(productId) {
  const product = products.find((p) => p.id === productId);

  if (!product) {
    showNotification("Product not found!", "error");
    return;
  }

  const productInSales = sales.some((sale) =>
    sale.items.some((item) => item.id === productId)
  );

  let message = `Are you sure you want to delete "${product.name}"?`;
  if (productInSales) {
    message +=
      "\n\nThis product has sales history. Deleting it will remove it from inventory but sales records will be preserved.";
  }

  if (confirm(message)) {
    products = products.filter((p) => p.id !== productId);
    saveData();
    renderInventoryTable();
    renderProducts();
    updateDashboard();
    showNotification(
      `Product "${product.name}" deleted successfully`,
      "success"
    );
  }
}

function renderInventoryTable() {
  const tableBody = document.querySelector("#inventory-table tbody");
  tableBody.innerHTML = "";

  updateCategoryFilter();

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                  <td>
                      ${
                        product.image
                          ? `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" onerror="this.style.display='none'">`
                          : '<i class="fas fa-box" style="font-size: 1.5rem;"></i>'
                      }
                  </td>
                  <td>${product.id}</td>
                  <td>${product.name}</td>
                  <td>${product.category}</td>
                  <td>$${product.price.toFixed(2)}</td>
                  <td>${product.stock}</td>
                  <td>${
                    product.stock < 10
                      ? '<span style="color: red;">Low Stock</span>'
                      : "In Stock"
                  }</td>
                  <td>
                      <div class="action-buttons">
                          <button class="btn btn-outline edit-product" data-id="${
                            product.id
                          }">
                              <i class="fas fa-edit"></i> Edit
                          </button>
                          <button class="btn btn-danger delete-product" data-id="${
                            product.id
                          }">
                              <i class="fas fa-trash"></i> Delete
                          </button>
                      </div>
                  </td>
              `;

    tableBody.appendChild(row);
  });
}

function renderSalesTable() {
  const tableBody = document.querySelector("#sales-table tbody");
  tableBody.innerHTML = "";

  sales.forEach((sale) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                  <td>${sale.id}</td>
                  <td>${new Date(sale.date).toLocaleDateString()}</td>
                  <td>${sale.items.length} items</td>
                  <td>$${sale.total.toFixed(2)}</td>
                  <td>${sale.paymentMethod}</td>
                  <td>
                      <button class="btn btn-outline view-sale" data-id="${
                        sale.id
                      }">
                          <i class="fas fa-eye"></i> View
                      </button>
                  </td>
              `;

    tableBody.appendChild(row);
  });

  document.querySelectorAll(".view-sale").forEach((btn) => {
    btn.addEventListener("click", function () {
      const saleId = this.getAttribute("data-id");
      const sale = sales.find((s) => s.id == saleId);
      if (sale) {
        showTransactionDetailsModal(sale);
      }
    });
  });
}

function updateDashboard() {
  const today = new Date().toDateString();
  const dailySales = sales
    .filter((sale) => new Date(sale.date).toDateString() === today)
    .reduce((total, sale) => total + sale.total, 0);

  document.getElementById("daily-sales").textContent = `$${dailySales.toFixed(
    2
  )}`;

  document.getElementById("total-transactions").textContent = sales.length;

  const lowStockItems = products.filter((product) => product.stock < 10).length;
  document.getElementById("low-stock-items").textContent = lowStockItems;

  if (sales.length > 0) {
    const productSales = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productSales[item.name]) {
          productSales[item.name] += item.quantity;
        } else {
          productSales[item.name] = item.quantity;
        }
      });
    });

    let topProduct = "";
    let maxQuantity = 0;

    for (const [product, quantity] of Object.entries(productSales)) {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        topProduct = product;
      }
    }

    document.getElementById("top-product").textContent = topProduct;
  } else {
    document.getElementById("top-product").textContent = "-";
  }
}

function generateId() {
  return products.length > 0
    ? Math.max(...products.map((p) => p.id)) + 1
    : 1;
}

function generateTransactionId() {
  return (
    "T" +
    Date.now().toString(36) +
    Math.random().toString(36).substr(2, 5).toUpperCase()
  );
}

function updateCategoryFilter() {
  const categoryFilter = document.getElementById("category-filter");

  while (categoryFilter.children.length > 1) {
    categoryFilter.removeChild(categoryFilter.lastChild);
  }

  const categories = [
    ...new Set(products.map((product) => product.category)),
  ];

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

function applySalesFilters() {
  const dateFrom = document.getElementById("date-from").value;
  const dateTo = document.getElementById("date-to").value;
  const category = document.getElementById("category-filter").value;

  let filteredSales = [...sales];

  if (dateFrom) {
    filteredSales = filteredSales.filter(
      (sale) => new Date(sale.date) >= new Date(dateFrom)
    );
  }

  if (dateTo) {
    filteredSales = filteredSales.filter(
      (sale) => new Date(sale.date) <= new Date(dateTo)
    );
  }

  if (category !== "all") {
    filteredSales = filteredSales.filter((sale) =>
      sale.items.some((item) => {
        const product = products.find((p) => p.id === item.id);
        return product && product.category === category;
      })
    );
  }

  const tableBody = document.querySelector("#sales-table tbody");
  tableBody.innerHTML = "";

  filteredSales.forEach((sale) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                  <td>${sale.id}</td>
                  <td>${new Date(sale.date).toLocaleDateString()}</td>
                  <td>${sale.items.length} items</td>
                  <td>$${sale.total.toFixed(2)}</td>
                  <td>${sale.paymentMethod}</td>
                  <td>
                      <button class="btn btn-outline view-sale" data-id="${
                        sale.id
                      }">
                          <i class="fas fa-eye"></i> View
                      </button>
                  </td>
              `;

    tableBody.appendChild(row);
  });

  document.querySelectorAll(".view-sale").forEach((btn) => {
    btn.addEventListener("click", function () {
      const saleId = this.getAttribute("data-id");
      const sale = sales.find((s) => s.id == saleId);
      if (sale) {
        showTransactionDetailsModal(sale);
      }
    });
  });
}

function exportInventory() {
  const headers = [
    "ID",
    "Name",
    "Category",
    "Price",
    "Cost",
    "Stock",
    "Description",
  ];
  const csvData = products.map((product) => [
    product.id,
    product.name,
    product.category,
    product.price,
    product.cost,
    product.stock,
    product.description,
  ]);

  // Create CSV content
  let csvContent = headers.join(",") + "\n";
  csvData.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory.csv";
  a.click();
  URL.revokeObjectURL(url);

  showNotification("Inventory exported successfully", "success");
}

function exportSales() {
  // Convert sales to CSV
  const headers = [
    "Transaction ID",
    "Date",
    "Items",
    "Total Amount",
    "Payment Method",
  ];
  const csvData = sales.map((sale) => [
    sale.id,
    new Date(sale.date).toLocaleDateString(),
    sale.items
      .map((item) => `${item.name} (x${item.quantity})`)
      .join("; "),
    sale.total,
    sale.paymentMethod,
  ]);

  // Create CSV content
  let csvContent = headers.join(",") + "\n";
  csvData.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  // Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales.csv";
  a.click();
  URL.revokeObjectURL(url);

  showNotification("Sales data exported successfully", "success");
}

function renderReports() {
  const reportType = document.getElementById("report-type").value;
  const reportPeriod = document.getElementById("report-period").value;

  const reportResults = document.getElementById("report-results");
  reportResults.innerHTML = "";

  // Destroy existing chart instances before rendering new ones (if they exist)
  if (window.salesCategoryChart) window.salesCategoryChart.destroy();
  if (window.salesPaymentChart) window.salesPaymentChart.destroy();
  if (window.inventoryCategoryChart) window.inventoryCategoryChart.destroy();
  if (window.stockStatusChart) window.stockStatusChart.destroy();
  if (window.profitCategoryChart) window.profitCategoryChart.destroy();
  if (window.profitDistributionChart) window.profitDistributionChart.destroy();


  if (reportType === "sales") {
    renderSalesReport(reportPeriod);
  } else if (reportType === "inventory") {
    renderInventoryReport(reportPeriod);
  } else if (reportType === "profit") {
    renderProfitReport(reportPeriod);
  }
}

function renderSalesReport(period) {
  const reportResults = document.getElementById("report-results");

  const filteredSales = filterSalesByPeriod(sales, period);
  const totalSales = filteredSales.reduce(
    (total, sale) => total + sale.total,
    0
  );
  const totalTransactions = filteredSales.length;

  const salesByCategory = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        const category = product.category;
        if (!salesByCategory[category]) {
          salesByCategory[category] = 0;
        }
        salesByCategory[category] += item.price * item.quantity;
      }
    });
  });

  const salesByPayment = {};
  filteredSales.forEach((sale) => {
    if (!salesByPayment[sale.paymentMethod]) {
      salesByPayment[sale.paymentMethod] = 0;
    }
    salesByPayment[sale.paymentMethod] += sale.total;
  });

  const productSales = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (productSales[item.name]) {
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      } else {
        productSales[item.name] = {
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        };
      }
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  let reportHTML = `
              <div class="report-summary">
                  <div class="report-summary-card">
                      <h4>Total Sales</h4>
                      <p>$${totalSales.toFixed(2)}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Transactions</h4>
                      <p>${totalTransactions}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Avg. Transaction</h4>
                      <p>$${
                        totalTransactions > 0
                          ? (totalSales / totalTransactions).toFixed(2)
                          : "0.00"
                      }</p>
                  </div>
              </div>
              <div class="chart-grid">
                  <div class="chart-container">
                      <h3>Sales by Category</h3>
                      <div class="chart-wrapper">
                          <canvas id="sales-category-chart"></canvas>
                      </div>
                  </div>
                  <div class="chart-container">
                      <h3>Sales by Payment Method</h3>
                      <div class="chart-wrapper">
                          <canvas id="sales-payment-chart"></canvas>
                      </div>
                  </div>
              </div>
              <div class="card">
                  <h3>Top Selling Products</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Product</th>
                              <th>Quantity Sold</th>
                              <th>Revenue</th>
                          </tr>
                      </thead>
                      <tbody>
          `;

  topProducts.forEach((product) => {
    reportHTML += `
                  <tr>
                      <td>${product.name}</td>
                      <td>${product.quantity}</td>
                      <td>$${product.revenue.toFixed(2)}</td>
                  </tr>
              `;
  });

  reportHTML += `
                      </tbody>
                  </table>
              </div>
          `;

  reportResults.innerHTML = reportHTML;

  // Store chart instance globally for destruction later
  window.salesCategoryChart = renderPieChart(
    "sales-category-chart",
    Object.keys(salesByCategory),
    Object.values(salesByCategory),
    "Sales by Category"
  );

  window.salesPaymentChart = renderPieChart(
    "sales-payment-chart",
    Object.keys(salesByPayment),
    Object.values(salesByPayment),
    "Sales by Payment Method"
  );
}

function renderInventoryReport(period) {
  const reportResults = document.getElementById("report-results");

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock < 10).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const totalInventoryValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0
  );

  const inventoryByCategory = {};
  products.forEach((product) => {
    if (!inventoryByCategory[product.category]) {
      inventoryByCategory[product.category] = {
        count: 0,
        value: 0,
      };
    }
    inventoryByCategory[product.category].count += 1;
    inventoryByCategory[product.category].value +=
      product.price * product.stock;
  });

  const stockStatus = {
    "In Stock": products.filter((p) => p.stock >= 10).length,
    "Low Stock": products.filter((p) => p.stock > 0 && p.stock < 10).length,
    "Out of Stock": products.filter((p) => p.stock === 0).length,
  };

  const lowStockItems = products
    .filter((p) => p.stock < 10)
    .sort((a, b) => a.stock - b.stock);

  let reportHTML = `
              <div class="report-summary">
                  <div class="report-summary-card">
                      <h4>Total Products</h4>
                      <p>${totalProducts}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Low Stock Items</h4>
                      <p>${lowStockCount}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Out of Stock</h4>
                      <p>${outOfStockCount}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Inventory Value</h4>
                      <p>$${totalInventoryValue.toFixed(2)}</p>
                  </div>
              </div>
              <div class="chart-grid">
                  <div class="chart-container">
                      <h3>Products by Category</h3>
                      <div class="chart-wrapper">
                          <canvas id="inventory-category-chart"></canvas>
                      </div>
                  </div>
                  <div class="chart-container">
                      <h3>Stock Status</h3>
                      <div class="chart-wrapper">
                          <canvas id="stock-status-chart"></canvas>
                      </div>
                  </div>
              </div>
              <div class="card">
                  <h3>Inventory by Category</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Category</th>
                              <th>Product Count</th>
                              <th>Total Value</th>
                          </tr>
                      </thead>
                      <tbody>
          `;

  Object.entries(inventoryByCategory).forEach(([category, data]) => {
    reportHTML += `
                  <tr>
                      <td>${category}</td>
                      <td>${data.count}</td>
                      <td>$${data.value.toFixed(2)}</td>
                  </tr>
              `;
  });

  reportHTML += `
                      </tbody>
                  </table>
              </div>
              <div class="card">
                  <h3>Low Stock Items</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Product</th>
                              <th>Category</th>
                              <th>Current Stock</th>
                              <th>Price</th>
                          </tr>
                      </thead>
                      <tbody>
          `;

  lowStockItems.forEach((product) => {
    reportHTML += `
                  <tr>
                      <td>${product.name}</td>
                      <td>${product.category}</td>
                      <td>${product.stock}</td>
                      <td>$${product.price.toFixed(2)}</td>
                  </tr>
              `;
  });

  reportHTML += `
                      </tbody>
                  </table>
              </div>
          `;

  reportResults.innerHTML = reportHTML;

  window.inventoryCategoryChart = renderPieChart(
    "inventory-category-chart",
    Object.keys(inventoryByCategory),
    Object.values(inventoryByCategory).map((item) => item.count),
    "Products by Category"
  );

  window.stockStatusChart = renderPieChart(
    "stock-status-chart",
    Object.keys(stockStatus),
    Object.values(stockStatus),
    "Stock Status"
  );
}

function renderProfitReport(period) {
  const reportResults = document.getElementById("report-results");

  const filteredSales = filterSalesByPeriod(sales, period);

  let totalRevenue = 0;
  let totalCost = 0;

  filteredSales.forEach((sale) => {
    totalRevenue += sale.total;
    sale.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        totalCost += product.cost * item.quantity;
      }
    });
  });

  const totalProfit = totalRevenue - totalCost;
  const profitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const profitByCategory = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        const category = product.category;
        const revenue = item.price * item.quantity;
        const cost = product.cost * item.quantity;
        const profit = revenue - cost;

        if (!profitByCategory[category]) {
          profitByCategory[category] = {
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }

        profitByCategory[category].revenue += revenue;
        profitByCategory[category].cost += cost;
        profitByCategory[category].profit += profit;
      }
    });
  });

  const profitDistribution = {
    Revenue: totalRevenue,
    Cost: totalCost,
    Profit: totalProfit,
  };

  let reportHTML = `
              <div class="report-summary">
                  <div class="report-summary-card">
                      <h4>Total Revenue</h4>
                      <p>$${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Total Cost</h4>
                      <p>$${totalCost.toFixed(2)}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Total Profit</h4>
                      <p>$${totalProfit.toFixed(2)}</p>
                  </div>
                  <div class="report-summary-card">
                      <h4>Profit Margin</h4>
                      <p>${profitMargin.toFixed(2)}%</p>
                  </div>
              </div>
              <div class="chart-grid">
                  <div class="chart-container">
                      <h3>Profit by Category</h3>
                      <div class="chart-wrapper">
                          <canvas id="profit-category-chart"></canvas>
                      </div>
                  </div>
                  <div class="chart-container">
                      <h3>Profit Distribution</h3>
                      <div class="chart-wrapper">
                          <canvas id="profit-distribution-chart"></canvas>
                      </div>
                  </div>
              </div>
              <div class="card">
                  <h3>Profit by Category</h3>
                  <table>
                      <thead>
                          <tr>
                              <th>Category</th>
                              <th>Revenue</th>
                              <th>Cost</th>
                              <th>Profit</th>
                              <th>Margin</th>
                          </tr>
                      </thead>
                      <tbody>
          `;

  Object.entries(profitByCategory).forEach(([category, data]) => {
    const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;

    reportHTML += `
                  <tr>
                      <td>${category}</td>
                      <td>$${data.revenue.toFixed(2)}</td>
                      <td>$${data.cost.toFixed(2)}</td>
                      <td>$${data.profit.toFixed(2)}</td>
                      <td>${margin.toFixed(2)}%</td>
                  </tr>
              `;
  });

  reportHTML += `
                      </tbody>
                  </table>
              </div>
          `;

  reportResults.innerHTML = reportHTML;

  window.profitCategoryChart = renderPieChart(
    "profit-category-chart",
    Object.keys(profitByCategory),
    Object.values(profitByCategory).map((item) => item.profit),
    "Profit by Category"
  );

  window.profitDistributionChart = renderPieChart(
    "profit-distribution-chart",
    Object.keys(profitDistribution),
    Object.values(profitDistribution),
    "Profit Distribution"
  );
}

function renderPieChart(canvasId, labels, data, title) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  const backgroundColors = generateColors(data.length);

  // Check if a Chart instance already exists on this canvas and destroy it
  if (Chart.getChart(canvasId)) {
      Chart.getChart(canvasId).destroy();
  }

  return new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: $${
                typeof value === "number" ? value.toFixed(2) : value
              } (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function generateColors(count) {
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF6384",
    "#C9CBCF",
    "#7CFFB2",
    "#F778BA",
    "#5DADE2",
    "#58D68D",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

function filterSalesByPeriod(salesData, period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case "today":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      break;
    case "week":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay()
      );
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return salesData;
  }

  return salesData.filter((sale) => new Date(sale.date) >= startDate);
}

function showTransactionDetails() {
  const modal = document.getElementById("transaction-details-modal");
  const content = document.getElementById("transaction-details-content");

  content.innerHTML = "";

  if (sales.length === 0) {
    content.innerHTML = "<p>No transactions found.</p>";
  } else {
    sales.forEach((sale) => {
      const detailItem = document.createElement("div");
      detailItem.className = "detail-item";
      detailItem.innerHTML = `
                      <div class="detail-item-info">
                          <div class="detail-item-title">Transaction ${
                            sale.id
                          }</div>
                          <div class="detail-item-subtitle">${new Date(
                            sale.date
                          ).toLocaleString()} | ${sale.paymentMethod} | $${sale.total.toFixed(
        2
      )}</div>
                      </div>
                      <button class="btn btn-outline view-sale-detail" data-id="${
                        sale.id
                      }">
                          <i class="fas fa-eye"></i> View
                      </button>
                  `;
      content.appendChild(detailItem);
    });

    document.querySelectorAll(".view-sale-detail").forEach((btn) => {
      btn.addEventListener("click", function () {
        const saleId = this.getAttribute("data-id");
        const sale = sales.find((s) => s.id == saleId);
        if (sale) {
          modal.style.display = "none";
          showTransactionDetailsModal(sale);
        }
      });
    });
  }

  modal.style.display = "flex";
}

function showLowStockItems() {
  const modal = document.getElementById("low-stock-modal");
  const content = document.getElementById("low-stock-content");

  content.innerHTML = "";

  const lowStockProducts = products.filter((product) => product.stock < 10);

  if (lowStockProducts.length === 0) {
    content.innerHTML = "<p>No low stock items found.</p>";
  } else {
    lowStockProducts.forEach((product) => {
      const detailItem = document.createElement("div");
      detailItem.className = "detail-item";
      detailItem.innerHTML = `
                      <div class="detail-item-info">
                          <div class="detail-item-title">${product.name}</div>
                          <div class="detail-item-subtitle">${
                            product.category
                          } | Stock: ${
        product.stock
      } | Price: $${product.price.toFixed(2)}</div>
                      </div>
                      <button class="btn btn-outline edit-product-from-list" data-id="${
                        product.id
                      }">
                          <i class="fas fa-edit"></i> Edit
                      </button>
                  `;
      content.appendChild(detailItem);
    });

    // Add event listeners for edit buttons
    document.querySelectorAll(".edit-product-from-list").forEach((btn) => {
      btn.addEventListener("click", function () {
        const productId = parseInt(this.getAttribute("data-id"));
        const product = products.find((p) => p.id === productId);
        if (product) {
          modal.style.display = "none";
          openProductModal(product);
        }
      });
    });
  }

  modal.style.display = "flex";
}

function showTransactionDetailsModal(sale) {
  const modal = document.getElementById("transaction-details-modal");
  const content = document.getElementById("transaction-details-content");

  content.innerHTML = `
              <h3>Transaction ${sale.id}</h3>
              <p><strong>Date:</strong> ${new Date(
                sale.date
              ).toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${sale.paymentMethod}</p>
              <p><strong>Amount Tendered:</strong> $${sale.amountTendered.toFixed(
                2
              )}</p>
              <p><strong>Change:</strong> $${sale.change.toFixed(2)}</p>
              <h4>Items:</h4>
              <div class="detail-view">
          `;

  sale.items.forEach((item) => {
    const detailItem = document.createElement("div");
    detailItem.className = "detail-item";
    detailItem.innerHTML = `
                  <div class="detail-item-info">
                      <div class="detail-item-title">${item.name}</div>
                      <div class="detail-item-subtitle">$${item.price.toFixed(
                        2
                      )} x ${item.quantity} = $${(
      item.price * item.quantity
    ).toFixed(2)}</div>
                  </div>
              `;
    content.appendChild(detailItem);
  });

  const totalItem = document.createElement("div");
  totalItem.className = "detail-item";
  totalItem.innerHTML = `
              <div class="detail-item-info">
                  <div class="detail-item-title">Total</div>
              </div>
              <div class="detail-item-total">$${sale.total.toFixed(2)}</div>
          `;
  content.appendChild(totalItem);

  modal.style.display = "flex";
}
