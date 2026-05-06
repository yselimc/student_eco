---
name: student-eco-design
description: Use this skill to generate well-branded interfaces and assets for Student Eco, the 4-module university student platform (notes, marketplace, events, study buddy), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Pull tokens from `colors_and_type.css`, components and full-screen patterns from `ui_kits/<module>/`. The design language is shadcn/ui Radix classic over a purple primary (`#7C3AED`) on slate neutrals, Inter typography, sentence-case Turkish UI copy, light + dark.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand. The source app is Next.js 14 + Tailwind v3 + shadcn/ui — wire `colors_and_type.css` HSL tokens into Tailwind via the existing `tailwind.config.ts` and `globals.css`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which module, light/dark, surface type, copy in Turkish), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
