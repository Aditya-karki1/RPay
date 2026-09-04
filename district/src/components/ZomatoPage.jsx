import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ZomatoPage({ onClose, onAIQuery }) {
  const { addToCart } = useApp();
  const [activeTab,   setActiveTab]   = useState('Food Delivery');
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onAIQuery?.(searchValue.trim());
      setSearchValue('');
    }
  };

  const categories = [
    { label: 'Food Delivery', icon: '🍽️' },
    { label: 'Grocery',       icon: '🛒' },
    { label: 'Instant',       icon: '⚡' },
    { label: 'Dining Out',    icon: '🍷' },
  ];

  const groceryItems = [
    { name: 'Fresh Carrots',      qty: '500g',    price: '₹35',  originalPrice: '₹45',  img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80', tag: 'Fresh' },
    { name: 'Sunflower Oil',      qty: '1 litre', price: '₹139', originalPrice: '₹160', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', tag: 'Sale' },
    { name: 'Red Onions',         qty: '1 kg',    price: '₹40',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400&q=80', tag: null },
    { name: 'Tomatoes',           qty: '500g',    price: '₹30',  originalPrice: '₹38',  img: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&q=80', tag: 'Fresh' },
    { name: 'Aashirvaad Atta',    qty: '5 kg',    price: '₹259', originalPrice: '₹299', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80', tag: 'Sale' },
    { name: 'Farm Eggs',          qty: '12 pcs',  price: '₹89',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80', tag: null },
    { name: 'Full Cream Milk',    qty: '1 litre', price: '₹68',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', tag: null },
    { name: 'Basmati Rice',       qty: '1 kg',    price: '₹120', originalPrice: '₹140', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', tag: 'Sale' },
    { name: 'Amul Butter',        qty: '500g',    price: '₹245', originalPrice: null,   img: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80', tag: null },
    { name: 'Toor Dal',           qty: '1 kg',    price: '₹149', originalPrice: '₹170', img: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80', tag: null },
    { name: 'Potatoes',           qty: '1 kg',    price: '₹32',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=400&q=80', tag: 'Fresh' },
    { name: 'Garlic',             qty: '250g',    price: '₹45',  originalPrice: '₹55',  img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80', tag: null },
    { name: 'Coconut Oil',        qty: '500ml',   price: '₹189', originalPrice: '₹220', img: 'https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=400&q=80', tag: 'Sale' },
    { name: 'Fresh Spinach',      qty: '250g',    price: '₹28',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80', tag: 'Fresh' },
    { name: 'Paneer',             qty: '200g',    price: '₹85',  originalPrice: '₹95',  img: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&q=80', tag: null },
    { name: 'Green Chillies',     qty: '100g',    price: '₹18',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', tag: 'Fresh' },
    { name: 'Cucumber',           qty: '2 pcs',   price: '₹22',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=400&q=80', tag: null },
    { name: 'Lemon',              qty: '4 pcs',   price: '₹20',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1571680322279-a226e6a4cc2a?w=400&q=80', tag: 'Fresh' },
    { name: 'Turmeric Powder',    qty: '200g',    price: '₹58',  originalPrice: '₹70',  img: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&q=80', tag: 'Sale' },
    { name: 'Chicken Breast',     qty: '500g',    price: '₹199', originalPrice: '₹240', img: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80', tag: 'Sale' },
    { name: 'Mixed Vegetables',   qty: '500g',    price: '₹65',  originalPrice: null,   img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', tag: 'Fresh' },
    { name: 'Apples',             qty: '4 pcs',   price: '₹120', originalPrice: '₹140', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&q=80', tag: null },
  ];

  const foods = [
    { name: 'Butter Chicken', cuisine: 'North Indian', time: '30 min', rating: 4.5, price: '₹299', img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80' },
    { name: 'Margherita Pizza', cuisine: 'Italian', time: '25 min', rating: 4.7, price: '₹349', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80' },
    { name: 'Chicken Biryani', cuisine: 'Hyderabadi', time: '40 min', rating: 4.8, price: '₹249', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
    { name: 'Sushi Platter', cuisine: 'Japanese', time: '35 min', rating: 4.6, price: '₹599', img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80' },
    { name: 'Classic Burger', cuisine: 'American', time: '20 min', rating: 4.4, price: '₹199', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80' },
    { name: 'Pasta Arrabbiata', cuisine: 'Italian', time: '30 min', rating: 4.3, price: '₹279', img: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&q=80' },
  ];

  const instantPlaces = [
    {
      name: "Haldiram's",
      type: 'Snacks • Indian',
      distance: '0.3 km',
      time: '8 min',
      rating: 4.3,
      dishes: [
        { name: 'Aloo Tikki',   price: '₹60',  img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
        { name: 'Samosa',       price: '₹30',  img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
        { name: 'Pav Bhaji',    price: '₹110', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&q=80' },
      ],
    },
    {
      name: "McDonald's",
      type: 'Burgers • Fast Food',
      distance: '0.7 km',
      time: '12 min',
      rating: 4.1,
      dishes: [
        { name: 'McAloo Tikki', price: '₹99',  img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' },
        { name: 'McChicken',    price: '₹149', img: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=300&q=80' },
        { name: 'French Fries', price: '₹79',  img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&q=80' },
      ],
    },
    {
      name: "Domino's Pizza",
      type: 'Pizza • Italian',
      distance: '1.2 km',
      time: '20 min',
      rating: 4.4,
      dishes: [
        { name: 'Margherita',   price: '₹199', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=80' },
        { name: 'Peppy Paneer', price: '₹249', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' },
        { name: 'Garlic Bread', price: '₹99',  img: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&q=80' },
      ],
    },
    {
      name: 'Subway',
      type: 'Sandwiches • Healthy',
      distance: '0.5 km',
      time: '10 min',
      rating: 4.2,
      dishes: [
        { name: 'Veggie Sub',     price: '₹229', img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300&q=80' },
        { name: 'Chicken Teriyaki', price: '₹319', img: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=300&q=80' },
        { name: 'Cookie',         price: '₹59',  img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=80' },
      ],
    },
    {
      name: 'Barbeque Nation',
      type: 'BBQ • Grill',
      distance: '1.8 km',
      time: '25 min',
      rating: 4.6,
      dishes: [
        { name: 'Seekh Kebab',  price: '₹349', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&q=80' },
        { name: 'Paneer Tikka', price: '₹299', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&q=80' },
        { name: 'Veg Platter',  price: '₹449', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80' },
      ],
    },
    {
      name: 'KFC',
      type: 'Fried Chicken • Fast Food',
      distance: '0.9 km',
      time: '15 min',
      rating: 4.2,
      dishes: [
        { name: 'Crispy Chicken', price: '₹199', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&q=80' },
        { name: 'Zinger Burger',  price: '₹179', img: 'https://images.unsplash.com/photo-1621852004158-f3bc188ace2d?w=300&q=80' },
        { name: 'Coleslaw',       price: '₹59',  img: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=300&q=80' },
      ],
    },
    {
      name: 'Pizza Hut',
      type: 'Pizza • Italian',
      distance: '1.4 km',
      time: '22 min',
      rating: 4.3,
      dishes: [
        { name: 'Farm House',   price: '₹349', img: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=300&q=80' },
        { name: 'Pasta Arrabiata', price: '₹249', img: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300&q=80' },
        { name: 'Choco Lava',   price: '₹149', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80' },
      ],
    },
    {
      name: 'Burger King',
      type: 'Burgers • Fast Food',
      distance: '0.6 km',
      time: '11 min',
      rating: 4.0,
      dishes: [
        { name: 'Whopper',      price: '₹219', img: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=300&q=80' },
        { name: 'Onion Rings',  price: '₹89',  img: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=300&q=80' },
        { name: 'Sundae',       price: '₹79',  img: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=300&q=80' },
      ],
    },
    {
      name: 'Wow! Momo',
      type: 'Momos • Chinese',
      distance: '0.4 km',
      time: '9 min',
      rating: 4.4,
      dishes: [
        { name: 'Steamed Momos',  price: '₹129', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80' },
        { name: 'Fried Momos',    price: '₹149', img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&q=80' },
        { name: 'Momo Soup',      price: '₹99',  img: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=300&q=80' },
      ],
    },
    {
      name: 'Chaayos',
      type: 'Chai • Snacks',
      distance: '0.2 km',
      time: '7 min',
      rating: 4.5,
      dishes: [
        { name: 'Masala Chai',    price: '₹79',  img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=300&q=80' },
        { name: 'Grilled Sandwich', price: '₹149', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80' },
        { name: 'Maggi',          price: '₹99',  img: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&q=80' },
      ],
    },
  ];

  const restaurants = [
    { name: 'Spice Garden', type: 'Multi-cuisine • Fine Dining', rating: 4.6, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80' },
    { name: 'The Burger Lab', type: 'American • Casual', rating: 4.4, img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80' },
    { name: 'Sakura Sushi Bar', type: 'Japanese • Sushi', rating: 4.7, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  ];

  return (
    <div className="zomato-page">
      <div className="zomato-header">
        <button className="zomato-back" onClick={onClose} aria-label="Go back">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="zomato-brand">
          <span className="zomato-logo">zomato</span>
          <span className="zomato-tagline">Food, Grocery &amp; Instant</span>
        </div>
      </div>

      <div className="zomato-hero">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=85"
          alt="Delicious food spread"
          className="zomato-hero-img"
        />
        <div className="zomato-hero-overlay">
          <h1 className="zomato-hero-title">Order food you love</h1>
          <p className="zomato-hero-sub">Discover restaurants, grocery stores &amp; more near you</p>
          <div className="zomato-search-wrap">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="zomato-search"
              type="text"
              placeholder="Search or tell me what you feel like eating…"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKey}
            />
          </div>
        </div>
      </div>

      <div className="zomato-body">
        <div className="zomato-cats">
          {categories.map(c => (
            <button
              key={c.label}
              className={`zomato-cat${activeTab === c.label ? ' active' : ''}`}
              onClick={() => setActiveTab(c.label)}
            >
              <span className="zomato-cat-icon">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'Grocery' && (
          <section className="zomato-section">
            <h2 className="zomato-section-title">🛒 Fresh Grocery</h2>
            <p className="zomato-section-sub">Delivered in 10–20 mins</p>
            <div className="zomato-grocery-grid">
              {groceryItems.map(g => (
                <div key={g.name} className="zomato-grocery-card">
                  <div className="zomato-grocery-img-wrap">
                    <img src={g.img} alt={g.name} className="zomato-grocery-img" loading="lazy" />
                    {g.tag && (
                      <span className={`zomato-grocery-tag${g.tag === 'Sale' ? ' sale' : ''}`}>{g.tag}</span>
                    )}
                  </div>
                  <div className="zomato-grocery-info">
                    <div className="zomato-grocery-name">{g.name}</div>
                    <div className="zomato-grocery-qty">{g.qty}</div>
                    <div className="zomato-grocery-price-row">
                      <span className="zomato-grocery-price">{g.price}</span>
                      {g.originalPrice && <span className="zomato-grocery-original">{g.originalPrice}</span>}
                    </div>
                    <button className="zomato-grocery-add" onClick={() => addToCart({
                      id:    `grocery-${g.name}`,
                      name:  g.name,
                      brand: `${g.qty}`,
                      price: parseInt(g.price.replace('₹', '')),
                      img:   g.img,
                      qty:   1,
                    })}>+ Add</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Instant' && (
          <section className="zomato-section">
            <h2 className="zomato-section-title">⚡ Instant Delivery Near You</h2>
            <p className="zomato-section-sub">Live map · Updated every 2 min</p>

            {/* Map */}
            <div className="instant-map-wrap">
              <iframe
                title="Nearby Restaurants Map"
                className="instant-map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=77.1966%2C28.6208%2C77.2366%2C28.6508&layer=mapnik&marker=28.6358%2C77.2166"
                allowFullScreen=""
                loading="lazy"
              />
              <div className="instant-map-legend">
                <span className="map-legend-dot red" /> Restaurants
                <span className="map-legend-dot green" style={{marginLeft:16}} /> Your Location
              </div>
            </div>

            {/* Restaurant + Dish list */}
            <h3 className="instant-list-title">Available Now</h3>
            <div className="instant-list">
              {instantPlaces.map(place => (
                <div key={place.name} className="instant-place-card">
                  <div className="instant-place-header">
                    <div>
                      <div className="instant-place-name">{place.name}</div>
                      <div className="instant-place-type">{place.type}</div>
                    </div>
                    <div className="instant-place-meta">
                      <span className="instant-badge dist">📍 {place.distance}</span>
                      <span className="instant-badge time">⏱ {place.time}</span>
                      <span className="instant-badge rating">★ {place.rating}</span>
                    </div>
                  </div>
                  <div className="instant-dishes">
                    {place.dishes.map(d => (
                      <div key={d.name} className="instant-dish-row">
                        <img src={d.img} alt={d.name} className="instant-dish-img" loading="lazy" />
                        <div className="instant-dish-info">
                          <span className="instant-dish-name">{d.name}</span>
                          <span className="instant-dish-price">{d.price}</span>
                        </div>
                        <button className="instant-order-btn" onClick={() => addToCart({
                          id:    `instant-${place.name}-${d.name}`,
                          name:  d.name,
                          brand: place.name,
                          price: parseInt(d.price.replace('₹', '')),
                          img:   d.img,
                          qty:   1,
                        })}>+ Add</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab !== 'Grocery' && activeTab !== 'Instant' && (
          <>
            <section className="zomato-section">
              <h2 className="zomato-section-title">Popular Dishes</h2>
              <div className="zomato-food-grid">
                {foods.map(f => (
                  <div key={f.name} className="zomato-food-card" style={{ cursor: 'pointer' }}
                    onClick={() => addToCart({
                      id:    `food-${f.name}`,
                      name:  f.name,
                      brand: f.cuisine,
                      price: parseInt(f.price.replace('₹', '')),
                      img:   f.img,
                      qty:   1,
                    })}>
                    <div className="zomato-food-img-wrap">
                      <img src={f.img} alt={f.name} className="zomato-food-img" loading="lazy" />
                      <span className="zomato-food-time">{f.time}</span>
                    </div>
                    <div className="zomato-food-info">
                      <div className="zomato-food-name">{f.name}</div>
                      <div className="zomato-food-cuisine">{f.cuisine}</div>
                      <div className="zomato-food-meta">
                        <span className="zomato-rating">★ {f.rating}</span>
                        <span className="zomato-food-price">{f.price}</span>
                      </div>
                      <button className="zomato-grocery-add" style={{ marginTop: 8, width: '100%' }}>+ Add to Cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="zomato-section">
              <h2 className="zomato-section-title">Top Restaurants Near You</h2>
              <div className="zomato-resto-grid">
                {restaurants.map(r => (
                  <div key={r.name} className="zomato-resto-card">
                    <div className="zomato-resto-img-wrap">
                      <img src={r.img} alt={r.name} className="zomato-resto-img" loading="lazy" />
                      <span className="zomato-resto-rating">★ {r.rating}</span>
                    </div>
                    <div className="zomato-resto-info">
                      <div className="zomato-resto-name">{r.name}</div>
                      <div className="zomato-resto-type">{r.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
