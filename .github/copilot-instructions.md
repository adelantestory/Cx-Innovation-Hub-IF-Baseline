# UI & Accessibility Standards

These instructions define the required accessibility, design system, and testing standards.
They apply to all UI development, analysis, and refactoring activities.

---

# 1. Accessibility Standard (WCAG Target)

## Required Compliance Level
- All UI must meet **WCAG 2.1 Level AA**

Level AA is the standard benchmark for accessibility, addressing common barriers for a wide range of users. [1](https://accessibility.normsuite.com/learn/wcag-21-compliance-checklist)

## Core Principles (POUR)
All UI must adhere to:

### Perceivable
- Provide text alternatives for non-text content (images, icons)
- Maintain sufficient color contrast (minimum 4.5:1 for normal text)
- Do not rely on color alone to convey meaning
- Use semantic structure (headings, landmarks)

### Operable
- All functionality must be accessible via keyboard
- Visible focus indicators must be present
- Navigation must be consistent and predictable
- Avoid keyboard traps and inaccessible interactive components [2](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)

### Understandable
- Provide clear labels and instructions for inputs
- Clearly identify and describe errors
- Maintain consistent navigation and behavior

### Robust
- Use semantic HTML wherever possible
- Ensure components expose proper name, role, and state using ARIA attributes only when native HTML semantics are insufficient

---

# 2. Design System Rules

## Design Tokens (Required)
All UI must use design tokens as the source of truth for:
- Colors
- Spacing
- Typography
- Border radius, shadows, motion

Tokens represent reusable, named design decisions and ensure consistency across the system. [3](https://thefrontkit.com/blogs/tailwind-css-design-tokens-for-saas)

### Rules
- Do not hardcode values (e.g., hex colors, spacing, font sizes)
- Use token-based utilities or variables
- Maintain consistency across components and layouts

## Typography
- Follow a consistent type scale
- Use typography to create hierarchy (headings, body, labels)
- Maintain readable line heights and spacing

## Spacing & Layout
- Use standardized spacing scale (token-driven)
- Maintain consistent padding, margin, and gap patterns
- Ensure layouts respond properly across screen sizes

## Component Usage
- Use approved design system components
- Compose UI from reusable patterns rather than one-off implementations
- Prioritize consistency over custom styling

---

# 3. Deprecated / Banned Patterns

The following patterns must not be used:

## Accessibility Violations
- Missing alt text on images
- Low or failing contrast ratios
- Mouse-only interactions (no keyboard support)
- Hidden focus indicators (e.g., removing outline without replacement)
- Placeholder-only form labels

## Design Violations
- Arbitrary values outside token system (e.g., random spacing or colors)
- Duplicate or inconsistent component implementations
- Inline styles that bypass design system

---

# 4. Organization-Specific Accessibility Practices

## General Expectations
- Accessibility is required for all user-facing UI
- Accessibility is treated as a core UX requirement, not a post-process

## Implementation Practices
- Prefer semantic HTML over custom ARIA where possible
- Use ARIA only when native semantics are insufficient
- Ensure interactive elements are discoverable and labeled

## Responsiveness & Mobile
- UI must remain usable at 320px viewport width (mobile baseline)
- Content must reflow without losing functionality or requiring horizontal scroll

---

# 5. Testing Expectations

## Required Testing Approach

Accessibility and UI quality must be validated through:

### Automated Testing
- Include accessibility scans (e.g., axe-core via Playwright)
- Detect common issues:
  - missing labels
  - poor contrast
  - invalid attributes
  - duplicate IDs [4](https://playwright.dev/docs/accessibility-testing)

### Quick Visual Check
IMMEDIATELY after implementing any front-end change:
- **Identify what changed** - Review the modified components/pages
- **Navigate to affected pages** - Use `mcp__playwright__browser_navigate` to visit each changed view
- **Verify design compliance** - Compare against `/context/design-principles.md` and `/context/style-guide.md`
- **Validate feature implementation** - Ensure the change fulfills the user's specific request
- **Check acceptance criteria** - Review any provided context files or requirements
- **Capture evidence** - Take full page screenshot at desktop viewport (1440px) of each changed view
- **Check for errors** - Run `mcp__playwright__browser_console_messages`

### Manual Testing
- Keyboard navigation (Tab, Shift+Tab, Enter)
- Focus behavior and visibility
- Screen reader compatibility (basic validation)

### UX Validation
- Ensure forms provide clear error messages and instructions
- Validate responsive layouts across breakpoints

## Important Guidance
- Automated tools detect only a subset of accessibility issues
- Combine automated checks with manual validation for full coverage [4](https://playwright.dev/docs/accessibility-testing)

---

# 6. Enforcement

All generated, reviewed, or refactored UI must:
- Align with these standards
- Prioritize accessibility and consistency
- Avoid introducing new violations

If conflicts arise:
- Accessibility requirements take precedence over visual design
- Design system rules take precedence over custom implementations
