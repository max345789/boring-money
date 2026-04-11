const { productCatalog } = require('../microgreens');

const siteUrl = process.env.SITE_URL || 'https://sprigandsoil.in';
const whatsappPhone = process.env.WHATSAPP_PHONE || '91XXXXXXXXXX';
const instagramUrl = process.env.INSTAGRAM_URL || 'https://www.instagram.com/sprigandsoil';
const whatsappMessage = encodeURIComponent(
  'Hi, I want to subscribe to Sprig & Soil microgreens'
);

const productMeta = {
  sunflower: {
    accent: 'gold',
    label: 'Fresh tray',
    flavor: 'Nutty, juicy, and substantial enough for wraps, grain bowls, and lunch plates.',
    benefit: 'High in plant protein and texture, ideal when you want greens that feel substantial rather than decorative.',
    usage: 'Best for wraps, bowls, sandwiches, and crunchy lunchboxes'
  },
  broccoli: {
    accent: 'forest',
    label: 'Daily staple',
    flavor: 'Clean, mild, and easy to fold into smoothies, omelets, and simple breakfast plates.',
    benefit: 'A gentle everyday tray for customers building a consistent wellness habit without strong peppery notes.',
    usage: 'Best for smoothies, eggs, salads, and everyday wellness'
  },
  radish: {
    accent: 'rose',
    label: 'Chef favorite',
    flavor: 'Peppery and bright with the snap that lifts rich foods and adds energy to simple meals.',
    benefit: 'Built for customers who want stronger flavor, faster salad upgrades, and plate contrast.',
    usage: 'Best for avocado toast, tacos, curries, and finishing rich meals'
  },
  pea: {
    accent: 'sage',
    label: 'Family-friendly',
    flavor: 'Sweet, tender, and familiar enough for families easing into fresh live greens.',
    benefit: 'Brings freshness to toast, sandwiches, and snack plates without bitterness.',
    usage: 'Best for sandwiches, snack plates, dosa sides, and family meals'
  }
};

const products = productCatalog.map((product) => ({
  ...product,
  ...productMeta[product.id]
}));

const areaLinks = [
  { href: '/microgreens-pattambi', label: 'Pattambi' },
  { href: '/microgreens-valanchery', label: 'Valanchery' },
  { href: '/microgreens-pallipuram', label: 'Pallipuram' },
  { href: '/microgreens-pulamanthole', label: 'Pulamanthole' }
];

