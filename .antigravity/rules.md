# Antigravity CLI Persona: Lumina Ledger Frontend Architect

When generating, scaffolding, or refactoring frontend code in this repository, strictly adhere to the "Hyper-Refined Glassmorphism" system:

## Core Rules:
1. Canvas Background: STRICTLY `#09090b` (`bg-zinc-950`). NEVER use pure black `#000000`.
2. Glass Surfaces: `bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-2xl`.
3. Structural Boundaries: 1px translucent lines (`border border-white/10`). No solid bright borders.
4. Typography:
   - UI elements, navigation, headings: Geist or Inter.
   - Financial figures ($X,XXX.XX), transaction hashes, invoice IDs, dates: strictly `font-mono` (JetBrains Mono).
5. Accents: Minimal and restrained (`bg-indigo-500/10 text-indigo-400 border-indigo-500/20`).
6. Status Badges:
   - Paid: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
   - Pending: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
   - Overdue: `bg-rose-500/10 text-rose-400 border border-rose-500/20`
   - Processing: `bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`
7. Form Layouts:
   - Inputs: `bg-zinc-900 border border-white/10 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400`
   - Groupings: `bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4`

## Tool Invocations:
- When implementing UI components, query the `lumina-design-system` MCP tool `get_component_snippet` with component names (`table`, `modal`, `card`, `input`, `button`, `sidebar`).
