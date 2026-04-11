const productCatalog = [
  {
    id: 'sunflower',
    name: 'Sunflower Crunch',
    priceInPaise: 19900
  },
  {
    id: 'broccoli',
    name: 'Broccoli Shield',
    priceInPaise: 22900
  },
  {
    id: 'radish',
    name: 'Radish Ignite',
    priceInPaise: 19900
  },
  {
    id: 'pea',
    name: 'Pea Tendril Sweet',
    priceInPaise: 24900
  }
];

const productById = new Map(productCatalog.map((product) => [product.id, product]));

function buildMicrogreenOrder(items, plan) {
  const selectedItems = items
    .map((item) => {
      const product = productById.get(item.id);

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

  const subtotalInPaise = selectedItems.reduce((sum, item) => sum + item.totalInPaise, 0);
  const discountInPaise = plan === 'weekly' ? Math.floor(subtotalInPaise * 0.1) : 0;
  const shippingInPaise =
    subtotalInPaise === 0 || subtotalInPaise >= 79900 || plan === 'weekly' ? 0 : 6000;
  const totalInPaise = subtotalInPaise - discountInPaise + shippingInPaise;

  return {
    currency: 'INR',
    selectedItems,
    subtotalInPaise,
    discountInPaise,
    shippingInPaise,
    totalInPaise
  };
}

module.exports = {
  productCatalog,
  productById,
  buildMicrogreenOrder
};
