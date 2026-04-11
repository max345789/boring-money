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

let runtimeConfigPromise;
let isPaymentInFlight = false;

function formatCurrency(valueInPaise) {
  return currency.format(valueInPaise / 100);
}

function getRuntimeConfig() {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch('/api/runtime-config', {
      headers: { Accept: 'application/json' }
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
  const status = document.getElementById('checkout-status');

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

function loadSelection() {
  try {
    const raw = localStorage.getItem(checkoutStorageKey);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildOrder(selection) {
  if (!selection?.items?.length) {
    return null;
  }

  const selectedItems = selection.items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);

      if (!product || item.quantity <= 0) {
        return null;
      }

      return {
        ...product,
        quantity: item.quantity,
        totalInPaise: product.priceInPaise * item.quantity
      };
    })
    .filter(Boolean);

  if (!selectedItems.length) {
    return null;
  }

  const subtotalInPaise = selectedItems.reduce((sum, item) => sum + item.totalInPaise, 0);
  const discountInPaise = selection.plan === 'weekly' ? Math.floor(subtotalInPaise * 0.1) : 0;
  const shippingInPaise =
    subtotalInPaise === 0 || subtotalInPaise >= 79900 || selection.plan === 'weekly' ? 0 : 6000;

  return {
    plan: selection.plan,
    selectedItems,
    subtotalInPaise,
    discountInPaise,
    shippingInPaise,
    totalInPaise: subtotalInPaise - discountInPaise + shippingInPaise
  };
}

function renderOrder(order) {
  const emptyState = document.getElementById('checkout-empty');
  const content = document.getElementById('checkout-content');
  const list = document.getElementById('checkout-summary-list');

  if (!order) {
    emptyState.hidden = false;
    content.hidden = true;
    return;
  }

  emptyState.hidden = true;
  content.hidden = false;

  list.innerHTML = '';
  order.selectedItems.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `<span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.totalInPaise)}</strong>`;
    list.appendChild(row);
  });

  document.getElementById('checkout-plan').textContent =
    order.plan === 'weekly' ? 'Weekly plan' : 'One-time order';
  document.getElementById('checkout-items').textContent = String(
    order.selectedItems.reduce((count, item) => count + item.quantity, 0)
  );
  document.getElementById('checkout-subtotal').textContent = formatCurrency(order.subtotalInPaise);
  document.getElementById('checkout-savings').textContent =
    order.discountInPaise > 0 ? `-${formatCurrency(order.discountInPaise)}` : formatCurrency(0);
  document.getElementById('checkout-delivery').textContent =
    order.shippingInPaise === 0 ? 'Included' : formatCurrency(order.shippingInPaise);
  document.getElementById('checkout-total').textContent = formatCurrency(order.totalInPaise);
}

function getCustomerDetails(form) {
  const formData = new FormData(form);

  return {
    name: String(formData.get('name') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    place: String(formData.get('place') || '').trim(),
    pincode: String(formData.get('pincode') || '').trim(),
    landmark: String(formData.get('landmark') || '').trim()
  };
}

function validateCustomer(details) {
  if (details.name.length < 2) {
    return 'Enter your full name.';
  }

  if (!/^\+?[0-9 ]{10,15}$/.test(details.phone)) {
    return 'Enter a valid phone number.';
  }

  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return 'Enter a valid email address.';
  }

  if (details.address.length < 8) {
    return 'Enter your delivery address.';
  }

  if (details.place.length < 2) {
    return 'Enter your place or town.';
  }

  if (!/^\d{6}$/.test(details.pincode)) {
    return 'Enter a valid 6-digit pincode.';
  }

  return null;
}

async function createRazorpayOrder(order, customer) {
  const response = await fetch('/api/payments/razorpay/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      plan: order.plan,
      items: order.selectedItems.map((item) => ({
        id: item.id,
        quantity: item.quantity
      })),
      customer
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

async function openRazorpayCheckout(order, customer) {
  if (isPaymentInFlight) {
    return;
  }

  isPaymentInFlight = true;
  setPaymentStatus('info', 'Preparing secure Razorpay checkout...');
  let checkoutOpened = false;

  try {
    const runtimeConfig = await getRuntimeConfig();

    if (!runtimeConfig.razorpayKeyId) {
      throw new Error('Razorpay keys are not configured on this server yet.');
    }

    if (typeof window.Razorpay !== 'function') {
      throw new Error('Razorpay Checkout could not be loaded.');
    }

    const orderData = await createRazorpayOrder(order, customer);
    const razorpay = new window.Razorpay({
      ...orderData.checkout,
      key: runtimeConfig.razorpayKeyId,
      handler: async (paymentResponse) => {
        try {
          const verification = await verifyRazorpayPayment(paymentResponse);
          localStorage.removeItem(checkoutStorageKey);
          setPaymentStatus(
            'success',
            `${verification.message} Payment ID: ${verification.paymentId}.`
          );
          document.getElementById('checkout-form')?.reset();
        } catch (error) {
          setPaymentStatus('error', error.message);
        } finally {
          isPaymentInFlight = false;
        }
      },
      modal: {
        ondismiss: () => {
          if (
            document
              .getElementById('checkout-status')
              ?.classList.contains('payment-status--success')
          ) {
            isPaymentInFlight = false;
            return;
          }

          isPaymentInFlight = false;
          setPaymentStatus('info', 'Razorpay Checkout was closed before payment completed.');
        }
      }
    });

    razorpay.on('payment.failed', (event) => {
      const reason =
        event?.error?.description ||
        event?.error?.reason ||
        'Razorpay could not complete the payment.';
      isPaymentInFlight = false;
      setPaymentStatus('error', reason);
    });

    razorpay.open();
    checkoutOpened = true;
    setPaymentStatus('info', 'Complete the payment securely in Razorpay Checkout.');
  } catch (error) {
    isPaymentInFlight = false;
    setPaymentStatus('error', error.message);
  } finally {
    if (!checkoutOpened && isPaymentInFlight) {
      isPaymentInFlight = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const order = buildOrder(loadSelection());
  renderOrder(order);

  const form = document.getElementById('checkout-form');
  const submitButton = document.getElementById('checkout-pay');

  if (!form || !submitButton || !order) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isPaymentInFlight) {
      return;
    }

    const customer = getCustomerDetails(form);
    const validationError = validateCustomer(customer);

    if (validationError) {
      setPaymentStatus('error', validationError);
      return;
    }

    await openRazorpayCheckout(order, customer);
  });
});
