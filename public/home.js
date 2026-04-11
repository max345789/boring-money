const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

const products = [
  { id: 'sunflower', name: 'Sunflower Crunch', price: 8 },
  { id: 'broccoli', name: 'Broccoli Shield', price: 9 },
  { id: 'radish', name: 'Radish Ignite', price: 8 },
  { id: 'pea', name: 'Pea Tendril Sweet', price: 10 }
];

const quantities = Object.fromEntries(products.map((product) => [product.id, 0]));
let plan = 'weekly';

function formatCurrency(value) {
  return currency.format(value);
}

function buildOrderHref(items, selectedPlan, subject) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = selectedPlan === 'weekly' ? subtotal * 0.1 : 0;
  const shipping = subtotal === 0 || subtotal >= 32 || selectedPlan === 'weekly' ? 0 : 6;
  const total = subtotal - discount + shipping;

  const body = [
    'Hello Sprig & Soil,',
    '',
    `I want to buy a ${selectedPlan === 'weekly' ? 'weekly microgreens delivery' : 'one-time microgreens order'}.`,
    '',
    ...items.map(
      (item) =>
        `- ${item.name}: ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.total)}`
    ),
    '',
    `Subtotal: ${formatCurrency(subtotal)}`,
    discount > 0 ? `Weekly savings: -${formatCurrency(discount)}` : null,
    `Delivery: ${shipping === 0 ? 'Included' : formatCurrency(shipping)}`,
    `Total: ${formatCurrency(total)}`,
    '',
    'Name:',
    'Phone:',
    'Preferred delivery day:',
    'Address:'
  ]
    .filter(Boolean)
    .join('\n');

  return `mailto:orders@sprigandsoil.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function getSelectedItems() {
  return products
    .filter((product) => quantities[product.id] > 0)
    .map((product) => ({
      ...product,
      quantity: quantities[product.id],
      total: quantities[product.id] * product.price
    }));
}

function updateSummary() {
  const selectedItems = getSelectedItems();
  const summaryList = document.getElementById('summary-list');
  const summaryEmpty = document.getElementById('summary-empty');
  const itemsEl = document.getElementById('summary-items');
  const subtotalEl = document.getElementById('summary-subtotal');
  const savingsEl = document.getElementById('summary-savings');
  const savingsLabelEl = document.getElementById('summary-savings-label');
  const deliveryEl = document.getElementById('summary-delivery');
  const totalEl = document.getElementById('summary-total');
  const buySelectedEl = document.getElementById('buy-selected');
  const finalBuyLinkEl = document.getElementById('final-buy-link');

  summaryList.querySelectorAll('.summary-row--item').forEach((element) => element.remove());

  if (selectedItems.length === 0) {
    summaryEmpty.hidden = false;
  } else {
    summaryEmpty.hidden = true;

    selectedItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'summary-row summary-row--item';
      row.innerHTML = `<span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.total)}</strong>`;
      summaryList.prepend(row);
    });
  }

  const itemCount = selectedItems.reduce((count, item) => count + item.quantity, 0);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const discount = plan === 'weekly' ? subtotal * 0.1 : 0;
  const shipping = subtotal === 0 || subtotal >= 32 || plan === 'weekly' ? 0 : 6;
  const total = subtotal - discount + shipping;

  itemsEl.textContent = String(itemCount);
  subtotalEl.textContent = formatCurrency(subtotal);
  savingsLabelEl.textContent = plan === 'weekly' ? 'Weekly savings' : 'Savings';
  savingsEl.textContent = discount > 0 ? `-${formatCurrency(discount)}` : formatCurrency(0);
  deliveryEl.textContent = shipping === 0 ? 'Included' : formatCurrency(shipping);
  totalEl.textContent = formatCurrency(total);

  if (selectedItems.length === 0) {
    buySelectedEl.classList.add('is-disabled');
    buySelectedEl.href = '#shop';
    buySelectedEl.textContent = 'Choose Your Trays First';
    finalBuyLinkEl.href = '#shop';
    finalBuyLinkEl.textContent = 'Buy Microgreens Now';
  } else {
    const orderHref = buildOrderHref(selectedItems, plan, 'Buy Microgreens');
    buySelectedEl.classList.remove('is-disabled');
    buySelectedEl.href = orderHref;
    buySelectedEl.textContent = 'Buy Selected Microgreens';
    finalBuyLinkEl.href = orderHref;
    finalBuyLinkEl.textContent = 'Complete Your Order';
  }
}

function updateSingleBuyLinks() {
  document.querySelectorAll('[data-role="buy-single"]').forEach((link) => {
    const productCard = link.closest('.product');
    if (!productCard) return;

    const product = products.find((item) => item.id === productCard.dataset.id);
    if (!product) return;

    link.href = buildOrderHref(
      [{ ...product, quantity: 1, total: product.price }],
      'once',
      `Buy ${product.name}`
    );
  });
}

function updateQuantity(productId, nextValue) {
  quantities[productId] = Math.max(0, nextValue);

  const productCard = document.querySelector(`.product[data-id="${productId}"]`);
  const quantityNode = productCard?.querySelector('[data-role="quantity"]');
  const decreaseButton = productCard?.querySelector('[data-action="decrease"]');

  if (quantityNode) {
    quantityNode.textContent = String(quantities[productId]);
  }

  if (decreaseButton) {
    decreaseButton.disabled = quantities[productId] === 0;
  }

  updateSummary();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.plan-switch button').forEach((button) => {
    button.addEventListener('click', () => {
      plan = button.dataset.plan || 'weekly';

      document.querySelectorAll('.plan-switch button').forEach((otherButton) => {
        otherButton.classList.toggle('is-active', otherButton === button);
      });

      updateSummary();
    });
  });

  document.querySelectorAll('.product').forEach((productCard) => {
    const productId = productCard.dataset.id;
    const increaseButton = productCard.querySelector('[data-action="increase"]');
    const decreaseButton = productCard.querySelector('[data-action="decrease"]');

    increaseButton?.addEventListener('click', () => {
      updateQuantity(productId, quantities[productId] + 1);
    });

    decreaseButton?.addEventListener('click', () => {
      updateQuantity(productId, quantities[productId] - 1);
    });
  });

  updateSingleBuyLinks();
  updateSummary();
});
