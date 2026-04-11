const orderCompleteStorageKey = 'sprigandsoil.lastOrder';

const orderCompleteCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

function formatOrderCompleteCurrency(valueInPaise) {
  return orderCompleteCurrency.format((valueInPaise || 0) / 100);
}

function readOrderCompleteState() {
  try {
    const raw = sessionStorage.getItem(orderCompleteStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getQueryValue(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

function setText(id, value) {
  const node = document.getElementById(id);

  if (node) {
    node.textContent = value;
  }
}

function renderCompletionList(items) {
  const list = document.getElementById('complete-items-list');

  if (!list) {
    return;
  }

  list.innerHTML = '';

  if (!items?.length) {
    const empty = document.createElement('p');
    empty.className = 'small-note';
    empty.textContent = 'Your latest order details will appear here after a successful payment.';
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'summary-row';
    row.innerHTML = `<span>${item.name} x ${item.quantity}</span><strong>${formatOrderCompleteCurrency(item.totalInPaise)}</strong>`;
    list.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const state = readOrderCompleteState();
  const order = state?.order;
  const customer = state?.customer;

  renderCompletionList(order?.selectedItems || []);

  setText('complete-total', formatOrderCompleteCurrency(order?.totalInPaise || 0));
  setText(
    'complete-items',
    `${order?.selectedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} trays`
  );
  setText('complete-plan', order?.plan === 'weekly' ? 'Weekly plan' : 'One-time order');
  setText('complete-subtotal', formatOrderCompleteCurrency(order?.subtotalInPaise || 0));
  setText(
    'complete-savings',
    order?.discountInPaise ? `-${formatOrderCompleteCurrency(order.discountInPaise)}` : '₹0.00'
  );
  setText(
    'complete-delivery',
    order?.shippingInPaise ? formatOrderCompleteCurrency(order.shippingInPaise) : 'Included'
  );
  setText('complete-payment-id', state?.paymentId || getQueryValue('payment_id') || 'Pending');
  setText('complete-order-id', state?.orderId || getQueryValue('order_id') || 'Pending');
  setText('complete-customer-name', customer?.name || 'Sprig & Soil customer');
  setText(
    'complete-customer-place',
    [customer?.place, customer?.pincode].filter(Boolean).join(' · ') || 'Kerala delivery belt'
  );
});
