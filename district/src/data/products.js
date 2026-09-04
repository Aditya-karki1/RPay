const U = (id, w = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=85&fit=crop`;

export const newArrivals = [
  {
    id: 1, brand: 'Nike', name: 'Dunk Low Retro White Black',
    price: 8995, orig: null, badge: 'new',
    img: U('1542291026-7eec264c27ff', 600),
    wm: 'NIKE',
  },
  {
    id: 2, brand: 'Adidas Originals', name: 'Trefoil Essentials Hoodie',
    price: 4999, orig: null, badge: 'new',
    img: U('1558618666-fcd25c85cd64', 600),
    wm: 'ADIDAS',
  },
  {
    id: 3, brand: 'New Balance', name: '990v6 Made in USA',
    price: 14995, orig: null, badge: 'new',
    img: U('1539185441755-769473a23570', 600),
    wm: 'NB',
  },
  {
    id: 4, brand: 'The North Face', name: '1996 Retro Nuptse Jacket',
    price: 15999, orig: 19999, badge: 'sale',
    img: U('1564557287817-3785e38ec1f5', 600),
    wm: 'TNF',
  },
  {
    id: 5, brand: 'Carhartt WIP', name: 'Chase Short Sleeve T-Shirt',
    price: 2799, orig: null, badge: 'new',
    img: U('1521572163474-6864f9cf17ab', 600),
    wm: 'CARHARTT',
  },
  {
    id: 6, brand: 'Vans', name: 'Authentic Lo Pro Black Sole',
    price: 3595, orig: null, badge: null,
    img: U('1525966222134-fcfa99b8ae77', 600),
    wm: 'VANS',
  },
  {
    id: 7, brand: 'Puma', name: 'Speedcat OG Sneakers',
    price: 5595, orig: 6995, badge: 'sale',
    img: U('1611042553365-9b101441c135', 600),
    wm: 'PUMA',
  },
  {
    id: 8, brand: 'Stüssy', name: 'Basic Stock Logo Tee',
    price: 3999, orig: null, badge: 'new',
    img: U('1583743814966-8936f5b7be1a', 600),
    wm: 'STUSSY',
  },
];

export const bestSellers = [
  {
    id: 9, brand: 'New Balance', name: '574 Core Sneakers',
    price: 10495, orig: null, badge: null,
    img: U('1607522370275-f14206abe5d3', 600),
    wm: 'NB',
  },
  {
    id: 10, brand: 'Champion', name: 'Reverse Weave Crew Neck',
    price: 2799, orig: 3499, badge: 'sale',
    img: U('1529720317453-c8da503f2051', 600),
    wm: 'CHAMPION',
  },
  {
    id: 11, brand: 'Nike', name: 'Air Max 90 Essential',
    price: 12495, orig: null, badge: null,
    img: U('1600185365483-26d7a4cc7519', 600),
    wm: 'NIKE',
  },
  {
    id: 12, brand: 'Dickies', name: '874 Original Work Pant',
    price: 4299, orig: null, badge: null,
    img: U('1542219550-37153d387c27', 600),
    wm: 'DICKIES',
  },
  {
    id: 13, brand: 'Converse', name: 'Chuck 70 Hi Canvas Black',
    price: 5395, orig: 6695, badge: 'sale',
    img: U('1460353581641-37baddab0fa2', 600),
    wm: 'CONVERSE',
  },
  {
    id: 14, brand: 'Herschel', name: 'Little America Backpack 25L',
    price: 5499, orig: null, badge: null,
    img: U('1553062407-98eeb64c6a62', 600),
    wm: 'HERSCHEL',
  },
  {
    id: 15, brand: "Levi's", name: '501 Original Fit Jeans',
    price: 3599, orig: 4499, badge: 'sale',
    img: U('1542272454315-4c01d7abdf4a', 600),
    wm: "LEVI'S",
  },
  {
    id: 16, brand: 'Vans', name: 'Sk8-Hi Checkerboard Mid',
    price: 5295, orig: null, badge: null,
    img: U('1595950653106-6c9ebd614d3a', 600),
    wm: 'VANS',
  },
];

export const categories = [
  { id: 'men',    label: 'Men',         count: '2,400+', img: U('1617137968427-85924c800a22', 400), cls: 'cat-men'    },
  { id: 'women',  label: 'Women',       count: '1,800+', img: U('1490481651871-ab68de25d43d', 400), cls: 'cat-women'  },
  { id: 'kids',   label: 'Kids',        count: '640+',   img: U('1516762689617-e1cffcef479d', 400), cls: 'cat-kids'   },
  { id: 'shoes',  label: 'Footwear',    count: '3,100+', img: U('1491553895911-0055eca6402d', 400), cls: 'cat-shoes'  },
  { id: 'acc',    label: 'Accessories', count: '980+',   img: U('1584917865442-de89df76afd3', 400), cls: 'cat-acc'    },
  { id: 'brands', label: 'Brands',      count: '300+',   img: U('1607082348824-0a96f2a4b9da', 400), cls: 'cat-brands' },
];

export const heroSlides = [
  {
    id: 1, cls: 'hero-slide-1',
    img: U('1515886657613-9f3515b0c78f', 1600),
    eyebrow: 'Summer 2025 Collection',
    line1: 'Summer', line2: "Drop '25",
    sub: '200+ new styles from the brands that define the streets.',
    cta1: { label: 'Shop Now',      href: '#arrivals' },
    cta2: { label: 'View Lookbook', href: '#' },
    bgWord: 'DROP',
  },
  {
    id: 2, cls: 'hero-slide-2',
    img: U('1469334031218-e382a71b716b', 1600),
    eyebrow: 'Limited Time Offer',
    line1: 'Sale', line2: 'On Now',
    sub: 'Up to 50% off on top streetwear brands. While stocks last.',
    cta1: { label: 'Shop Sale',      href: '#sale' },
    cta2: { label: 'All Categories', href: '#' },
    bgWord: 'SALE',
  },
  {
    id: 3, cls: 'hero-slide-3',
    img: U('1506629082955-511b1aa562c8', 1600),
    eyebrow: 'Premium Streetwear',
    line1: 'Your', line2: 'Drip',
    sub: '300+ global brands. One destination. Express yourself.',
    cta1: { label: 'Explore Brands', href: '#' },
    cta2: { label: 'New Season',     href: '#' },
    bgWord: 'DRIP',
  },
];

export const brands = [
  'Nike', 'Adidas', 'New Balance', 'Puma', 'Vans', 'Converse',
  'The North Face', 'Carhartt WIP', 'Champion', 'Dickies',
  "Levi's", 'Stüssy', 'Herschel', 'Timberland', 'Reebok',
  'FILA', 'Tommy Hilfiger', 'Calvin Klein', 'Jack & Jones', 'Only',
];

export const footerLinks = {
  Shop:    ['New Arrivals', 'Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Sale'],
  Brands:  ['Nike', 'Adidas', 'New Balance', 'Puma', 'Vans', 'Converse', 'The North Face'],
  Help:    ['Track Order', 'Returns & Refunds', 'Shipping Info', 'Size Guide', 'FAQs', 'Contact Us'],
  Company: ['About Us', 'Careers', 'Press', 'Sell on District', 'Privacy Policy', 'Terms of Service'],
};
