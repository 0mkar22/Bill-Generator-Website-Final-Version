import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "lumina-ledger-mcp",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Design Tokens & Standards
// ---------------------------------------------------------------------------
const DESIGN_SYSTEM = {
  name: "Lumina Ledger",
  philosophy: "Hyper-Refined Glassmorphism (Silicon Valley B2B SaaS Standard)",
  fonts: {
    ui: "Geist, Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "JetBrains Mono, Fira Code, Menlo, monospace"
  },
  colors: {
    background: "#09090b", // zinc-950 (never pure black)
    surface: "#131315",
    surfaceContainer: "rgba(24, 24, 27, 0.5)", // zinc-900/50
    borderDefault: "rgba(255, 255, 255, 0.10)", // 1px border-white/10
    borderSubtle: "rgba(255, 255, 255, 0.05)",
    borderHighlight: "rgba(255, 255, 255, 0.20)",
    accentIndigo: "#6366f1",
    accentIndigoGlow: "rgba(99, 102, 241, 0.15)",
    status: {
      paid: { text: "#34d399", bg: "rgba(16, 185, 129, 0.10)", border: "rgba(16, 185, 129, 0.20)" },
      pending: { text: "#fbbf24", bg: "rgba(245, 158, 11, 0.10)", border: "rgba(245, 158, 11, 0.20)" },
      overdue: { text: "#fb7185", bg: "rgba(244, 63, 94, 0.10)", border: "rgba(244, 63, 94, 0.20)" },
      processing: { text: "#818cf8", bg: "rgba(99, 102, 241, 0.10)", border: "rgba(99, 102, 241, 0.20)" }
    }
  },
  tailwindConfig: `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#131315',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'glass-radial': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12) 0%, rgba(24, 24, 27, 0) 70%)',
        'subtle-glow': 'radial-gradient(ellipse 600px 300px at 50% -10%, rgba(255, 255, 255, 0.06), transparent)',
        'modal-spotlight': 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), rgba(9, 9, 11, 0) 70%)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass-border': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'elevated-glow': '0 0 25px -5px rgba(99, 102, 241, 0.15)',
        'button-glow': '0 0 20px -2px rgba(255, 255, 255, 0.18)',
      },
    },
  },
  plugins: [],
};`
};

// ---------------------------------------------------------------------------
// MCP Resources
// ---------------------------------------------------------------------------
server.resource(
  "tokens",
  "lumina://design/tokens",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(DESIGN_SYSTEM, null, 2),
      mimeType: "application/json"
    }]
  })
);

server.resource(
  "tailwind-config",
  "lumina://config/tailwind",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: DESIGN_SYSTEM.tailwindConfig,
      mimeType: "text/javascript"
    }]
  })
);

server.resource(
  "rules",
  "lumina://guidelines/rules",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: `# Lumina Ledger Design System Rules
1. Background: strictly \`bg-zinc-950\` (#09090b). Never pure black.
2. Borders: 1px translucent lines (\`border border-white/10\`).
3. Surfaces: Glass containers (\`bg-zinc-900/50 backdrop-blur-xl border border-white/10\`).
4. Typography: Geist/Inter for primary UI; JetBrains Mono for numbers, currencies, hashes.
5. Accents: \`bg-indigo-500/10 text-indigo-400 border-indigo-500/20\`.
6. Status: Paid (emerald), Pending (amber), Overdue (rose), Processing (indigo).`,
      mimeType: "text/markdown"
    }]
  })
);

// ---------------------------------------------------------------------------
// MCP Tools
// ---------------------------------------------------------------------------
server.tool(
  "get_component_snippet",
  {
    component: z.enum(["table", "modal", "card", "input", "button", "sidebar"])
  },
  async ({ component }) => {
    const snippets: Record<string, string> = {
      card: `<div className="relative rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-5 shadow-2xl overflow-hidden">
  <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-2">Total Billed Q1</div>
  <div className="text-2xl font-bold font-mono text-zinc-100 tracking-tight mb-3">$2,845,920.00</div>
  <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
    +18.4% vs prior quarter
  </span>
</div>`,
      input: `<div>
  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Invoice Reference</label>
  <input
    type="text"
    placeholder="INV-2025-001"
    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all duration-200"
  />
</div>`,
      button: `<button className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-zinc-100 text-zinc-950 rounded-lg hover:bg-white transition-all duration-200 shadow-button-glow">
  <span>Confirm Settlement</span>
</button>`,
      sidebar: `<aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl p-4">
  <div className="flex items-center gap-3 px-2 py-3 mb-4">
    <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center">
      <div className="h-3.5 w-3.5 rounded-sm bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
    </div>
    <span className="text-sm font-semibold tracking-tight text-zinc-100">Lumina Ledger</span>
  </div>
  <div className="p-3 rounded-lg bg-zinc-900/30 border border-white/5 flex items-center justify-between">
    <span className="text-[11px] font-mono text-zinc-400">Ledger Live</span>
    <span className="text-[10px] font-mono text-zinc-500">99.98%</span>
  </div>
</aside>`,
      modal: `<div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-2xl p-8 shadow-2xl overflow-hidden">
  <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
    <span className="text-xs font-mono text-indigo-300">Section A: Identification</span>
  </div>
</div>`,
      table: `<table className="w-full text-left border-collapse">
  <thead>
    <tr className="border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-950/40">
      <th className="px-6 py-3 font-medium">Record ID</th>
      <th className="px-6 py-3 font-medium">Recipient</th>
      <th className="px-6 py-3 font-medium text-right">Amount (USD)</th>
      <th className="px-6 py-3 font-medium text-center">Status</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-white/5 text-xs">
    <tr className="hover:bg-zinc-800/40 transition-colors">
      <td className="px-6 py-3 font-mono text-zinc-300">INV-2025-0849</td>
      <td className="px-6 py-3 font-medium text-zinc-100">Acme Global Corp</td>
      <td className="px-6 py-3 font-mono text-zinc-100 font-semibold text-right">$42,500.00</td>
      <td className="px-6 py-3 text-center">
        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          Paid
        </span>
      </td>
    </tr>
  </tbody>
</table>`
    };

    return {
      content: [{
        type: "text" as const,
        text: snippets[component] || "Component snippet not found."
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Lumina Ledger Design System MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
