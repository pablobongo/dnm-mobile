// useToast.js — hook per notifiche toast
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', duration = 2500) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const Toast = toast ? (
    <div className={`toast toast--${toast.type}`}>
      {toast.message}
    </div>
  ) : null;

  return { showToast, Toast };
}
