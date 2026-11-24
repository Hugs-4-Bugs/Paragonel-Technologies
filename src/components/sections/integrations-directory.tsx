"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plug, CheckCircle2 } from "lucide-react";

export type Integration = { name: string; badge: string; note: string };

const CATEGORIES: { key: string; label: string; match: (i: Integration) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "channels", label: "Channels", match: (i) => ["Email", "WhatsApp", "LinkedIn", "Instagram", "Telegram"].includes(i.name) },
  { key: "ai", label: "AI Models", match: (i) => /OpenAI|Google AI|Anthropic|MCP/.test(i.name) },
  { key: "calendar", label: "Calendar", match: (i) => /Calendar|Cal\.com/.test(i.name) },
  { key: "crm", label: "CRM", match: (i) => /HubSpot|Salesforce/.test(i.name) },
  { key: "payments", label: "Payments", match: (i) => /Stripe|Razorpay/.test(i.name) },
];

const STATUS_ORDER = ["AVAILABLE", "DECLARED", "BUILDING", "IN DEVELOPMENT", "COMING SOON", "PLANNED", "IN MAP"];

export function IntegrationsDirectory({
  integrations,
  badgeStyle,
}: {
  integrations: Integration[];
  badgeStyle: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<Integration | null>(null);

  const filtered = useMemo(() => {
    const matcher = CATEGORIES.find((c) => c.key === cat)!;
    return integrations
      .filter(matcher.match)
      .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => STATUS_ORDER.indexOf(a.badge) - STATUS_ORDER.indexOf(b.badge));
  }, [query, cat, integrations]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations…"
            className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-4 text-sm font-medium outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                cat === c.key ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((i) => (
          <button
            key={i.name}
            type="button"
            onClick={() => setSelected(i)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plug className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-black tracking-tight">{i.name}</h4>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.note}</p>
              <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${badgeStyle[i.badge] || "bg-muted text-muted-foreground border-border"}`}>
                {i.badge}
              </span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No integrations match “{query}”.
          </div>
        )}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-2xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Plug className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{selected.name}</h3>
                    <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${badgeStyle[selected.badge]}`}>{selected.badge}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{selected.note}</p>
              <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
                Status is classified honestly. Only <span className="font-bold text-foreground">AVAILABLE</span> integrations are live today; others are building, in development, coming soon, or planned.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
