# Motion Light Design System

## Core Philosophy
"Motion Light" is a design language that prioritizes fluidity, softness, and clarity. It combines the tactile satisfaction of physical objects with the limitless possibilities of digital motion. The aesthetic is clean, airy, and optimistic, designed to feel approachable yet premium.

## Design Principles

### 1. Shape & Geometry
- **Pill Shapes & Rounds**: Prioritize fully rounded corners (pills) for buttons and inputs. Use generous border-radius (e.g., 30px+) for cards and containers to create a soft, friendly silhouette.
- **Fluidity**: Elements should feel like they flow into one another. Avoid sharp, aggressive angles in UI components.

### 2. Motion & Interaction
- **Spring Physics**: All interactive elements (hover, tap, focus) must use spring-based animations (Framer Motion) rather than linear easings. This creates a natural, tactile feel.
- **Micro-Interactions**: Every action needs feedback. Buttons scale down on tap; cards lift on hover; checkboxes spring into place.
- **Staggered Reveals**: Content should enter with orchestrated, staggered fade-in and slide-up animations to reduce cognitive load and add delight.

### 3. Visual Hierarchy & Depth
- **Soft Shadows**: Use multi-layered, diffuse shadows to create depth without harshness. Avoid solid black shadows; use colored shadows derived from the primary or accent colors when appropriate.
- **Glassmorphism**: Use backdrop blur and semi-transparent white backgrounds (`bg-white/60`, `backdrop-blur-md`) to create context and layering, especially for floating elements.
- **Clean Layouts**: Embrace negative space. Use "comfortable" to "loose" spacing density.

### 4. Typography
- **Headings (Display)**: Use **Archivo** (or similar Grotesque sans-serif) with heavy weights (Bold/Black) for headings. This provides a strong, modern anchor.
- **Body (UI)**: Use **Manrope** (or similar geometric sans-serif) for body text and UI elements. It offers excellent readability and a modern character.
- **Hierarchy**: distinct contrast between headings and body text using size and weight, not just color.

### 5. Color Usage (Themed)
- **Backgrounds**: innovative use of very light, tinted backgrounds (e.g., Ice Blue, Soft Mint, Pale Rose) instead of pure white/gray to set the mood.
- **Primary Actions**: High contrast. Solid, bold colors for primary actions.
- **Secondary Actions**: Soft, tinted backgrounds or outlines for secondary actions.
- **Text**: High contrast for readability, but avoid pure black (#000000) for large text blocks; use deep zinc/slate tones.

## Implementation Guidelines (Technical)
- **Tailwind CSS**: Use `rounded-full` for small elements, `rounded-[30px]` for cards.
- **Framer Motion**: Use `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.95 }}` as standard interaction baselines.
- **Icons**: Use **Lucide React** for consistent, clean iconography. Stroke width should match typography weight.

## Tone of Voice
- Friendly
- Modern
- Smooth
- Playful but Functional
