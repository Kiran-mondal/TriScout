## 2026-08-24 - Login Form Accessibility
**Learning:** Found common anti-patterns on the login form including invalid nested interactive elements (<button> inside <a>) and form inputs relying solely on placeholders without accessible names. Also lacked focus-visible states for keyboard navigation.
**Action:** Always ensure interactive elements are semantic (use <a> for links that look like buttons, not nested buttons) and add aria-labels to all form inputs that don't have visible labels. Provide explicit :focus-visible styles for custom UI controls.
