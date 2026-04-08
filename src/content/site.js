const site = {
  name: 'BoringMoney',
  shortDescription: 'Premium research on cash-flowing businesses that win quietly.',
  hero: {
    eyebrow: 'Weekly operator-grade breakdowns',
    headline: 'The boring businesses that win.',
    body:
      'BoringMoney turns ignored small-business categories into investable intelligence. Every issue breaks down revenue model, margins, operator workload, and acquisition angle without startup theatre.',
    primaryCta: { label: 'Join Free', href: '/subscribe' },
    secondaryCta: { label: 'Browse Issues', href: '/issues' },
    manifesto:
      'Nobody writes about the owner clearing steady cash from four car washes in Fresno. That gap is the product.'
  },
  stats: [
    { label: 'Deep dives per year', value: 52, suffix: '' },
    { label: 'Free to start', value: 0, prefix: '$' },
    { label: 'Featured owner cash flow', value: 340000, prefix: '$' }
  ],
  principles: [
    {
      title: 'Real economics',
      body: 'Startup cost, recurring revenue, churn, payback, and owner effort are explained like an investment memo, not a hype thread.'
    },
    {
      title: 'Operator truth',
      body: 'Each issue is framed around what the owner actually does week to week, where the pain sits, and what breaks first.'
    },
    {
      title: 'Clear action',
      body: 'Every breakdown ends with who should buy, what to avoid, and the first practical move to make.'
    }
  ],
  about: {
    manifesto:
      'For too long the business internet has obsessed over venture rounds and software multiples while the quiet economy kept compounding in strip malls, industrial parks, and suburban lots.',
    body: [
      'BoringMoney is built for buyers, operators, and curious investors who want to understand the asset value hiding inside “unsexy” businesses.',
      'We care about margin durability, recurring spend, labor exposure, and exit optionality. We do not publish fantasy cases or founder propaganda.',
      'The goal is simple: help readers decide whether a business is worth owning, financing, or learning from.'
    ],
    score: [
      {
        title: 'Effort',
        body: 'How demanding is the business after stabilisation, and can the owner escape day-to-day firefighting?'
      },
      {
        title: 'Capital',
        body: 'What has to be funded upfront, how much of that capital is trapped, and how quickly can it recycle?'
      },
      {
        title: 'Defense',
        body: 'What protects margins against new entrants, macro slowdowns, or technology shifts?'
      }
    ]
  },
  community: {
    eyebrow: 'Operator network',
    headline: 'The network for serious buyers and operators.',
    body:
      'Paid members get operator AMAs, lightweight deal flow, templates used in the issues, and a room where practical buyers talk specifics.',
    price: '$99/yr',
    benefits: [
      'Private operator community with moderated deal and diligence threads',
      'Monthly AMA call with a category owner or deal operator',
      'Downloadable underwriting sheets and KPI trackers',
      'Priority access to new playbooks and live workshops'
    ]
  },
  issues: [
    {
      slug: 'car-washes',
      number: '01',
      status: 'published',
      tag: 'Subscription cash machine',
      title: 'Car washes',
      deck:
        'The physical-world subscription model hiding inside a seemingly dull, weatherproof category.',
      summary:
        'A well-run express wash can behave like recurring-revenue software with real assets underneath it. This issue maps out capex, site economics, churn, and the operator cadence.',
      heroQuote:
        'The best sites do not just sell washes. They sell habit, convenience, and a membership line item that renews quietly.',
      metrics: [
        { label: 'Monthly revenue', value: '$80k-$150k' },
        { label: 'Subscription mix', value: '60-70%' },
        { label: 'Variable cost / wash', value: '$1.50-$3.00' },
        { label: 'Net profit / month', value: '$30k-$80k' }
      ],
      takeaways: [
        'Recurring memberships smooth demand and make site-level forecasting much cleaner than the business looks from the road.',
        'Real estate quality and throughput drive outcomes more than soap chemistry or brand polish.',
        'Labor is manageable, but deferred maintenance compounds into ugly downtime quickly.'
      ],
      sections: [
        {
          heading: 'Why the model works',
          paragraphs: [
            'Express tunnel washes win by pushing customers from one-off transactions to monthly plans. Once the site earns habitual traffic, gross margin expands because the incremental cost of a member wash is low.',
            'That turns the business into a hybrid of operations discipline and membership retention instead of a pure weather gamble.'
          ]
        },
        {
          heading: 'What ownership really means',
          paragraphs: [
            'Owners spend time on equipment reliability, staffing quality, local marketing, and keeping membership churn low enough that acquisition cost stays rational.',
            'This is operationally simpler than restaurants, but it is not passive if the site mix, labor scheduling, or water systems are weak.'
          ]
        },
        {
          heading: 'The acquisition angle',
          paragraphs: [
            'Private equity likes the category because membership economics, multi-site synergies, and brand standardisation improve portfolio value fast.',
            'For an independent buyer, the best entries are often under-marketed sites in solid corridors where equipment is fixable and membership pricing is under-optimised.'
          ]
        }
      ]
    },
    {
      slug: 'vending-routes',
      number: '02',
      status: 'published',
      tag: 'Route density and maintenance',
      title: 'Vending routes',
      deck:
        'A route business with strong cash habits, high operational discipline, and a reputation problem caused by bad operators.',
      summary:
        'Vending looks passive from the outside. In practice it is a route-density business where location quality, spoilage, and maintenance discipline separate cash generation from constant chaos.',
      heroQuote:
        'A vending route behaves like a logistics business wearing the costume of passive income.',
      metrics: [
        { label: 'Typical route revenue', value: '$8k-$20k / month' },
        { label: 'Gross margin', value: '45-60%' },
        { label: 'Route density target', value: '15-20 stops / day' },
        { label: 'Service killer', value: 'Machine downtime' }
      ],
      takeaways: [
        'Route density matters more than raw machine count because travel destroys labor efficiency.',
        'Location contracts and machine uptime are the real moat, not the hardware itself.',
        'Inventory discipline is where mediocre operators quietly bleed margin.'
      ],
      sections: [
        {
          heading: 'The myth and the reality',
          paragraphs: [
            'The internet sells vending as mailbox money. The real job is contract management, replenishment planning, machine maintenance, and protecting routes from churn.',
            'When the route is tight and machines are reliable, cash generation is attractive. When it is loose and reactive, the owner has bought a stressful driving job.'
          ]
        },
        {
          heading: 'Where the money hides',
          paragraphs: [
            'Healthy routes concentrate stops, standardise product mix, and negotiate commissions intelligently. That turns every service run into a predictable unit of work instead of a guess.',
            'The most durable operators know exactly which SKUs move at each stop and cut dead inventory fast.'
          ]
        },
        {
          heading: 'Who should buy it',
          paragraphs: [
            'The category fits disciplined operators who like systems, route planning, and incremental acquisition. It is a poor fit for buyers chasing passive income with no appetite for field work.'
          ]
        }
      ]
    },
    {
      slug: 'self-storage',
      number: '03',
      status: 'published',
      tag: 'Real estate with software levers',
      title: 'Self-storage',
      deck:
        'One of the cleanest small-business bridges between real estate ownership and recurring operating income.',
      summary:
        'Self-storage sits at the intersection of real estate underwriting, local market selection, and yield management. The result can be durable cash flow with lighter labor than most service businesses.',
      heroQuote:
        'Storage wins when pricing discipline and occupancy management are treated like a system instead of a side effect.',
      metrics: [
        { label: 'Labor intensity', value: 'Low' },
        { label: 'Revenue driver', value: 'Occupancy x rate' },
        { label: 'Acquisition fit', value: 'Roll-up friendly' },
        { label: 'Operational lift', value: 'Access + software' }
      ],
      takeaways: [
        'Software, access control, and remote management improve economics quickly after acquisition.',
        'Bad underwriting usually comes from overestimating demand or underestimating local supply pressure.',
        'This is closer to an operating real-estate business than a fully passive investment.'
      ],
      sections: [
        {
          heading: 'Why buyers love it',
          paragraphs: [
            'Storage offers relatively light staffing, predictable monthly billing, and strong opportunities to modernise legacy assets with pricing software and remote access systems.',
            'That combination creates meaningful upside without adding restaurant-level complexity.'
          ]
        },
        {
          heading: 'The real work',
          paragraphs: [
            'Owners still need to understand market saturation, delinquency management, maintenance standards, and the subtle pricing game between occupancy and revenue per square foot.',
            'Facilities that look “easy” can become mediocre fast when demand is misread or marketing is weak.'
          ]
        },
        {
          heading: 'The investment case',
          paragraphs: [
            'For buyers who want cash-flowing assets with a real-estate floor, storage is one of the clearest categories to underwrite. The best entries tend to be overlooked local assets with obvious operational upgrades.'
          ]
        }
      ]
    },
    {
      slug: 'laundromats',
      number: '04',
      status: 'upcoming',
      tag: 'Coming next',
      title: 'Laundromats',
      deck:
        'Water, equipment, and neighborhood demand create one of the most persistent cash businesses in local commerce.',
      summary:
        'We are preparing a full breakdown on machine mix, utility economics, card systems, and the trade-off between unattended simplicity and service expansion.'
    }
  ],
  playbooks: [
    {
      slug: 'car-wash-buyers-guide',
      status: 'available',
      label: 'Guide 01',
      title: "The Car Wash Buyer's Guide",
      price: '$149',
      summary:
        'A practical operator handbook covering site diligence, capex traps, equipment lifespan, membership benchmarks, and a financing model buyers can actually use.'
    },
    {
      slug: 'build-a-vending-route',
      status: 'available',
      label: 'Guide 02',
      title: 'How to Build a Vending Route',
      price: '$79',
      summary:
        'Templates for route mapping, machine sourcing, commission negotiations, and SKU-level profitability tracking.'
    },
    {
      slug: 'storage-roll-up-system',
      status: 'upcoming',
      label: 'Guide 03',
      title: 'Storage Unit Roll-up System',
      price: 'Coming soon',
      summary:
        'A field manual for identifying fragmented storage markets, underwriting upgrades, and sequencing automation without losing occupancy.'
    }
  ],
  finalCta: {
    headline: 'Join the readers learning the quiet economy before they buy into it.',
    body:
      'One free email each week. Sharp teardown, clear economics, no noise.'
  }
};

function getPublishedIssues() {
  return site.issues.filter((issue) => issue.status === 'published');
}

function getUpcomingIssues() {
  return site.issues.filter((issue) => issue.status === 'upcoming');
}

function getLatestIssue() {
  return getPublishedIssues()[0];
}

function findIssueBySlug(slug) {
  return site.issues.find((issue) => issue.slug === slug);
}

module.exports = {
  site,
  findIssueBySlug,
  getLatestIssue,
  getPublishedIssues,
  getUpcomingIssues
};
