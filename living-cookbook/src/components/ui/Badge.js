/**
 * Badge — role and type indicator pill
 * ─────────────────────────────────────────────────────────────────────────────
 * A CSS Modules component. Styles live in Badge.module.css.
 *
 * Usage:
 *   import { Badge } from '@/components/ui';
 *
 *   <Badge variant="owner" size="sm">Owner</Badge>
 *   <Badge variant="pro">Pro Kitchen</Badge>
 *   <Badge variant="member">{Icon.users} Member</Badge>
 *
 * Props:
 *   variant  — 'default' | 'owner' | 'member' | 'pro' | 'household' | 'success' | 'error' | 'info'
 *   size     — 'sm' | 'md' | 'lg'  (default: 'sm')
 *   className — pass extra global classes if needed (rare)
 */

import styles from './Badge.module.css';

export function Badge({ variant = 'default', size = 'sm', className = '', children }) {
  const cls = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return <span className={cls}>{children}</span>;
}

/**
 * Convenience: role badge auto-selects variant + icon from the role string.
 *
 * Usage:
 *   import { RoleBadge } from '@/components/ui';
 *   <RoleBadge role={m.role} />
 */
import { Icon } from '@/components/icons';

export function RoleBadge({ role }) {
  const isOwner = role === 'owner';
  return (
    <Badge variant={isOwner ? 'owner' : 'member'} size="sm">
      {isOwner ? Icon.crown : Icon.users}
      {isOwner ? 'Owner' : 'Member'}
    </Badge>
  );
}

/**
 * Convenience: group type badge auto-selects variant from group_type string.
 *
 * Usage:
 *   import { GroupTypeBadge } from '@/components/ui';
 *   <GroupTypeBadge groupType={group.group_type} />
 */
export function GroupTypeBadge({ groupType }) {
  const isPro = groupType === 'pro_kitchen';
  return (
    <Badge variant={isPro ? 'pro' : 'household'} size="sm">
      {isPro ? 'Pro Kitchen' : 'Household'}
    </Badge>
  );
}
