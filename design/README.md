# Student Eco — Design System

A purple-forward, shadcn/ui based design system for **Student Eco**, a university student platform with four modules: **note sharing, marketplace, events, study buddy**. Built to match the existing Next.js 14 + Tailwind v3 + shadcn/ui (classic Radix) codebase, with a Discord/Figma-inspired modern energetic feel and full Turkish UI copy.

> Quick links: [colors_and_type.css](colors_and_type.css) · [SKILL.md](SKILL.md) · UI kits: [notes](ui_kits/notes/index.html) · [marketplace](ui_kits/marketplace/index.html) · [events](ui_kits/events/index.html) · [buddies](ui_kits/buddies/index.html)

---

## 1. Product context

Student Eco (working name: **Student Ecosystem**) is a 6-day graduation project — a single web app bundling four utilities for university students:

| Module        | What it does                                                  | Accent color |
|---------------|---------------------------------------------------------------|--------------|
| **Notlar**    | PDF lecture notes & past exams, filtered by course / semester | Blue         |
| **Pazaryeri** | Buy/sell textbooks and items, with images and per-listing DM  | Orange       |
| **Etkinlikler** | Student-organized events, RSVP and category filtering        | Green        |
| **Çalışma arkadaşı** | Lightweight buddy profiles, contact happens out-of-band | Pink         |

Single user role (authenticated student). No admin, no real-time, no mobile app, no email verification. Every screen is gated behind login except `/`, `/login`, `/register`.

### Sources used to build this system