const site = {
  name: 'Sprig & Soil',
  siteUrl,
  shortDescription:
    'Fresh microgreens grown locally and delivered weekly across Pattambi, Valanchery, Pallipuram, and Pulamanthole.',
  supportEmail: 'hello@sprigandsoil.com',
  orderEmail: 'orders@sprigandsoil.com',
  phoneDisplay: '+91-XXXXXXXXXX',
  whatsappPhone,
  whatsappHref: `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`,
  instagramUrl,
  primaryNav: [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/subscribe', label: 'Subscribe' },
    { href: '/blog', label: 'Blog' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' }
  ],
  footerNav: [
    { href: '/about', label: 'About' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/guides', label: 'Recipes' },
    { href: '/shop', label: 'Shop' },
    { href: '/subscribe', label: 'Subscribe' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' }
  ],
  promiseStrip: [
    'Harvested within 48 hours of delivery',
    'Weekly subscription and one-time boxes',
    'Direct checkout with local delivery scheduling'
  ],
  hero: {
    eyebrow: 'Kerala microgreens delivery',
    headline: 'Farm-Fresh Microgreens, Delivered Weekly to Your Door',
    body:
      'Sprig & Soil brings farm fresh microgreens and weekly microgreen delivery to homes in Pattambi, Valanchery, Pallipuram, and Pulamanthole, with simple direct checkout and doorstep delivery.',
    primaryCta: { href: '/subscribe', label: 'Subscribe today' },
    secondaryCta: { href: '/shop', label: 'Shop single boxes' }
  },
  home: {
    metaTitle:
      'Fresh Microgreens Delivery - Pattambi, Valanchery, Pallipuram | Sprig & Soil',
    metaDescription:
      'Weekly fresh microgreens delivered to your door in Pattambi, Valanchery, Pallipuram & Pulamanthole. Harvested within 48 hrs. Subscribe now - Sprig & Soil.',
    serviceIntro:
      'We serve customers looking for microgreens Pattambi, microgreens Valanchery, microgreens Pallipuram, and microgreens Pulamanthole with a short local delivery loop across the Pattambi-Malappuram belt.',
    keywordCopy:
      'This is fresh microgreens Kerala delivery designed for real households: a weekly vegetable box Pattambi families can keep up with, a microgreens home delivery option for busy homes, and a simple microgreen subscription Kerala customers can reorder without friction.',
    whyIntro:
      'Sprig & Soil is built around organic microgreens Kerala buyers can trust: clean growing, careful harvest timing, and a delivery window short enough to keep texture and nutrition intact.',
    howItWorksIntro:
      'Our weekly microgreen delivery model keeps things simple. Choose your trays, pick a rhythm, enter your delivery details, and get fresh microgreens Kerala households can use across the week.',
    boxIntro:
      'Each box is built around practical staples for breakfast, lunch, and dinner. You get farm fresh microgreens instead of tired supermarket greens that already spent days in transport.',
    subscribeIntro:
      'If you want fresh microgreens Kerala homes can actually finish every week, start with a single box or move straight into a microgreen subscription Kerala delivery plan.'
  },
  serviceAreasHeading: 'Serving Pattambi, Valanchery, Pallipuram & Pulamanthole',
  featuredStats: [
    { value: '48 hrs', label: 'Typical harvest-to-door window' },
    { value: '4', label: 'Core trays in the weekly line-up' },
    { value: '10 km', label: 'Tight delivery belt for freshness' }
  ],
  serviceAreas: [
    {
      title: 'Pattambi',
      body: 'Fast local routes around Pattambi town centre, Bharathapuzha-side neighbourhoods, and the nearby college and residential clusters.',
      href: '/microgreens-pattambi'
    },
    {
      title: 'Valanchery',
      body: 'Weekly microgreen delivery extending into the Valanchery side of Malappuram for customers who want a local, fresher alternative to supermarket greens.',
      href: '/microgreens-valanchery'
    },
    {
      title: 'Pallipuram',
      body: 'Chemical-free weekly boxes for the Pallipuram and Parathur Panchayath side, where farm familiarity already matters to buyers.',
      href: '/microgreens-pallipuram'
    },
    {
      title: 'Pulamanthole',
      body: 'Fresh trays delivered toward Pulamanthole with a focus on families who care about food quality, local agriculture, and Ayurvedic health habits.',
      href: '/microgreens-pulamanthole'
    }
  ],
  principles: [
    {
      title: 'Locally harvested, not long-hauled',
      body: 'The greens are cut close to delivery day, so you get tenderness, crunch, and nutrition before a cold-chain lag strips them down.'
    },
    {
      title: 'Built for real Kerala meals',
      body: 'These trays are meant for omelets, puttu sides, dosa plates, rice bowls, wraps, juices, and everyday lunch prep, not just garnish photography.'
    },
    {
      title: 'Low-friction ordering',
      body: 'Choose your trays, enter your delivery details, and keep the habit simple enough for a solo builder brand to serve consistently.'
    }
  ],
  steps: [
    {
      title: 'Choose a single box or weekly plan',
      body: 'Start with one tray mix if you are testing the habit, or lock in a weekly plan for regular supply.'
    },
    {
      title: 'Confirm your area and delivery day',
      body: 'We schedule around the Pattambi, Valanchery, Pallipuram, and Pulamanthole belt so the delivery route stays tight.'
    },
    {
      title: 'Add details and pay online',
      body: 'Use the shop to choose your trays, confirm delivery details, and pay securely online.'
    },
    {
      title: 'Receive, store, and use through the week',
      body: 'Your box arrives ready for breakfast plates, lunch bowls, juices, sandwiches, curries, and light salads.'
    }
  ],
  rituals: [
    {
      title: 'Breakfast boost',
      body: 'Add broccoli or pea shoots to eggs, toast, puttu sides, or juice for a simple nutrition upgrade.'
    },
    {
      title: 'Lunch freshness',
      body: 'Use sunflower and radish trays to brighten rice bowls, wraps, sandwiches, and packed office lunches.'
    },
    {
      title: 'Dinner finishing greens',
      body: 'Finish soups, curries, grilled fish, and roasted vegetables with a handful just before serving.'
    }
  ],
  testimonials: [
    {
      quote:
        'The weekly box is the first health habit we have kept without feeling forced. The greens are fresh enough that we actually finish them.',
      author: 'Maya R.',
      role: 'Subscriber near Pattambi'
    },
    {
      quote:
        'Sunflower and radish trays changed our lunch routine. It feels premium, but it is still practical for a busy home.',
      author: 'Anika P.',
      role: 'Weekly subscriber in the belt'
    },
    {
      quote:
        'The freshness is obvious. It tastes like something grown nearby, not a pack that spent a week travelling.',
      author: 'Jon V.',
      role: 'Repeat customer'
    }
  ],
  faq: [
    {
      question: 'What are microgreens?',
      answer:
        'Microgreens are young vegetable shoots harvested when they are vibrant, tender, and full of flavor. They are easy to add to daily meals without changing the whole way you cook.'
    },
    {
      question: 'How long do they stay fresh?',
      answer:
        'Most trays stay fresh for 7 to 10 days in the fridge when kept cold and dry. Because the delivery radius is short, they arrive with more usable life.'
    },
    {
      question: 'Can I order once before subscribing?',
      answer:
        'Yes. Single box purchase is available, and it is the best way to test which trays your household actually uses.'
    },
    {
      question: 'Do you deliver outside these four areas?',
      answer:
        'Right now the focus is the tight Pattambi, Valanchery, Pallipuram, and Pulamanthole belt so the product can stay reliably fresh.'
    }
  ],
  aboutPoints: [
    {
      title: 'Small-batch indoor growing',
      body: 'We focus on consistency, food safety, and clean handling so the product feels premium and dependable.'
    },
    {
      title: 'Flavor-first tray selection',
      body: 'A microgreen matters only if people want to eat it again, so the line is built around repeat use and familiar meal patterns.'
    },
    {
      title: 'Hyperlocal delivery logic',
      body: 'The service radius stays tight on purpose. That is how a small farm keeps the freshness promise credible.'
    }
  ],
  guideMoments: [
    {
      title: 'Use with Kerala breakfasts',
      body: 'Add microgreens to egg dishes, serve with puttu and kadala, or fold into dosa and appam side plates for an easy nutrition lift.'
    },
    {
      title: 'Upgrade lunch without extra prep',
      body: 'A handful on a rice bowl, chappathi wrap, or salad plate changes the meal faster than cooking a separate vegetable side.'
    },
    {
      title: 'Finish dinner fresh',
      body: 'Use radish or sunflower shoots as a final fresh layer on curries, grilled items, or soups just before serving.'
    }
  ],
  deliveryZones: [
    'Single purchase box for first-time buyers',
    'Weekly microgreen subscription for households',
    'Flexible family supply for repeat orders',
    'Small hospitality and cafe supply by arrangement'
  ],
  wholesaleNotes: [
    'Predictable weekly harvest scheduling',
    'Suitable for home subscribers and local hospitality buyers',
    'Simple direct checkout for repeat household orders'
  ],
  contactOptions: [
    {
      title: 'Subscription help',
      body: 'Use the Subscribe page if you want the weekly box explained clearly before ordering.'
    },
    {
      title: 'Wholesale and office supply',
      body: 'Use the contact form for cafes, office pantry requests, recurring hospitality supply, or bulk tray needs.'
    },
    {
      title: 'Questions before you order',
      body: 'Reach out for delivery timing, area confirmation, tray recommendations, or larger recurring orders.'
    }
  ],
  areas: areaLinks,
  defaultOgImage: '/images/pattambi-microgreens-fresh.jpg'
};

site.localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: site.name,
  description:
    'Fresh microgreens grown locally and delivered weekly to Pattambi, Valanchery, Pallipuram, and Pulamanthole in Kerala.',
  url: site.siteUrl,
  telephone: site.phoneDisplay,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Pattambi',
    addressRegion: 'Kerala',
    postalCode: '679303',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '10.8117',
    longitude: '76.1987'
  },
  areaServed: site.areas.map((area) => ({
    '@type': 'City',
    name: area.label
  })),
  priceRange: '\u20b9\u20b9',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '18:00'
  },
  sameAs: [site.instagramUrl]
};

