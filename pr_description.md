💡 What: Added `for` attributes to orphaned `<label>` elements and explicit `sr-only` (screen-reader only) labels for visually unlabeled inputs (like CLI and email dispatch inputs).
🎯 Why: Forms without properly associated labels prevent screen readers from announcing inputs correctly and stop users from focusing input fields by clicking their text labels, hurting accessibility and click area.
📸 Before/After: Inputs behave exactly the same visually, but their textual labels can now be clicked to focus them, expanding the target area.
♿ Accessibility: Ensures full WCAG compliance for form controls by programmatically associating labels with inputs.
