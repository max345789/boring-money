const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

const checkoutStorageKey = 'sprigandsoil.checkout';

const products = [
  { id: 'sunflower', name: 'Sunflower Crunch', priceInPaise: 19900 },
  { id: 'broccoli', name: 'Broccoli Shield', priceInPaise: 22900 },
  { id: 'radish', name: 'Radish Ignite', priceInPaise: 19900 },
  { id: 'pea', name: 'Pea Tendril Sweet', priceInPaise: 24900 }
];

const quantities = Object.fromEntries(products.map((product) => [product.id, 0]));
let plan = 'weekly';

function formatCurrency(valueInPaise) {
  return currency.format(valueInPaise / 100);
}

function getSelectedItems() {
  return products
    .filter((product) => quantities[product.id] > 0)
    .map((product) => ({
      ...product,
      quantity: quantities[product.id],
      totalInPaise: quantities[product.id] * product.priceInPaise
    }));
}

function buildOrder(items, selectedPlan) {
  const subtotalInPaise = items.reduce((sum, item) => sum + item.totalInPaise, 0);
  const discountInPaise = selectedPlan === 'weekly' ? Math.floor(subtotalInPaise * 0.1) : 0;
  const shippingInPaise =
    subtotalInPaise === 0 || subtotalInPaise >= 79900 || selectedPlan === 'weekly' ? 0 : 6000;

  return {
    items,
    plan: selectedPlan,
    subtotalInPaise,
    discountInPaise,
    shippingInPaise,
    totalInPaise: subtotalInPaise - discountInPaise + shippingInPaise
  };
}

function setSelectionStatus(tone, message) {
  const status = document.getElementById('payment-status');

  if (!status) {
    return;
  }

  if (!message) {
    status.hidden = true;
    status.textContent = '';
    status.className = 'payment-status';
    return;
  }

  status.hidden = false;
  status.textContent = message;
  status.className = `payment-status payment-status--${tone}`;
}

function saveCheckoutSelection(order) {
  localStorage.setItem(
    checkoutStorageKey,
    JSON.stringify({
      plan: order.plan,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity
      })),
      updatedAt: Date.now()
    })
  );
}

function goToCheckout(order) {
  saveCheckoutSelection(order);
  window.location.href = '/checkout';
}

function updateSummary() {
  const selectedItems = getSelectedItems();
  const order = buildOrder(selectedItems, plan);
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
      row.innerHTML = `<span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.totalInPaise)}</strong>`;
      summaryList.prepend(row);
    });
  }

  itemsEl.textContent = String(selectedItems.reduce((count, item) => count + item.quantity, 0));
  subtotalEl.textContent = formatCurrency(order.subtotalInPaise);
  savingsLabelEl.textContent = plan === 'weekly' ? 'Weekly savings' : 'Savings';
  savingsEl.textContent =
    order.discountInPaise > 0 ? `-${formatCurrency(order.discountInPaise)}` : formatCurrency(0);
  deliveryEl.textContent =
    order.shippingInPaise === 0 ? 'Included' : formatCurrency(order.shippingInPaise);
  totalEl.textContent = formatCurrency(order.totalInPaise);

  if (selectedItems.length === 0) {
    buySelectedEl.classList.add('is-disabled');
    buySelectedEl.textContent = 'Choose Your Trays First';
    finalBuyLinkEl.textContent = 'Buy Microgreens Now';
  } else {
    buySelectedEl.classList.remove('is-disabled');
    buySelectedEl.textContent = 'Continue to Checkout';
    finalBuyLinkEl.textContent = 'Continue to Checkout';
  }
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
  const summaryList = document.getElementById('summary-list');

  if (!summaryList) {
    return;
  }

  document.querySelectorAll('.plan-switch button').forEach((button) => {
    button.addEventListener('click', () => {
      plan = button.dataset.plan || 'weekly';
      setSelectionStatus('', '');

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
    const buyButton = productCard.querySelector('[data-role="buy-single"]');

    increaseButton?.addEventListener('click', () => {
      updateQuantity(productId, quantities[productId] + 1);
    });

    decreaseButton?.addEventListener('click', () => {
      updateQuantity(productId, quantities[productId] - 1);
    });

    buyButton?.addEventListener('click', (event) => {
      event.preventDefault();
      setSelectionStatus('', '');

      const product = products.find((item) => item.id === productId);

      if (!product) {
        return;
      }

      goToCheckout(
        buildOrder(
          [
            {
              ...product,
              quantity: 1,
              totalInPaise: product.priceInPaise
            }
          ],
          'once'
        )
      );
    });
  });

  document.getElementById('buy-selected')?.addEventListener('click', (event) => {
    event.preventDefault();

    const selectedItems = getSelectedItems();

    if (!selectedItems.length) {
      return;
    }

    setSelectionStatus('', '');
    goToCheckout(buildOrder(selectedItems, plan));
  });

  document.getElementById('final-buy-link')?.addEventListener('click', (event) => {
    event.preventDefault();

    const selectedItems = getSelectedItems();

    if (!selectedItems.length) {
      document.querySelector('.product-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setSelectionStatus('', '');
    goToCheckout(buildOrder(selectedItems, plan));
  });

  updateSummary();
});
