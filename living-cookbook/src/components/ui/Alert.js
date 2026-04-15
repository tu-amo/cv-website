/**
 * Alert — contextual inline message banner
 * ─────────────────────────────────────────────────────────────────────────────
 * A CSS Modules component. Styles live in Alert.module.css.
 *
 * Usage:
 *   import { Alert } from '@/components/ui';
 *
 *   {error   && <Alert variant="error">{error}</Alert>}
 *   {success && <Alert variant="success">{success}</Alert>}
 *
 * Props:
 *   variant  — 'error' | 'success' | 'warn' | 'info'  (default: 'info')
 *   className — pass extra global classes if needed (rare)
 *   children  — the message content (string or JSX)
 */

import styles from './Alert.module.css';

export function Alert({ variant = 'info', className = '', children }) {
  if (!children) return null;

  const cls = [styles.alert, styles[variant], className].filter(Boolean).join(' ');

  return <div className={cls} role="alert">{children}</div>;
}
