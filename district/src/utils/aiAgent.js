import { newArrivals, bestSellers } from '../data/products';

const ALL_PRODUCTS = [...newArrivals, ...bestSellers];

// Fetch merchant-added products from live DB and merge into ALL_PRODUCTS
export async function initLiveCatalog() {
  try {
    const res  = await fetch('/api/agent/catalog');
    const data = await res.json();
    if (!Array.isArray(data.catalog)) return;
    for (const p of data.catalog) {
      const exists = ALL_PRODUCTS.some(x => String(x.id) === String(p.id) || x.name === p.name);
      if (!exists) {
        ALL_PRODUCTS.push({
          id:    p.id,
          name:  p.name,
          brand: p.brand,
          price: p.price,
          orig:  p.originalPrice || null,
          badge: (p.badge || 'new').toLowerCase(),
          img:   p.img || '',
        });
      }
    }
  } catch {
    // catalog fetch failure is non-fatal
  }
}

/* ── Recipe knowledge base ────────────────────────────────────── */
const RECIPES = {
  'gajar ka halwa': {
    aliases: ['gazar ka halwa', 'gajar halwa', 'carrot halwa', 'carrot ka halwa', 'gajar ka halva', 'gajrela'],
    ingredients: [
      { id: 'r-carrot',  name: 'Fresh Carrots (Gajar)',      brand: 'Farm Fresh',  price: 35,  img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80' },
      { id: 'r-ghee',    name: 'Pure Desi Ghee',             brand: 'Patanjali',   price: 149, img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
      { id: 'r-milk',    name: 'Full Cream Milk',            brand: 'Amul',        price: 68,  img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
      { id: 'r-sugar',   name: 'Sugar (Chini)',              brand: 'Uttam',       price: 48,  img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
      { id: 'r-elaichi', name: 'Green Cardamom (Elaichi)',   brand: 'Everest',     price: 39,  img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80' },
      { id: 'r-khoya',   name: 'Khoya / Mawa',              brand: 'Fresh Daily',  price: 89,  img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&q=80' },
    ],
  },
  'dal makhani': {
    aliases: ['dal makhni', 'makhani dal', 'black dal'],
    ingredients: [
      { id: 'r-urad',   name: 'Whole Urad Dal (Black)',    brand: 'Tata Sampann', price: 89,  img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80' },
      { id: 'r-rajma',  name: 'Rajma (Kidney Beans)',      brand: 'Tata Sampann', price: 75,  img: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80' },
      { id: 'r-butter', name: 'Amul Butter',               brand: 'Amul',         price: 55,  img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
      { id: 'r-cream',  name: 'Fresh Cream',               brand: 'Amul',         price: 45,  img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
      { id: 'r-tomato', name: 'Tomatoes',                  brand: 'Farm Fresh',   price: 30,  img: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80' },
      { id: 'r-onion',  name: 'Red Onions',                brand: 'Farm Fresh',   price: 40,  img: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80' },
    ],
  },
  'paneer butter masala': {
    aliases: ['paneer makhani', 'butter paneer', 'paneer masala'],
    ingredients: [
      { id: 'r-paneer',  name: 'Paneer',                   brand: 'Amul',         price: 85,  img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&q=80' },
      { id: 'r-butter2', name: 'Amul Butter',              brand: 'Amul',         price: 55,  img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80' },
      { id: 'r-tomato2', name: 'Tomatoes',                 brand: 'Farm Fresh',   price: 30,  img: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80' },
      { id: 'r-cream2',  name: 'Fresh Cream',              brand: 'Amul',         price: 45,  img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
      { id: 'r-onion2',  name: 'Red Onions',               brand: 'Farm Fresh',   price: 40,  img: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80' },
    ],
  },
};

function findRecipe(text) {
  const t = text.toLowerCase();
  for (const [key, recipe] of Object.entries(RECIPES)) {
    if (t.includes(key)) return { key, recipe };
    for (const alias of recipe.aliases) {
      if (t.includes(alias)) return { key, recipe };
    }
  }
  return null;
}

const FOOD_INTENT_RX = [
  /i (?:like|want|love|feel like|am craving) to (?:eat|make|cook|have|prepare) (.+)/i,
  /(?:today|tonight|now) (?:i (?:like|want|feel like)(?: to)? (?:eat|make|have)?|(?:let's|lets) (?:make|cook|have)) (.+)/i,
  /(?:make|cook|prepare|let's have) (?:some |a |the )?(.+)/i,
  /(?:craving|want) (?:some |a |the )?(.+)/i,
  /(?:i'll|i will) (?:eat|have|make) (?:some |a |the )?(.+)/i,
];

/* ── Intent patterns ──────────────────────────────────────────── */
const PATTERNS = [
  { intent: 'RECIPE',    rx: FOOD_INTENT_RX },
  { intent: 'ADD',       rx: [/add (.+?) (?:to|in(?:to)?|on(?:to)?) (?:my )?cart/i, /(?:i want|buy me|get me|order) (.+)/i, /put (.+?) (?:in(?:to)?|on(?:to)?) (?:my )?cart/i, /cart me (.+)/i] },
  { intent: 'ADD_ALL',     rx: [/(?:add|put) (?:them|those|both|all)(?: (?:to|in(?:to)?|on(?:to)?))? (?:my )?cart/i, /(?:add|put) (?:them|those|it|both|all) (?:to|in(?:to)?|on(?:to)?) (?:my )?cart/i, /(?:yes[,.]?|yep[,.]?|sure[,.]?)?\s*(?:add|put) (?:them|those|both|all)/i] },
  { intent: 'ADD_ORDINAL', rx: [/add (?:the )?(first|second|third|1st|2nd|3rd|that|this|it|one)\b/i, /^(?:the )?(first|second|third|1st|2nd|3rd)\s*(?:one)?$/i, /(?:add|get|buy) (?:that|this) one/i] },
  { intent: 'REMOVE',    rx: [/remove (.+?) from (?:my )?cart/i, /delete (.+?) from (?:my )?cart/i, /take out (.+)/i, /don't want (.+)/i] },
  { intent: 'CLEAR',     rx: [/clear (?:my )?cart/i, /empty (?:my )?cart/i, /remove everything/i, /wipe (?:my )?cart/i] },
  { intent: 'SHOW_CART', rx: [/(?:show|open|view) (?:my )?cart/i, /what(?:'s| is) in (?:my )?cart/i, /^(?:my cart|show cart|open cart)$/i] },
  { intent: 'ORDER',     rx: [/place (?:my )?order/i, /checkout/i, /buy now/i, /confirm (?:my )?order/i, /proceed to (?:buy|checkout)/i, /order now/i, /make (?:the )?payment/i, /pay now/i, /complete (?:the )?payment/i, /do (?:the )?payment/i, /complete (?:the )?order/i] },
  { intent: 'ORDERS',    rx: [/(?:my )?(?:past )?orders?/i, /order history/i, /purchase history/i, /what did i (?:buy|order)/i] },
  { intent: 'SEARCH',    rx: [/show me (.+)/i, /find (.+)/i, /search (?:for )?(.+)/i, /browse (.+)/i, /any (.+?) (?:available|in stock)/i, /what (.+?) do you have/i, /got any (.+)/i, /looking for (.+)/i] },
  { intent: 'GREET',     rx: [/^(?:hi+|hello|hey|hola|sup|yo)\b/i, /^good (?:morning|afternoon|evening)/i] },
  { intent: 'HELP',      rx: [/\bhelp\b/i, /what can you do/i, /how do i/i, /commands/i] },
];

/* ── Product matching ─────────────────────────────────────────── */
function scoreProduct(product, query) {
  const q     = query.toLowerCase();
  const name  = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const words = q.split(/\s+/).filter(w => w.length > 2);
  let score   = 0;
  if (name.includes(q) || brand.includes(q)) score += 10;
  words.forEach(w => {
    if (name.includes(w))  score += 3;
    if (brand.includes(w)) score += 2;
  });
  return score;
}

function findProduct(query) {
  if (!query) return null;
  let best = null, bestScore = 0;
  for (const p of ALL_PRODUCTS) {
    const s = scoreProduct(p, query);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  return bestScore > 0 ? best : null;
}

function filterProducts(query) {
  const q = (query || '').toLowerCase();
  const budget = (q.match(/under\s*₹?\s*(\d+)/i) || q.match(/below\s*₹?\s*(\d+)/i) || q.match(/less than\s*₹?\s*(\d+)/i))?.[1];

  let results = ALL_PRODUCTS.filter(p => {
    const text = `${p.name} ${p.brand}`.toLowerCase();
    if (q.includes('sale') || q.includes('offer') || q.includes('discount')) return p.badge === 'sale';
    if (q.includes('new'))  return p.badge === 'new';
    if (q.includes('shoe') || q.includes('sneaker') || q.includes('footwear'))
      return /dunk|air max|574|sk8|chuck|speedcat|authentic|samba/i.test(p.name);
    if (q.includes('jacket') || q.includes('puffer') || q.includes('coat')) return /jacket/i.test(p.name);
    if (q.includes('hoodie') || q.includes('sweat')) return /hoodie|sweat/i.test(p.name);
    if (q.includes('tee') || q.includes('t-shirt') || q.includes('shirt'))   return /tee|shirt/i.test(p.name);
    if (q.includes('jeans') || q.includes('pant') || q.includes('denim'))    return /jean|pant/i.test(p.name);
    if (q.includes('backpack') || q.includes('bag'))  return /backpack|bag/i.test(p.name);
    const scored = scoreProduct(p, q);
    return scored > 0 || text.split(' ').some(w => w.length > 3 && q.includes(w));
  });

  if (budget) results = results.filter(p => p.price <= parseInt(budget));
  return results.length ? results.slice(0, 4) : ALL_PRODUCTS.slice(0, 4);
}

export function getCatalogSnapshot() {
  return ALL_PRODUCTS.slice(0, 30).map(p => ({ name: p.name, brand: p.brand, price: p.price, id: p.id }));
}

/* ── Main exports ─────────────────────────────────────────────── */
export function parseMessage(text) {
  const t = text.trim();

  // Full-text recipe check first (catches "today I like to eat gajar ka halwa")
  const recipeMatch = findRecipe(t);
  if (recipeMatch) return { intent: 'RECIPE', query: t, raw: t, recipe: recipeMatch };

  for (const { intent, rx } of PATTERNS) {
    for (const r of rx) {
      const m = t.match(r);
      if (m) {
        // For RECIPE intent via pattern, also do a recipe lookup on the captured group
        if (intent === 'RECIPE') {
          const sub = m[1]?.trim() || t;
          const rm  = findRecipe(sub) || findRecipe(t);
          if (rm) return { intent: 'RECIPE', query: sub, raw: t, recipe: rm };
        }
        return { intent, query: m[1]?.trim() || '', raw: t };
      }
    }
  }
  // fallback: if the message looks like a product search, treat it as one
  const looksLikeSearch = ALL_PRODUCTS.some(p => scoreProduct(p, t) > 2);
  return { intent: looksLikeSearch ? 'SEARCH' : 'GENERAL', query: t, raw: t };
}

export function resolveAction(intent, query, cartItems = [], extra = {}) {
  switch (intent) {

    case 'RECIPE': {
      const { recipe } = extra;
      if (!recipe) return { type: null, reply: "I couldn't figure out what dish you'd like. Try: *I want to eat gajar ka halwa*" };
      const { key, recipe: r } = recipe;
      const displayName = key.replace(/\b\w/g, c => c.toUpperCase());
      const ingredientList = r.ingredients.map(i => `• ${i.name} — ₹${i.price}`).join('\n');
      return {
        type:        'ADD_RECIPE',
        ingredients: r.ingredients,
        reply:       `Great choice! 🍽️ I'm adding all the ingredients for **${displayName}** to your cart:\n\n${ingredientList}\n\nAnything else you'd like to add? 😊`,
      };
    }

    case 'ADD_ALL': {
      const { lastProducts } = extra;
      if (lastProducts?.length) {
        const names = lastProducts.map(p => `**${p.name}**`).join(' and ');
        return {
          type:     'ADD_ALL_TO_CART',
          products: lastProducts,
          reply:    `Done! Added ${names} to your cart 🛒`,
        };
      }
      return { type: null, reply: "I'm not sure which items you mean — tap **+ Add** on the cards above, or say *add [product name] to cart*." };
    }

    case 'ADD_ORDINAL': {
      const { lastProducts } = extra;
      if (!lastProducts?.length) {
        return { type: null, reply: "I'm not sure which item you mean — tap **+ Add** on the cards above, or say *add [product name] to cart*." };
      }
      const raw = query.toLowerCase();
      const idx = /second|2nd/.test(raw) ? 1 : /third|3rd/.test(raw) ? 2 : 0;
      const product = lastProducts[idx] || lastProducts[0];
      return {
        type:    'ADD_TO_CART',
        product,
        reply:   `Done! **${product.name}** by ${product.brand} added to your cart 🛒\n₹${product.price.toLocaleString('en-IN')}`,
        product_card: product,
      };
    }

    case 'ADD': {
      const product = findProduct(query);
      if (product) return {
        type: 'ADD_TO_CART',
        product,
        reply: `Done! **${product.name}** by ${product.brand} added to your cart 🛒\n₹${product.price.toLocaleString('en-IN')}`,
        product_card: product,
      };
      const results = filterProducts(query);
      return {
        type: 'SHOW_PRODUCTS',
        products: results,
        reply: `I couldn't find an exact match for **"${query}"**. Here are the closest picks — tap **Add** on any:`,
      };
    }

    case 'REMOVE': {
      const item = cartItems.find(i =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.brand.toLowerCase().includes(query.toLowerCase())
      );
      return item
        ? { type: 'REMOVE_FROM_CART', id: item.id, reply: `Removed **${item.name}** from your cart ✓` }
        : { type: null, reply: `I don't see **"${query}"** in your cart. Type "show my cart" to check what's there.` };
    }

    case 'CLEAR':
      return cartItems.length
        ? { type: 'CLEAR_CART', reply: `Cleared! ${cartItems.length} item${cartItems.length > 1 ? 's' : ''} removed from your cart.` }
        : { type: null, reply: 'Your cart is already empty!' };

    case 'SHOW_CART':
      return cartItems.length
        ? { type: 'OPEN_CART', reply: `You have **${cartItems.length} item${cartItems.length > 1 ? 's' : ''}** in your cart (₹${cartItems.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString('en-IN')}). Opening now!` }
        : { type: null, reply: "Your cart is empty 😔 Want me to suggest something? Try: *show me sneakers*" };

    case 'ORDER':
      return cartItems.length
        ? { type: 'PLACE_ORDER', reply: `Placing your order now! 🎉 ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}, total ₹${cartItems.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString('en-IN')}` }
        : { type: null, reply: "Your cart is empty! Add some products first, then say *place my order*." };

    case 'ORDERS':
      return { type: 'SHOW_ORDERS', reply: "Opening your order history. You can also request returns from there!" };

    case 'GREET':
      return { type: null, reply: "Hey! 👋 I'm your District AI assistant. I can add products to your cart, place orders, find deals, and more.\n\nTry: *add Nike Dunks to cart* or *show me hoodies*" };

    case 'HELP':
      return { type: null, reply: `Here's what I can do:\n\n🛒 **"Add Nike Dunks to cart"**\n🔍 **"Show me sneakers under ₹5000"**\n💳 **"Place my order"**\n🗑️ **"Clear my cart"**\n📦 **"My orders"**\n❓ **"What hoodies do you have?"**` };

    case 'SEARCH': {
      const results = filterProducts(query);
      return {
        type: 'SHOW_PRODUCTS',
        products: results,
        reply: results.length
          ? `Found **${results.length} items** for "${query}" — tap **Add** to add any to your cart:`
          : `Nothing found for "${query}". Try a brand name like *Nike* or a category like *sneakers*.`,
      };
    }

    default:
      return { type: null, reply: "I'm not sure I got that. Try:\n• *Add [product] to cart*\n• *Show me sneakers*\n• *What's in my cart?*\n• *Place my order*" };
  }
}