- **Codebase**: [yselimc/student_eco](https://github.com/yselimc/student_eco) @ `main`. The `frontend/` folder is a Next.js 14 App Router scaffold with Tailwind v3 and shadcn/ui (classic, Radix-based). Files of note:
  - `frontend/tailwind.config.ts` — shadcn token wiring (`hsl(var(--*))`)
  - `frontend/src/app/globals.css` — default slate token set (we override to purple)
  - `frontend/components.json` — `style: default`, `baseColor: slate`, `iconLibrary: lucide`
  - `frontend/src/components/ui/button.tsx` — the only shadcn primitive present at scaffold time
- **Docs**: `docs/01..08-*.md` — full product spec, page inventory, schema, API contracts. We mirror the page list from `docs/05-frontend-pages.md` in our UI kits.
- **Brand directive (this engagement)**: purple primary (`#7C3AED` Tailwind purple-600, hover `#6D28D9` purple-700), slate neutrals, Inter font, light + dark, Turkish UI, sentence case throughout.

> The codebase does NOT yet include logos, marketing imagery, or finished screens. This system fills that gap with a defensible Discord/Figma-inspired interpretation, ready for the team to swap real brand assets in.

## 2. Index — what's in this folder

```
README.md                  ← you are here
SKILL.md                   ← Claude Code skill manifest
colors_and_type.css        ← all design tokens (HSL CSS vars, light + dark)
fonts/                     ← Geist VF (kept from codebase as fallback)
assets/                    ← logos, favicon, module marks, illustrations
preview/                   ← design-system preview cards (registered)
ui_kits/
  notes/                   ← Notes & past exams module
  marketplace/             ← Marketplace module
  events/                  ← Events module
  buddies/                 ← Study buddy module
```

## 3. Content fundamentals

> The product spec is English (it's a graduation project doc), but the **UI copy ships in Turkish**. Tone-of-voice rules below apply to that Turkish copy. English samples are given for clarity — translate, don't transliterate.

### Voice & tone

- **Friendly peer, not university administrator.** The product is built by students for students. Copy reads like a smart classmate, not a registrar's office.
- **Direct over decorative.** Empty states, errors, and CTAs say what's happening in one short line. No "Oops! Something went a bit wonky 🙈". Closer to "Yükleme başarısız. Tekrar dene." (Upload failed. Try again.)
- **Inclusive second person.** Use **sen / sana / senin** — informal "you" — across the product. Never the formal **siz**. (Discord and Figma both ship in Turkish using **sen**; matches the peer-to-peer vibe.)
- **No first person plural.** Avoid "Biz" / "we" — the product is the user's tool, not a brand performing for them.
- **Sentence case everywhere.** Buttons, headings, menu items, page titles. Never Title Case, never ALL CAPS (the only exception is `--t-label`, a uppercased eyebrow used sparingly).
- **No emoji in chrome.** Module names, buttons, and labels are word-only. Emoji are fine inside user-generated content (a listing description, a buddy bio). Module identity comes from color + lucide icons, not from an emoji.

### Copy rules

- **Buttons: verb + object.** "Not yükle", "İlana mesaj gönder", "Etkinliğe katıl". Never just "Gönder".
- **Form labels: noun, no colon.** "E-posta", "Kurs kodu", "Dönem". Helper text below in `--muted-foreground`.
- **Empty states: 1 line of fact + 1 CTA.** "Henüz notun yok. İlk notunu yükle." (You don't have any notes yet. Upload your first.) Don't write essays in empty states.
- **Errors: what happened + what to do.** "Dosya 10 MB'tan büyük olamaz." (File can't be larger than 10 MB.) — ends with a period, no exclamation.
- **Success toasts: past tense, terse.** "Not yüklendi." (Note uploaded.)
- **Numbers & dates use Turkish locale.** "₺35,00" (comma decimal), "10 Mayıs 2026, 18:00" (day month year, 24h).
- **Course codes stay in their original casing**: `CS301`, `MATH210`. Treat them as proper nouns.

### Sample copy table

| Surface                         | English (spec)                       | Turkish (UI)                                  |
|---------------------------------|--------------------------------------|-----------------------------------------------|
| Landing hero                    | Notes, marketplace, events, buddies. | Not, pazaryeri, etkinlik, arkadaş. Hepsi tek yerde. |
| Notes empty state               | No notes yet. Upload your first.     | Henüz not yok. İlk notunu yükle.              |
| Marketplace CTA                 | Message seller                       | Satıcıya mesaj gönder                         |
| Events RSVP                     | Going                                | Katılıyorum                                   |
| Buddy contact                   | Get in touch                         | İletişime geç                                 |
| 404                             | Page not found.                      | Sayfa bulunamadı.                             |

## 4. Visual foundations

### Colors

- **Brand**: a single purple ramp built around `--primary` (purple-600 `#7C3AED`) and `--primary-strong` (purple-700 `#6D28D9`). Hover and pressed states **always** use purple-700, never an opacity-faded purple-600.
- **Neutrals**: Tailwind slate end-to-end. Slate-50 → slate-950 covers all surfaces. We never reach for true black or true white outside `--background` (which is `#FFFFFF` in light mode for crispness).
- **Module accents**: each of the four modules gets one accent — **Notes blue / Marketplace orange / Events green / Buddy pink** — used for icons, badges and the per-module sidebar dot. They never replace `--primary` for buttons or focus rings.
- **Status**: red destructive, green success, amber warning, blue info — single-shade only, no light/dark pairs in v1.
- **Both modes mandatory.** Every component must render in `.light` and `.dark`. The toggle persists per-user.

### Typography

- **Inter**, weights 400 / 500 / 600 / 700 / 800. Loaded from Google Fonts. Geist (bundled in `/fonts`) is kept as a fallback because the scaffold ships it — do not introduce it as a new face.
- **JetBrains Mono** for course codes, prices, and any inline `<code>`.
- Headings are `font-weight: 700` with `letter-spacing: -0.02em` and `line-height: 1.1–1.25`. Body is 400 / 1.5.
- **Sentence case** as a typographic rule, not just a copy rule.

### Spacing & layout

- Tailwind 4-px spacing scale; UI density skews toward 12 / 16 / 24 / 32 in cards and forms.
- **Container max width** 1280 px (`2xl: 1400px` from tailwind config). Pages are top-nav + centered content, not sidebar shells. The dashboard is the only screen that uses a 4-up grid; every other list is a vertical stack of cards.
- **Card surfaces**: 1px slate-200 border, `--shadow-sm`, `--r-lg` (8 px). On hover, border becomes purple-200 and shadow lifts to `--shadow-md`. No glassmorphism. No gradients on cards.

### Backgrounds

- Pages are flat — `--background` only. **No full-bleed photography, no gradient washes, no patterns** as default chrome. The single exception is the auth screen, which uses a single soft radial purple highlight in the corner (purple at 8% alpha, radial fading to transparent) on a slate-50 base.
- Module dashboard cards may carry a quiet tinted icon plate (`bg: --primary-soft`, icon: `--primary-strong`) — never a full-card tint.

### Animation

- **Short and ease-out.** All transitions use `--ease-out` at `--t-norm` (180 ms) by default. Hover-color changes are `--t-fast` (120 ms). Modal/sheet entrances are `--t-slow` (240 ms).
- Comes for free from `tailwindcss-animate` (already in `package.json`) — Radix accordion, dialog, popover, sheet animations are kept as-is.
- **No bounces, no springs, no parallax.** Discord/Figma-energetic means crisp, not playful.

### Hover & press states

- **Hover (buttons primary)**: bg → `--primary-strong`. **No opacity fade.**
- **Hover (buttons ghost / outline / link)**: bg → `--accent` (purple-50 / purple-950), text → `--accent-foreground`.
- **Hover (cards)**: border → `purple-200` (light) / `purple-900` (dark), shadow → `--shadow-md`. No translate.
- **Press**: translate `0` (no shrink). bg → `--primary-strong` for primary, otherwise `--secondary`. Buttons rely on the focus ring + color shift, not scale.
- **Focus**: `--shadow-focus` — 2px transparent halo + 2px purple ring. Always visible on keyboard.
- **Disabled**: `opacity: 0.5`, `pointer-events: none`. Never recolor; just dim.

### Borders, shadows, transparency

- 1 px borders only. No 2 px decorative borders, no double borders.
- Shadows in 5 steps (`xs / sm / md / lg / xl`). `xs` on inputs at rest, `sm` on cards at rest, `md` on cards on hover and on dropdowns, `lg` on popovers and sheets, `xl` on modal dialogs.
- **No backdrop blur** on hovering UI by default. The only blur is the modal scrim (`bg: rgb(0 0 0 / 0.5)`, no blur in light, light blur in dark for legibility).
- Transparency is for scrims and selection highlights only. Component fills are always solid.

### Corner radii

- **8 px** (`--r-lg`) is the canonical corner — buttons, inputs, cards.
- 6 px (`--r-md`) on small chips/badges; 12 px (`--r-xl`) on dialogs and large cards (e.g. listing detail). 4 px (`--r-sm`) on inline tag chips.
- **Pill** (`--r-full`) only on avatars and the module nav-pill.

### Imagery vibe

- When real product imagery exists, prefer **warm, candid, daylit photography** — students at desks, books, campus. Light grain is fine; oversaturation is not. **Avoid** stocky boardroom shots, blue-corporate gradients, and AI-generated clip art. Treat every image as a placeholder until a brand photographer ships real frames.

### Layout rules

- **Top nav fixed** (sticky, `--shadow-xs` on scroll), 64 px tall, slate-200 bottom border. Logo + 4 module links + right-side user menu.
- **Mobile**: top nav collapses to logo + hamburger; bottom-nav is a 4-icon strip mapping to the 4 modules. Pixel min: 375 px.
- **Desktop list pages**: filter bar sticks to the top of the content area (not the page). Cards in a single column on `md`, 2-up at `xl`.

## 5. Iconography

- **Lucide React** is the icon library declared in `frontend/components.json` (`iconLibrary: lucide`) — and it is the system's only icon set. Stroke-only line icons, 1.5 px stroke weight, `currentColor`.
- We use lucide via the `lucide-react` package in code, and via the [unpkg lucide CDN](https://unpkg.com/lucide@latest/dist/umd/lucide.js) in our static HTML kits.
- **Module marks** (the four glyphs that identify each product area) are a fixed mapping:
  - Notes → `book-open`
  - Marketplace → `store`
  - Events → `calendar-days`
  - Study buddy → `users-round`
- **Sizes**: 16 px in dense lists, 20 px default, 24 px in nav, 28 px in module mark plates.
- **No emoji** in product chrome. **No unicode** glyphs as icons (no ★, no ▸). **No PNG icons.** **No custom SVG illustrations** drawn by hand — if we need spot art, we either commission it or use a placeholder block.
- **Logo**: a wordmark `eco.` set in Inter 800 with the `.` replaced by a purple (`--primary`) circle. SVG in `assets/logo.svg`. App icon stacks `e` over the dot. Both are placeholders the team can swap.

## 6. Components

The shadcn/ui classic Radix set is the component vocabulary. The kits implement the subset the product actually needs:

- **Atomic**: Button (5 variants × 4 sizes), Input, Textarea, Label, Badge, Avatar, Skeleton, Separator
- **Compound**: Card, FormRow, Select, DatePicker (Calendar+Popover), Tabs, Dialog, Sheet, DropdownMenu, Toast
- **Product**: Navbar, ModuleCard (dashboard), NoteCard, ListingCard, EventRow, BuddyCard, ThreadRow, MessageBubble, MessageComposer, FilterBar, EmptyState, RsvpButton

Every component is keyboard-accessible (Radix gives this for free) and renders in both modes.

---

See [SKILL.md](SKILL.md) for how an agent should use this system to build new screens.
