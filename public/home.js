const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

const products = [
  { id: 'sunflower', name: 'Sunflower Crunch', priceInPaise: 19900 },
  { id: 'broccoli', name: 'Broccoli Shield', priceInPaise: 22900 },
  { id: 'radish', name: 'Radish Ignite', priceInPaise: 19900 },
  { id: 'pea', name: 'Pea Tendril Sweet', priceInPaise: 24900 }
];

const quantities = Object.fromEntries(products.map((product) => [product.id, 0]));
let plan = 'weekly';
let runtimeConfigPromise;
let isPaymentInFlight = false;

function formatCurrency(valueInPaise) {
  return currency.format(valueInPaise / 100);
}

function getRuntimeConfig() {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch('/api/runtime-config', {
      headers: {
        Accept: 'application/json'
      }
    }).then((response) => {
      if (!response.ok) {
        throw new Error('Could not load payment settings.');
      }

      return response.json();
    });
  }

  return runtimeConfigPromise;
}

function setPaymentStatus(tone, message) {
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

function getSelectedItems() {
  return products
    .filter((product) => quantities[product.id] > 0)
    .map((product) => ({
      ...product,
      quantity: quantities[product.id],
      totalInPaise: quantities[product.id] * product.priceInPaise
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
      row.innerHTML = `<span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.totalInPaise)}</strong>`;
      summaryList.prepend(row);
    });
  }

  const itemCount = selectedItems.reduce((count, item) => count + item.quantity, 0);
  const subtotalInPaise = selectedItems.reduce((sum, item) => sum + item.totalInPaise, 0);
  const discountInPaise = plan === 'weekly' ? Math.floor(subtotalInPaise * 0.1) : 0;
  const shippingInPaise =
    subtotalInPaise === 0 || subtotalInPaise >= 79900 || plan === 'weekly' ? 0 : 6000;
  const totalInPaise = subtotalInPaise - discountInPaise + shippingInPaise;

  itemsEl.textContent = String(itemCount);
  subtotalEl.textContent = formatCurrency(subtotalInPaise);
  savingsLabelEl.textContent = plan === 'weekly' ? 'Weekly savings' : 'Savings';
  savingsEl.textContent =
    discountInPaise > 0 ? `-${formatCurrency(discountInPaise)}` : formatCurrency(0);
  deliveryEl.textContent = shippingInPaise === 0 ? 'Included' : formatCurrency(shippingInPaise);
  totalEl.textContent = formatCurrency(totalInPaise);

  if (selectedItems.length === 0 || isPaymentInFlight) {
    buySelectedEl.classList.add('is-disabled');
    buySelectedEl.href = '#shop';
    buySelectedEl.textContent =
      selectedItems.length === 0 ? 'Choose Your Trays First' : 'Starting Razorpay...';
    finalBuyLinkEl.href = '#shop';
    finalBuyLinkEl.textContent =
      selectedItems.length === 0 ? 'Buy Microgreens Now' : 'Starting Razorpay...';
  } else {
    buySelectedEl.classList.remove('is-disabled');
    buySelectedEl.href = '#shop';
    buySelectedEl.textContent = 'Pay with Razorpay';
    finalBuyLinkEl.href = '#shop';
    finalBuyLinkEl.textContent = 'Pay with Razorpay';
  }
}

async function createRazorpayOrder(items, selectedPlan) {
  const response = await fetch('/api/payments/razorpay/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      plan: selectedPlan,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity
      }))
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Could not start Razorpay Checkout.');
  }

  return data;
}

async function verifyRazorpayPayment(paymentResponse) {
  const response = await fetch('/api/payments/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(paymentResponse)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Payment verification failed.');
  }

  return data;
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

async function openRazorpayCheckout(items, selectedPlan) {
  if (isPaymentInFlight) {
    return;
  }

  setPaymentStatus('info', 'Preparing secure Razorpay checkout...');
  isPaymentInFlight = true;
  updateSummary();
  let checkoutOpened = false;

  try {
    const runtimeConfig = await getRuntimeConfig();

    if (!runtimeConfig.razorpayKeyId) {
      throw new Error('Razorpay keys are not configured on this server yet.');
    }

    if (typeof window.Razorpay !== 'function') {
      throw new Error('Razorpay Checkout could not be loaded.');
    }

    const orderData = await createRazorpayOrder(items, selectedPlan);
    const checkoutOptions = {
      ...orderData.checkout,
      key: runtimeConfig.razorpayKeyId,
      prefill: {
        contact: '',
        email: ''
      },
      notes: {
        plan: selectedPlan
      },
      handler: async (paymentResponse) => {
        try {
          const verification = await verifyRazorpayPayment(paymentResponse);
          setPaymentStatus(
            'success',
            `${verification.message} Payment ID: ${verification.paymentId}.`
          );
        } catch (error) {
          setPaymentStatus('error', error.message);
        } finally {
          isPaymentInFlight = false;
          updateSummary();
        }
      },
      modal: {
        ondismiss: () => {
          if (document.getElementById('payment-status')?.classList.contains('payment-status--success')) {
            isPaymentInFlight = false;
            updateSummary();
            return;
          }

          isPaymentInFlight = false;
          updateSummary();
          setPaymentStatus('info', 'Razorpay Checkout was closed before payment completed.');
        }
      }
    };

    const razorpay = new window.Razorpay(checkoutOptions);

    razorpay.on('payment.failed', (event) => {
      const reason =
        event?.error?.description ||
        event?.error?.reason ||
        'Razorpay could not complete the payment.';
      isPaymentInFlight = false;
      updateSummary();
      setPaymentStatus('error', reason);
    });

    razorpay.open();
    checkoutOpened = true;
    setPaymentStatus('info', 'Complete the payment securely in Razorpay Checkout.');
  } catch (error) {
    setPaymentStatus('error', error.message);
    isPaymentInFlight = false;
    updateSummary();
  } finally {
    if (!checkoutOpened && isPaymentInFlight) {
      isPaymentInFlight = false;
      updateSummary();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.plan-switch button').forEach((button) => {
    button.addEventListener('click', () => {
      plan = button.dataset.plan || 'weekly';
      setPaymentStatus('', '');

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

    buyButton?.addEventListener('click', async (event) => {
      event.preventDefault();
      setPaymentStatus('', '');
      const product = products.find((item) => item.id === productId);

      if (!product) {
        return;
      }

      await openRazorpayCheckout(
        [
          {
            ...product,
            quantity: 1
          }
        ],
        'once'
      );
    });
  });

  document.getElementById('buy-selected')?.addEventListener('click', async (event) => {
    event.preventDefault();

    const selectedItems = getSelectedItems();

    if (!selectedItems.length || isPaymentInFlight) {
      return;
    }

    setPaymentStatus('', '');
    await openRazorpayCheckout(selectedItems, plan);
  });

  document.getElementById('final-buy-link')?.addEventListener('click', async (event) => {
    event.preventDefault();

    const selectedItems = getSelectedItems();

    if (!selectedItems.length || isPaymentInFlight) {
      document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setPaymentStatus('', '');
    await openRazorpayCheckout(selectedItems, plan);
  });

  updateSummary();
});
