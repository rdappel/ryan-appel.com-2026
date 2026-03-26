# Design System Document

## 1. Overview & Creative North Star

### Creative North Star: The Terminal Architect
This design system is a digital manifesto for the creative technologist. It moves beyond the "portfolio-as-a-gallery" trope to "portfolio-as-a-command-center." The aesthetic is rooted in the precision of high-end IDEs and futuristic telemetry displays. 

To break the generic "template" look, this system utilizes **Intentional Asymmetry**. Layouts should feel like a complex code-base architecture: overlapping modules, structural grid lines that bleed into the margins, and high-contrast typographic scales that demand attention. By pairing deep obsidian surfaces with razor-sharp neon accents, we create a sensory experience of peering into a high-powered machine—dense with information, yet surgically clean.

---

## 2. Colors

The palette is engineered for high-performance dark mode, utilizing a "Deep Space" base with high-vibrancy "Energy Nodes."

- **The "No-Line" Rule:** Explicitly prohibit the use of 1px solid borders to define sections. Traditional borders create a "boxed-in" feeling that mimics cheap templates. Boundaries must be defined through background color shifts. Use `surface-container-low` for secondary sections and `surface-container-high` for interactive zones against the `background` (#0c0e12).
- **Surface Hierarchy & Nesting:** Treat the UI as layered hardware.
    - **Base:** `surface` (#0c0e12)
    - **Raised Modules:** `surface-container-low` (#111318)
    - **Active Interaction Hubs:** `surface-container-highest` (#23262c)
- **The "Glass & Gradient" Rule:** To provide "soul" to the technical aesthetic, use Glassmorphism for floating overlays. Apply a `backdrop-blur` of 20px to `surface-container` tiers at 70% opacity. 
- **Signature Textures:** For primary CTAs and hero highlights, utilize linear gradients transitioning from `primary` (#aaffdc) to `primary-container` (#00fdc1) at a 135-degree angle. This mimics the glow of a phosphor screen.

---

## 3. Typography

The typography strategy is a dialogue between **Technical Precision** and **Human Readability**.

- **Display & Headlines (Space Grotesk):** This is our "Control Panel" font. With its geometric, slightly eccentric forms, it should be used at large scales (`display-lg` at 3.5rem) with tight letter spacing (-0.02em) to feel like architectural branding.
- **Body & Titles (Inter):** The "Intelligence" font. Inter provides the high-legibility needed for project descriptions. 
- **The Monospace Accent:** (System Mono / Space Mono) Use for code snippets, metadata, and "label-sm" categories. This reinforces the "Creative Coder" persona.

**Hierarchy Goal:** Use `display-md` for project titles and immediately pair it with `label-sm` in a `secondary` (#00e3fd) color for metadata (e.g., "TIMESTAMP: 2024"). This creates a high-information density look common in sci-fi interfaces.

---

## 4. Elevation & Depth

In this system, depth is not simulated by 1990s-style drop shadows, but by **Tonal Layering** and **Luminance**.

- **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` (#000000) element inside a `surface-container-low` (#111318) wrapper to create an "inset" terminal look. 
- **Ambient Shadows:** For floating elements, shadows must be imperceptible yet effective. Use a blur of 40px with a 4% opacity shadow tinted with `secondary` (#00e3fd). It should look like an ambient glow from a screen, not a shadow cast by a sun.
- **The "Ghost Border" Fallback:** If a container needs a hard edge for accessibility, use a "Ghost Border": `outline-variant` (#46484d) at 15% opacity. 
- **Sharpness:** All `roundedness` tokens are set to `0px`. Sharp corners communicate engineering precision and high-end hardware.

---

## 5. Components

### Buttons
- **Primary:** Background: `primary` (#aaffdc) gradient; Text: `on-primary` (#00654b). Sharp corners only. On hover, apply a `subtle glow` effect using a box-shadow of the same color.
- **Tertiary:** No background. `outline-variant` Ghost Border. Text in `primary`.

### Input Fields
- **Styling:** Background: `surface-container-lowest` (#000000). Bottom border only (1px) using `primary-dim` (#00edb4). 
- **States:** On focus, the bottom border glows and a subtle `surface-variant` scan-line gradient appears in the background.

### Cards & Lists
- **Prohibition:** Forbid divider lines. Separate project items using the **Spacing Scale** (e.g., `12` / 2.75rem). 
- **Interaction:** Cards should utilize `glassmorphism`. On hover, the `surface-tint` (#aaffdc) should subtly increase in opacity from 0% to 5%.

### Technical Accents (Custom Component)
- **The "Grid Fragment":** Use `outline-variant` at 10% opacity to create non-functional grid lines that extend beyond the container edges, mimicking an unfinished blueprint.

---

## 6. Do's and Don'ts

### Do
- **Do** use `monospace` for all numerical data and timestamps.
- **Do** utilize `primary` and `secondary` neon colors sparingly as "status lights" or "data points."
- **Do** lean into white space. Technical interfaces feel "high-end" when information is dense but perfectly organized.

### Don't
- **Don't** use border-radius. Any curve breaks the "Technical Sci-Fi" immersion.
- **Don't** use standard "Grey" for shadows. Always tint shadows with the UI's accent colors.
- **Don't** use generic icons. Use thin-stroke (1px), geometric icons that match the `outline` token.
- **Don't** center-align long-form text. Stick to left-aligned "terminal-style" blocks for an authentic coder feel.