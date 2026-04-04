import { AnimatePresence } from 'framer-motion';
import Toast from './Toast';
import { useToast } from '../context/ToastContext';
import './ToastContainer.css';

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <AnimatePresence mode="popLayout">
      <div className="toast-container" aria-label="Notifications">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </AnimatePresence>
  );
}
