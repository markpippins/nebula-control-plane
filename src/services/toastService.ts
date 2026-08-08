/**
 * Global Toast Notification Service
 * Pub/sub service to trigger toast notifications across the app,
 * including non-React code like API clients and WebSocket listeners.
 */

export interface Toast {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  endpoint?: string;
  statusCode?: number;
  details?: string;
  duration?: number;
  createdAt: number;
}

type ToastListener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners: Set<ToastListener> = new Set();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toastService = {
  subscribe(listener: ToastListener) {
    listeners.add(listener);
    listener([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  },

  getToasts() {
    return [...toasts];
  },

  show(toast: Omit<Toast, 'id' | 'createdAt'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? (toast.type === 'error' ? 8000 : 5000),
    };

    // Keep at most 5 active toasts to avoid UI overflow
    toasts = [newToast, ...toasts].slice(0, 5);
    notify();

    if (newToast.duration > 0) {
      setTimeout(() => {
        toastService.dismiss(id);
      }, newToast.duration);
    }

    return id;
  },

  showError(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'message' | 'type'>>) {
    return toastService.show({
      type: 'error',
      title,
      message,
      ...options,
    });
  },

  showSuccess(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'message' | 'type'>>) {
    return toastService.show({
      type: 'success',
      title,
      message,
      ...options,
    });
  },

  showInfo(title: string, message: string, options?: Partial<Omit<Toast, 'id' | 'createdAt' | 'title' | 'message' | 'type'>>) {
    return toastService.show({
      type: 'info',
      title,
      message,
      ...options,
    });
  },

  showApiError(endpoint: string, statusCode: number, message: string, details?: string) {
    const is500 = statusCode >= 500;
    const title = is500
      ? `Backend Server Error [${statusCode}]`
      : statusCode > 0
      ? `API Request Failed [${statusCode}]`
      : `Network / API Error`;

    return toastService.show({
      type: 'error',
      title,
      message: message || `An error occurred while communicating with ${endpoint}`,
      endpoint,
      statusCode,
      details,
      duration: is500 ? 10000 : 7000,
    });
  },

  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },

  clear() {
    toasts = [];
    notify();
  },
};
