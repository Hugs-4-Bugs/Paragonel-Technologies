"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, Sparkles, ArrowRight, FlaskConical } from "lucide-react";

/**
 * Workflow recipes — AigentX-style click-to-open recipe cards.
 * Recipes are conceptual examples illustrating how stages chain together,
 * not shipped autonomous workflows. Each is labelled accordingly.
 */
type Recipe = {
  name: string;
  purpose: string;
  useCase: string;
  stages: string[];
  detail: string;
  status: "Conceptual" | "Experimental";
};

const recipes: Recipe[] = [
  {
    name: "Warm-intent reply → booked meeting",
    purpose: "Turn an interested reply into a scheduled call without losing context.",
    useCase: "A prospect replies positively to outreach.",
    stages: ["Reply", "Meeting", "Pipeline"],
    detail: "When a reply signals interest, the conversation state moves the opportunity to Meeting, proposes times, and lands the booked meeting on the pipeline — all within the same record that produced the original outreach.",
    status: "Conceptual",
  },
  {
    name: "Gap-triggered re-personalization",
    purpose: "Re-draft outreach when a new gap is detected.",
    useCase: "Research surfaces a fresh trigger mid-cycle.",
    stages: ["Find Gaps", "Opportunity Report", "Personalize", "Outreach"],
    detail: "A newly detected gap refreshes the opportunity report, which re-personalizes the outreach angle. The prospect receives a message grounded in the new trigger rather than the original generic opener.",
    status: "Conceptual",
  },
  {
    name: "High-score → priority proposal",
    purpose: "Fast-track a qualified opportunity to proposal.",
    useCase: "An opportunity scores above a team-defined threshold.",
    stages: ["Score", "Pipeline", "Proposal"],
    detail: "A high score promotes the opportunity on the pipeline and pre-drafts a proposal from the accumulated research and gaps, so a human finalizes rather than starts from scratch.",
    status: "Conceptual",
  },
  {
    name: "Discovery enrichment loop",
    purpose: "Move a thin prospect toward a usable opportunity.",
    useCase: "A discovered business has minimal information.",
    stages: ["Discover", "Research", "Find Gaps"],
    detail: "A prospect with little information is enriched through Research; where gaps cannot be evidenced, the system says so rather than inventing data. Only prospects with a usable opportunity context proceed.",
    status: "Experimental",
  },
];

export function WorkflowRecipes() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {recipes.map((r, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={r.name}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-start justify-between gap-3 p-5 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">{r.status}</span>
                </div>
                <h4 className="text-base font-black tracking-tight">{r.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{r.purpose}</p>
              </div>
              <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border p-5">
                    <div className="mb-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target use case</div>
                      <p className="text-sm text-foreground">{r.useCase}</p>
                    </div>
                    <div className="mb-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stage sequence</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {r.stages.map((st, k) => (
                          <span key={st} className="flex items-center gap-1.5">
                            <span className="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">{st}</span>
                            {k < r.stages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.detail}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      <div className="md:col-span-2">
        <p className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <FlaskConical className="h-4 w-4 text-primary" />
          Recipes are conceptual examples illustrating how stages can chain together — not shipped autonomous workflows. AcquisitionOS is in Private Beta; automation depth is on the roadmap.
        </p>
      </div>
    </div>
  );
}
