import { useToast as useToastContext } from '../context/ToastContext';

/**
 * Hook to show toast notifications
 * Usage:
 *   const { showToast } = useToast();
 *   showToast('Success!', { type: 'success' });
 *   showToast('Error!', { type: 'error' });
 */
export function useToast() {
  return useToastContext();
}

export default useToast;
