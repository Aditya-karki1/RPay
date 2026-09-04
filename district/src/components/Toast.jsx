import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast${toast.visible ? ' show' : ''}`} role="alert" aria-live="assertive">
      {toast.message}
    </div>
  );
}
