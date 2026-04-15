/**
 * src/components/ui/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Barrel export for all UI primitive components.
 *
 * Add every new component to this file when you create it.
 * This keeps imports clean across the codebase:
 *
 *   import { Badge, RoleBadge, GroupTypeBadge, Alert } from '@/components/ui';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Adding a new component:
 *   1. Create  src/components/ui/MyComponent.js
 *   2. Create  src/components/ui/MyComponent.module.css
 *   3. Add     export { MyComponent } from './MyComponent';  ← here
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { Badge, RoleBadge, GroupTypeBadge } from './Badge';
export { Alert } from './Alert';
export { PageHeader } from './PageHeader';