site.productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Weekly Microgreen Subscription Box',
  description:
    'Fresh microgreens harvested within 48 hours, delivered weekly to your doorstep in Pattambi, Valanchery, Pallipuram, and Pulamanthole.',
  brand: {
    '@type': 'Brand',
    name: site.name
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'LocalBusiness',
      name: site.name
    }
  }
};

const locationPages = [
  {
    slug: 'microgreens-pattambi',
    path: '/microgreens-pattambi',
    title: 'Fresh Microgreens Delivery in Pattambi | Sprig & Soil',
    metaDescription:
      'Get farm-fresh microgreens delivered weekly in Pattambi. Harvested locally, at your door within 48 hours. Subscribe - Sprig & Soil Kerala.',
    h1: 'Fresh Microgreens Delivered Weekly in Pattambi',
    intro:
      'If you are looking for reliable microgreens Pattambi delivery, Sprig & Soil is built around exactly that. We grow small-batch trays locally and deliver on a short route, so the greens arrive crisp, bright, and ready to eat instead of tired from a long cold-chain journey.',
    paragraphs: [
      'Our Pattambi customers include families near Bharathapuzha, homes around Pattambi town centre, and people in the local college area who want better greens without making a separate market run every few days. Because the delivery radius stays tight, we can harvest close to delivery day and keep the taste, texture, and shelf life strong. That matters when you are trying to build a simple health habit instead of buying something that looks good for one day and then fades in the fridge.',
      'The weekly box is designed for real meals. Add broccoli or pea shoots to breakfast, use sunflower greens in wraps or rice bowls, and finish curries or lunch plates with radish for bite. This is microgreens home delivery for Pattambi households that want practical nutrition, not novelty. If you are just testing the habit, start with a one-time box. If you already know you want a steady supply, move into the weekly plan and keep the kitchen stocked.',
      'Sprig & Soil is a hyperlocal Kerala microgreen subscription, so service stays personal. You can confirm your delivery area quickly, choose a plan that fits your kitchen, and place repeat orders without friction. For customers in and around Pattambi, that local loop is the advantage: fresher greens, simpler ordering, and weekly delivery that actually fits the way you live.'
    ],
    localNotes: ['Bharathapuzha', 'Pattambi town centre', 'college area'],
    articleSchema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Fresh Microgreens Delivered Weekly in Pattambi',
      url: `${site.siteUrl}/microgreens-pattambi`,
      description:
        'Farm-fresh microgreens delivered weekly in Pattambi, harvested locally and delivered within 48 hours.'
    }
  },
  {
    slug: 'microgreens-valanchery',
    path: '/microgreens-valanchery',
    title: 'Fresh Microgreens Delivery in Valanchery | Sprig & Soil',
    metaDescription:
      "Farm-fresh microgreens delivered to Valanchery every week. No preservatives, harvested locally. Join Sprig & Soil - Kerala's fresh microgreen subscription.",
    h1: 'Fresh Microgreens Delivered Weekly in Valanchery',
    intro:
      'Sprig & Soil now serves customers searching for microgreens Valanchery delivery with a short local route from our grow setup into the Valanchery side of the belt. That means cleaner timing, fresher trays, and a delivery model built for households that care about food quality but do not want another complicated routine.',
    paragraphs: [
      'Valanchery sits in a part of Malappuram where health awareness is growing, but fresh produce still often comes through a longer distribution chain before it reaches the customer. Our model is different. We harvest locally, keep the delivery area focused, and bring the trays out within a tight window so the product still feels alive when you open it. That difference shows up in taste, crunch, and how long the greens stay usable in the fridge.',
      'For customers in Valanchery, the weekly box works well because it turns nutrition into a repeatable habit. Broccoli and pea shoots fit breakfast and juice routines. Sunflower greens add bulk and freshness to lunch plates. Radish gives curries, wraps, and grain bowls a sharper finish. This is fresh microgreens Kerala delivery designed for practical daily use, not a one-time wellness experiment.',
      'Because Sprig & Soil is still a small local brand, ordering stays direct. Choose your trays on the site, enter your delivery details, and confirm the best plan for your household without extra back-and-forth. If you want a lighter start, order once. If you want a steadier rhythm, move to the subscription. For Valanchery, the value is simple: fresher greens, local handling, and a service built close enough to care.'
    ],
    localNotes: ['Valanchery', 'Malappuram district', 'health-focused households'],
    articleSchema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Fresh Microgreens Delivered Weekly in Valanchery',
      url: `${site.siteUrl}/microgreens-valanchery`,
      description:
        'Farm-fresh microgreens delivered every week in Valanchery with short local harvest-to-door timing.'
    }
  },
  {
    slug: 'microgreens-pallipuram',
    path: '/microgreens-pallipuram',
    title: 'Fresh Microgreens Delivery in Pallipuram | Sprig & Soil',
    metaDescription:
      'Weekly microgreen delivery in Pallipuram, Pattambi block. Fresh, local, chemical-free. Subscribe to Sprig & Soil and eat better every week.',
    h1: 'Fresh Microgreens Delivered Weekly in Pallipuram',
    intro:
      'Sprig & Soil offers weekly microgreens delivery in Pallipuram for families who want something fresher, cleaner, and more local than supermarket greens. The service is built for a short local radius, so the greens are harvested close to delivery and arrive ready for daily cooking and light meal prep.',
    paragraphs: [
      'Pallipuram sits within a belt where farming roots still matter, especially around the Parathur Panchayath side. That local agricultural memory is part of why microgreens make sense here. People understand the value of produce that is grown close by and handled carefully. Our model leans into that. We do not promise industrial scale. We promise a smaller, more controlled product that reaches you with better texture and flavor because it has not spent extra days in transit.',
      'A weekly box works well in Pallipuram because it gives you several ways to use the trays without waste. Broccoli and pea shoots slot into breakfast. Sunflower greens work for lunch bowls, sandwiches, and salads. Radish gives evening meals a fresh peppery finish. This is organic microgreens Kerala delivery for households that want variety, but still need something practical enough to finish through the week.',
      'If you are in Pallipuram and want a local food habit that feels manageable, start with a single order and see which trays your home reaches for first. Then move into the weekly subscription. The checkout flow is simple, the delivery route stays local, and the product remains aligned with the farming values people in this area already respect.'
    ],
    localNotes: ['Pallipuram', 'Parathur Panchayath', 'local farming roots'],
    articleSchema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Fresh Microgreens Delivered Weekly in Pallipuram',
      url: `${site.siteUrl}/microgreens-pallipuram`,
      description:
        'Weekly microgreen delivery in Pallipuram with a local, chemical-free, short-route freshness model.'
    }
  },
  {
    slug: 'microgreens-pulamanthole',
    path: '/microgreens-pulamanthole',
    title: 'Fresh Microgreens Delivery in Pulamanthole | Sprig & Soil',
    metaDescription:
      'Get fresh microgreens delivered in Pulamanthole. Grown locally on the banks of Kunthippuzha. Natural nutrition, weekly delivery - Sprig & Soil Kerala.',
    h1: 'Fresh Microgreens Delivered Weekly in Pulamanthole',
    intro:
      'For households looking for microgreens Pulamanthole delivery, Sprig & Soil offers a short-route weekly box built around freshness, local handling, and easy reordering. The idea is simple: deliver live greens close enough to harvest that the product still feels vibrant when it reaches your kitchen.',
    paragraphs: [
      'Pulamanthole is closely associated with the Kunthippuzha river and a long local respect for health traditions, including Ayurvedic thinking around food quality and natural nourishment. Microgreens fit naturally into that context. They are small, dense, flavorful greens that can support a more intentional food routine without requiring a complete lifestyle reset. Because our service area stays local, we can keep the freshness promise much stronger than a general retail chain.',
      'In practical terms, that means greens you can actually use all week. Add broccoli shoots to juices or breakfast plates, use sunflower greens in lunch wraps, and finish rice or curry meals with radish or pea shoots. This is microgreens home delivery built for Pulamanthole families who want better food inputs, not more hassle. If you care about local agriculture and food that feels less industrial, the weekly box makes a lot of sense.',
      'Ordering is kept simple on purpose. Choose your trays, confirm your area with your delivery details, and pick a one-time box or ongoing plan. For Pulamanthole, the value is not just convenience. It is the combination of local agriculture, natural nutrition, and a delivery model shaped around the rhythm of the area instead of a generic state-wide supply chain.'
    ],
    localNotes: ['Kunthippuzha', 'Ayurvedic tradition', 'agricultural heritage'],
    articleSchema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Fresh Microgreens Delivered Weekly in Pulamanthole',
      url: `${site.siteUrl}/microgreens-pulamanthole`,
      description:
        'Fresh microgreens delivered weekly in Pulamanthole, inspired by local food heritage and short-route freshness.'
    }
  }
];

