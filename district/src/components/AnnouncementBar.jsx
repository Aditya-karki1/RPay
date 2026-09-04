const messages = [
  'Free Shipping on Orders Above ₹999',
  'Use Code DISTRICT10 for 10% Off',
  'Free Returns Within 30 Days',
  'New Arrivals Every Week',
];

export default function AnnouncementBar() {
  const items = [...messages, ...messages];
  return (
    <div className="announce" aria-label="Promotions">
      <div className="announce-track" aria-hidden="true">
        {items.map((msg, i) => <span key={i}>{msg}</span>)}
      </div>
    </div>
  );
}
