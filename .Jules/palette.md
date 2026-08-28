## 2026-08-24 - Login Form Accessibility
**Learning:** Found common anti-patterns on the login form including invalid nested interactive elements (<button> inside <a>) and form inputs relying solely on placeholders without accessible names. Also lacked focus-visible states for keyboard navigation.
**Action:** Always ensure interactive elements are semantic (use <a> for links that look like buttons, not nested buttons) and add aria-labels to all form inputs that don't have visible labels. Provide explicit :focus-visible styles for custom UI controls.
## 2024-05-18 - Keyboard Navigation and Async Loading States
**Learning:** Custom interactive elements (like the `.menu-toggle` div) require explicit `role="button"`, `tabindex="0"`, and `onkeydown` handlers to be accessible to keyboard users. Without these, screen readers and keyboard users cannot interact with the menu. Additionally, async operations without explicit UI feedback (like disabling buttons and changing text) lead to confusion about whether an action was successful.
**Action:** Always add keyboard accessibility attributes to non-button interactive elements and ensure all async actions have clear, immediate visual loading states (e.g., button disable/text change).
## 2024-05-19 - ARIA Expanded Dynamic States
**Learning:** Found static `aria-expanded="false"` tags on dropdown toggle buttons. Screen readers rely on these dynamic attributes toggling via Javascript on interactive components like profile dropdown menus.
**Action:** When adding `aria-expanded` and `aria-haspopup` to custom popups/dropdowns, always ensure the corresponding click handler dynamically toggles the state of `aria-expanded` between `true` and `false` to provide accurate context to screen readers.
