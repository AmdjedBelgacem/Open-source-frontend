import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const iconMap = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

export default function Toast({ id, message, type = 'info', onDismiss }) {
  const icon = iconMap[type] || iconMap.info;

  return (
    <motion.div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      initial={{ opacity: 0, y: 10, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -10, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="toast__icon">{icon}</div>
      <p className="toast__message">{message}</p>
      {type === 'error' && (
        <button
          className="toast__dismiss"
          onClick={() => onDismiss?.(id)}
          aria-label="Dismiss message"
        >
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
}