const locationPageBySlug = new Map(locationPages.map((page) => [page.slug, page]));

const blogPosts = [
  {
    slug: 'microgreens-benefits-malayalam',
    path: '/blog/microgreens-benefits-malayalam',
    title: 'Why Microgreens Are the Best Nutritional Addition to Your Kerala Kitchen',
    metaDescription:
      'Discover why microgreens work so well in Kerala kitchens, from breakfast plates to curries, salads, and juices.',
    keywords: ['microgreens benefits Kerala', 'microgreens nutrition India'],
    intro:
      'Microgreens make sense in Kerala because they fit easily into food habits that already value freshness, variety, and plant-based nutrition. They do not ask you to abandon familiar meals. They simply make those meals more vibrant.',
    sections: [
      {
        heading: 'Small greens, strong nutrition',
        paragraphs: [
          'People often assume microgreens are only for salads, but their real strength is density. These young shoots are tender, flavorful, and nutrient-rich, which means you can add a small handful to a meal and still make a noticeable difference. For homes looking up microgreens benefits Kerala or microgreens nutrition India, that convenience matters as much as the nutrition itself.',
          'Because they are harvested early and delivered fresh, microgreens also retain the crispness and brightness that make them easier to eat regularly. That is important in a kitchen where food has to work across breakfast, lunch, tea-time snacks, and dinner without becoming another chore.'
        ]
      },
      {
        heading: 'Easy to use in Kerala meals',
        paragraphs: [
          'Kerala food culture already works well with fresh additions. Add broccoli shoots to a breakfast plate, use sunflower greens with puttu or chappathi wraps, and finish curries or rice bowls with radish or pea shoots for lift. They also work in salads, sandwiches, omelets, juices, and even as a fresh side with evening meals.',
          'The point is not to build a completely new menu. The point is to make existing dishes lighter, fresher, and more nutrient-dense with very little extra effort.'
        ]
      },
      {
        heading: 'Why local delivery matters',
        paragraphs: [
          'Freshness changes everything with microgreens. A tray harvested close to delivery tastes better, stores better, and feels more valuable than greens that spent several days moving through a long chain. That is why a hyperlocal service matters more than a generic healthy-food label.',
          'For customers in the Pattambi-Valanchery belt, a weekly microgreens box creates one of the easiest health habits to maintain. You get the nutrition, the freshness, and the flexibility to use it in food you already love.'
        ]
      }
    ]
  },
  {
    slug: 'microgreens-pattambi-delivery',
    path: '/blog/microgreens-pattambi-delivery',
    title: "Fresh Microgreens Now Delivered in Pattambi - Here's What You Need to Know",
    metaDescription:
      'Looking for microgreens Pattambi delivery? Here is how Sprig & Soil schedules weekly boxes, local delivery, and simple ordering.',
    keywords: ['microgreens Pattambi', 'fresh vegetables delivery Pattambi'],
    intro:
      'Microgreens Pattambi delivery now has a simpler local option. Sprig & Soil serves Pattambi with weekly boxes and one-time orders, keeping the delivery area short enough to protect freshness.',
    sections: [
      {
        heading: 'What the service looks like',
        paragraphs: [
          'The service is built for homes in and around Pattambi that want something fresher than generic store greens. Orders are collected through the site, trays are harvested close to dispatch, and the delivery route stays compact so the greens arrive ready to use.',
          'That short local loop matters. When fresh vegetables delivery Pattambi customers rely on comes from a longer chain, shelf life usually drops before the box even reaches home.'
        ]
      },
      {
        heading: 'What you can order',
        paragraphs: [
          'Sprig & Soil offers both single purchases and a weekly subscription box. That gives first-time buyers a low-friction way to test the habit, while regular customers can keep a steady supply without rethinking the order every week.',
          'Typical trays include broccoli, sunflower, radish, and pea shoots. Each one is selected because it works across breakfast, lunch, and dinner rather than only in salads.'
        ]
      },
      {
        heading: 'How to place an order',
        paragraphs: [
          'The easiest way to order is to choose a box on the site and complete checkout with your delivery details. That keeps the process clear and predictable for local customers.',
          'If you are in Pattambi and want fresher greens with less waste, the combination of local harvesting, quick delivery, and direct checkout is what makes this service stand out.'
        ]
      }
    ]
  },
  {
    slug: 'microgreens-vs-supermarket-greens',
    path: '/blog/microgreens-vs-supermarket-greens',
    title: 'Supermarket Greens vs Farm-Fresh Microgreens - The Difference Is Real',
    metaDescription:
      'See how shelf life, freshness, and nutrition compare between supermarket greens and local farm-fresh microgreens in Kerala.',
    keywords: ['fresh microgreens Kerala', 'farm fresh vegetables Kerala'],
    intro:
      'The difference between supermarket greens and a local microgreen box is not branding. It is timing. When greens travel less and arrive sooner, taste, texture, and value all improve.',
    sections: [
      {
        heading: 'Shelf life starts before you buy',
        paragraphs: [
          'Most supermarket greens already spent part of their usable life in transport, cold storage, and shelf handling before they reach your basket. That means you bring them home with less time left. A fresh microgreens Kerala delivery model works differently because the product is harvested close to dispatch and moves through fewer hands.',
          'That does not just make the greens taste better. It also reduces the frustrating cycle of buying healthy produce and throwing part of it away.'
        ]
      },
      {
        heading: 'Nutrition and flavor are tied to freshness',
        paragraphs: [
          'Farm fresh vegetables Kerala households receive directly from a local grower tend to feel more alive because the flavor is still intact. Microgreens push that advantage further because they are harvested at a stage where tenderness and concentration are high.',
          'Customers often notice the biggest difference in texture first. The greens feel crisp, fresh, and ready to use rather than flat or damp.'
        ]
      },
      {
        heading: 'Local delivery changes buying behavior',
        paragraphs: [
          'When the product feels genuinely fresh, people use it more often. That is the hidden advantage of a local subscription box. It turns healthy buying into healthy eating.',
          'For the Pattambi-Valanchery belt, the real comparison is not just supermarket versus farm. It is long-chain produce versus short-route produce. That is where Sprig & Soil has an edge.'
        ]
      }
    ]
  },
  {
    slug: 'how-to-use-microgreens-in-kerala-food',
    path: '/blog/how-to-use-microgreens-in-kerala-food',
    title: 'How to Use Microgreens in Your Daily Kerala Meals',
    metaDescription:
      'Practical ideas for using microgreens in Kerala food, from puttu and dosa to curries, rice bowls, and juices.',
    keywords: ['microgreens recipe Kerala', 'how to eat microgreens India'],
    intro:
      'One reason people stop buying healthy foods is confusion about how to use them. Microgreens solve that problem better than most wellness products because they slide into meals you already eat.',
    sections: [
      {
        heading: 'Breakfast is the easiest starting point',
        paragraphs: [
          'If you are learning how to eat microgreens India style, start with breakfast. Add a handful of broccoli or pea shoots beside puttu, fold them into an omelet, or serve them with dosa and chutney as a fresh counterpoint.',
          'They also blend well into a green juice or smoothie when you want the nutrition without changing the plate too much.'
        ]
      },
      {
        heading: 'Lunch and dinner need only small changes',
        paragraphs: [
          'A good microgreens recipe Kerala households can keep repeating is usually a very small adjustment. Add sunflower greens to a chappathi roll, top a rice bowl with radish shoots, or use pea shoots to brighten a curry plate just before serving.',
          'Because the greens are tender, they work best as a fresh finish rather than something cooked for a long time.'
        ]
      },
      {
        heading: 'Make the habit sustainable',
        paragraphs: [
          'The goal is not to turn every meal into a health project. The goal is to have one box in the fridge that improves several meals across the week. That is why subscription boxes work so well.',
          'For households in Kerala, microgreens become useful when they meet the rhythm of the kitchen: quick breakfasts, practical lunches, simple dinners, and food that still feels familiar.'
        ]
      }
    ]
  },
  {
    slug: 'microgreens-subscription-kerala',
    path: '/blog/microgreens-subscription-kerala',
    title: "Why a Weekly Microgreen Subscription Is the Easiest Health Habit You'll Build",
    metaDescription:
      'A weekly microgreen subscription in Kerala makes healthy eating easier by turning fresh greens into a simple repeat habit.',
    keywords: ['microgreen subscription Kerala', 'weekly vegetables delivery Kerala'],
    intro:
      'Health habits fail when they require too many decisions. A weekly microgreen subscription works because it removes the decision fatigue around buying and using fresh greens.',
    sections: [
      {
        heading: 'Consistency beats intensity',
        paragraphs: [
          'Most people do not need a dramatic health reset. They need one small input they can repeat. A microgreen subscription Kerala households receive weekly does exactly that. It keeps fresh greens available without forcing another market trip or another last-minute choice.',
          'That consistency matters more than trying to buy healthy once in a while and then letting the routine drop.'
        ]
      },
      {
        heading: 'A better version of weekly vegetables delivery',
        paragraphs: [
          'Traditional weekly vegetables delivery Kerala customers know can be useful, but it often brings more volume than flexibility. Microgreens are different because they fit across several meals in small amounts while still feeling premium and fresh.',
          'One tray can support breakfast, lunch, and dinner for multiple days. That makes the box easy to finish and easy to justify.'
        ]
      },
      {
        heading: 'Why Sprig & Soil uses a local belt model',
        paragraphs: [
          'A local delivery radius helps the subscription stay credible. Greens are harvested nearer to dispatch, quality stays steadier, and the order flow stays direct on the site.',
          'For customers across Pattambi, Valanchery, Pallipuram, and Pulamanthole, the weekly subscription is the easiest way to build a repeatable health habit without overcomplicating the kitchen.'
        ]
      }
    ]
  }
];

const blogPostBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

module.exports = {
  site,
  products,
  locationPages,
  locationPageBySlug,
  blogPosts,
  blogPostBySlug
};
