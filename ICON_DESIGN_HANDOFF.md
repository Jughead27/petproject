# Navigation Icon Design Handoff

## Project: PetProject
**Purpose:** Custom, animal-forward navigation icons for the app bottom navigation bar.

---

## Design Specifications

### Canvas & Technical
- **Size:** 24x24px (canvas size)
- **Format:** SVG (export as clean, minimal SVG code)
- **Color:** Solid fill color (will be applied dynamically via CSS variable `currentColor`)
- **Style:** Minimal, geometric, clean line art
- **Design Language:** Matches PetProject aesthetic—sharp corners, modern, elegant, fun but polished

### Navigation Context
- **Active state:** Teal accent color (#0891b2)
- **Inactive state:** Dark gray/ink color
- **Label below each icon:** "Explore", "Create", "Profile"
- **Used on:** Bottom navigation bar on all main pages (carousel, profile, pet detail, create)

---

## Icons to Design

### 1. PAWPARAZZI
**Concept:** Pets the person follows (paparazzi/camera theme)
**Visual:**
- Camera or multiple pet faces/silhouettes
- Conveys "following" and "watching" other pets
- Could be: camera lens, multiple paw prints, stack of pet faces, or paparazzi-style imagery
- Alternative: Simple paw print with a "watch" or "follow" accent

**Style notes:**
- Keep animal-forward and minimal
- Should feel distinct from other three icons
- Camera imagery is optional if it doesn't fit geometric style

---

### 2. EXPLORE
**Concept:** Paw print pattern (discovering all pets)
**Visual:**
- Central paw pad (larger circle in center)
- Four toe pads arranged around it (smaller circles)
- Arrangement suggests a paw print trail or scattered discovery
- Clean, recognizable as a paw at 24x24px

**Style notes:**
- Solid filled circles for pads
- Geometric, minimal
- Should be immediately readable as "paw print"

---

### 3. CREATE
**Concept:** Paw print with plus overlay (adding your pet)
**Visual:**
- Paw print (same as above, or simplified version)
- Plus sign (+) overlaid or integrated with the paw
- Suggests "add a pet" action
- Clean integration of both symbols

**Style notes:**
- Solid fills for paw pads
- Plus sign can be line-based or filled
- Should read as "create/add"

---

### 4. PROFILE
**Concept:** Cat face outline (your pets/identity)
**Visual:**
- Minimalist cat face
- Pointed ears (triangular, sharp)
- Eyes (two small dots or circles)
- Face shape (round or geometric)
- Mouth optional (can be minimal or omitted)
- Proportions: cat should feel friendly but minimal

**Style notes:**
- Solid fills
- Geometric, no curves unless necessary
- Should be recognizable as a cat at small size
- Elegant and refined

---

## Design Language
- **Aesthetic:** Minimal line art, geometric
- **Corners:** Prefer sharp angles where possible (matches app design)
- **Negative space:** Clean, uncluttered
- **Symmetry:** Icons should feel balanced
- **Refinement:** Professional quality—"best in class" not stock

---

## Technical Requirements for Export
- **SVG format:** Clean, minimal code
- **One SVG per icon** (4 files total: pawparazzi.svg, explore.svg, create.svg, profile.svg)
- **No external dependencies** (fonts, images, etc.)
- **Colors:** Use `currentColor` or omit fill (will be styled via CSS)
- **Stroke:** Solid fills preferred over strokes for clarity at 24x24
- **Viewbox:** 0 0 24 24

---

## Context & Brand
**PetProject** is a social discovery app for pets. The brand is:
- Pet-forward and animal-focused
- Modern, elegant, fun
- Sharp-cornered design (no rounded/pill shapes)
- Teal accent color (#0891b2)
- Typeface: Instrument Serif (italic) for headings, sans-serif for body

The icons should reinforce that this is **about the pets**, not the people. Animal imagery is central.

---

## Success Criteria
✅ Icons are immediately recognizable at 24x24px
✅ Paw print reads clearly as a paw
✅ Cat face is clearly a cat
✅ Plus sign in create icon is obvious
✅ Pawparazzi icon conveys "following/watching pets"
✅ All four icons feel cohesive and part of same design system
✅ Professional, polished quality (not stock-feeling)
✅ Geometric and minimal, no unnecessary complexity

---

## Next Steps
1. Design four icons to these specs in Claude Design
2. Export as clean SVG code
3. Provide SVG files for integration
4. Ready to drop into React components
