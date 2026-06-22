# Premium UI Aesthetic Spec (High-Impact Modern SaaS)

This guide defines a strict, opinionated visual system designed to produce
clean, striking, high-end SaaS UI.

This is NOT flexible. Agents must converge toward this style.

---

# 1. Color System (Highly Opinionated)

## 1.1 Base Palette (Dark-first / modern SaaS)

Use this exact structure:

Neutrals:
- Background: #0B0D10
- Surface: #111418
- Elevated Surface: #161A20
- Border: #232832
- Muted Text: #8A93A4
- Primary Text: #E6EAF2

Accent (choose ONE per app):
- Blue (default): #4F7CFF
- Purple: #7C5CFF
- Teal: #2FC9C5

Semantic:
- Success: #2ECC71
- Warning: #F5A623
- Error: #FF5C5C

## Rules
- Background MUST stay dark-neutral (no white UI for this system)
- Accent color MUST be used sparingly (CTA + highlights only)
- No more than 1 accent color in a view

---

# 2. Typography (Premium feel)

## Font (MANDATORY)
- Primary: Inter
- Fallback: system-ui

## Scale (STRICT)

- H1: 32px / 600 / tight spacing
- H2: 24px / 600
- H3: 18px / 500
- Body: 14px / 400
- Caption: 12px / 400

## Rules
- NEVER exceed 3 font sizes per section
- NEVER use more than 3 font weights (400 / 500 / 600)
- Hierarchy MUST be expressed through size + spacing (NOT color)

---

# 3. Layout & Spacing (What makes it "premium")

## Spacing scale (ONLY allowed values)

4px → tight micro spacing  
8px → compact UI  
16px → standard spacing  
24px → section grouping  
32px → large separation  
48px → major layout spacing  

## Layout rules
- EVERYTHING must align to grid
- NO uneven spacing between elements
- Whitespace replaces borders

---

# 4. Surfaces & Depth (Signature visual style)

## Layering model

Page → flat dark (#0B0D10)  
Sections → subtle elevation (#111418)  
Cards → elevated (#161A20)

## Shadows (VERY SUBTLE)

Only use:
- 0px 2px 12px rgba(0,0,0,0.25)

## Borders
- 1px solid #232832 ONLY
- No thick borders EVER

---

# 5. Components (Highly opinionated)

## Buttons

Primary:
- Background: accent color
- Text: white
- Radius: 8px
- Padding: 10px 16px

Secondary:
- Background: transparent
- Border: 1px solid #232832

Rules:
- ONLY ONE primary button per screen
- All other actions must be secondary

---

## Inputs

- Background: #161A20
- Border: 1px solid #232832
- Radius: 8px
- Padding: 10–12px

Focus:
- Border → accent color
- Glow → subtle (0 0 0 2px rgba(accent, 0.2))

---

## Cards

- Background: #161A20
- Border OR shadow (never both heavy)
- Padding: 16–24px
- Rounded corners: 10px

---

# 6. Navigation (Linear-style)

- Minimal
- Horizontal or left sidebar
- Active state:
  - subtle background highlight
  - accent left border OR underline

Avoid:
- heavy nav bars
- oversized icons

---

# 7. Visual Style Rules (THIS creates the “wow”)

## 7.1 Density balance
- UI should feel information-rich but NEVER cluttered

## 7.2 Alignment perfection
- Nothing should feel misaligned
- spacing must feel mathematically consistent

## 7.3 Contrast control
- high readability without harsh contrast
- avoid pure white (#FFFFFF)

## 7.4 Subtle motion (REQUIRED)
- hover → slight darkening OR lift
- transition → 150–200ms

---

# 8. What to REMOVE (enforced transformation)

Agents MUST remove:

- random spacing
- multiple button styles
- more than 1 accent color
- heavy borders everywhere
- cluttered layouts
- inconsistent typography
- bright or noisy backgrounds

---

# 9. Transformation Intent (Critical)

When refactoring UI:

## MUST:
- simplify layout
- introduce consistent spacing
- normalize component styles
- reduce color usage
- create strong hierarchy

## SHOULD:
- introduce layered surfaces
- improve alignment precision
- make UI feel calmer and more structured

---

# 10. Definition of "Aesthetic Success"

The UI is considered successful when:

- It resembles modern SaaS apps like Linear / Stripe
- It feels clean, minimal, and intentional
- The user can scan the layout instantly
- There is clear visual hierarchy
- It looks “production-ready” and polished

---

# 11. Visual Target Reference (for agents)

Aim for:
- Linear.app UI density + spacing
- Stripe Dashboard clarity + hierarchy
- Vercel UI minimalism + polish

Avoid:
- default Tailwind look
- cluttered bootstrap-style UI