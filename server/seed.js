require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('./models/Product');

const U = (id, w = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=85&fit=crop`;

const PRODUCTS = [
  { brand: 'Nike',              name: 'Dunk Low Retro White Black',       price: 8995,  originalPrice: null,  category: 'Sneakers',     badge: 'NEW',     stock: 50, img: U('1542291026-7eec264c27ff') },
  { brand: 'Adidas Originals',  name: 'Trefoil Essentials Hoodie',        price: 4999,  originalPrice: null,  category: 'Streetwear',   badge: 'NEW',     stock: 80, img: U('1556821840-3a63f8550703') },
  { brand: 'New Balance',       name: '990v6 Made in USA',                price: 14995, originalPrice: null,  category: 'Sneakers',     badge: 'NEW',     stock: 30, img: U('1539185441755-769473a23570') },
  { brand: 'The North Face',    name: '1996 Retro Nuptse Jacket',         price: 15999, originalPrice: 19999, category: 'Fashion',      badge: 'SALE',    stock: 20, img: U('1564557287817-3785e38ec1f5') },
  { brand: 'Carhartt WIP',      name: 'Chase Short Sleeve T-Shirt',       price: 2799,  originalPrice: null,  category: 'Fashion',      badge: 'NEW',     stock: 100,img: U('1521572163474-6864f9cf17ab') },
  { brand: 'Vans',              name: 'Authentic Lo Pro Black Sole',      price: 3595,  originalPrice: null,  category: 'Sneakers',     badge: null,      stock: 60, img: U('1525966222134-fcfa99b8ae77') },
  { brand: 'Puma',              name: 'Speedcat OG Sneakers',             price: 5595,  originalPrice: 6995,  category: 'Sneakers',     badge: 'SALE',    stock: 45, img: U('1611042553365-9b101441c135') },
  { brand: 'Stüssy',            name: 'Basic Stock Logo Tee',             price: 3999,  originalPrice: null,  category: 'Streetwear',   badge: 'NEW',     stock: 70, img: U('1583743814966-8936f5b7be1a') },
  { brand: 'New Balance',       name: '574 Core Sneakers',                price: 10495, originalPrice: null,  category: 'Sneakers',     badge: null,      stock: 55, img: U('1607522370275-f14206abe5d3') },
  { brand: 'Champion',          name: 'Reverse Weave Crew Neck',          price: 2799,  originalPrice: 3499,  category: 'Streetwear',   badge: 'SALE',    stock: 90, img: U('1529720317453-c8da503f2051') },
  { brand: 'Nike',              name: 'Air Max 90 Essential',             price: 12495, originalPrice: null,  category: 'Sneakers',     badge: null,      stock: 35, img: U('1600185365483-26d7a4cc7519') },
  { brand: 'Dickies',           name: '874 Original Work Pant',           price: 4299,  originalPrice: null,  category: 'Denim',        badge: null,      stock: 65, img: U('1542219550-37153d387c27') },
  { brand: 'Converse',          name: 'Chuck 70 Hi Canvas Black',         price: 5395,  originalPrice: 6695,  category: 'Sneakers',     badge: 'SALE',    stock: 40, img: U('1460353581641-37baddab0fa2') },
  { brand: 'Herschel',          name: 'Little America Backpack 25L',      price: 5499,  originalPrice: null,  category: 'Accessories',  badge: null,      stock: 30, img: U('1553062407-98eeb64c6a62') },
  { brand: "Levi's",            name: "501 Original Fit Jeans",           price: 3599,  originalPrice: 4499,  category: 'Denim',        badge: 'SALE',    stock: 75, img: U('1542272454315-4c01d7abdf4a') },
  { brand: 'Vans',              name: 'Sk8-Hi Checkerboard Mid',          price: 5295,  originalPrice: null,  category: 'Sneakers',     badge: null,      stock: 50, img: U('1595950653106-6c9ebd614d3a') },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  MongoDB connected');

  let added = 0, skipped = 0;

  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ name: p.name });
    if (exists) { skipped++; continue; }
    await Product.create({ ...p, active: true });
    console.log(`  + ${p.name}`);
    added++;
  }

  console.log(`\nSeed complete — ${added} added, ${skipped} already existed.`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
