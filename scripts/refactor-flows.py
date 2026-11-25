#!/usr/bin/env python3
"""Refactor the 6 remaining AI flows to use the centralized GEMINI_MODEL_REF
instead of the hardcoded (sunset) 'googleai/gemini-1.5-flash-latest'."""
import re, sys
from pathlib import Path

FLOWS = [
    "src/ai/flows/format-application-email-flow.ts",
    "src/ai/flows/generate-job-match-email-flow.ts",
    "src/ai/flows/company-qna-flow.ts",
    "src/ai/flows/fetch-tech-news.ts",
    "src/ai/flows/recommend-related-content.ts",
    "src/ai/flows/analyze-resume-flow.ts",
]
ROOT = Path(__file__).resolve().parent.parent
OLD = "googleai/gemini-1.5-flash-latest"

for rel in FLOWS:
    p = ROOT / rel
    src = p.read_text()
    if OLD not in src:
        print(f"  {rel}: no hardcoded model (skip)")
        continue
    # Replace the model string literal with the centralized ref.
    new = src.replace(f"model: '{OLD}'", "model: GEMINI_MODEL_REF")
    # Replace any remaining bare mentions (doc comments) with a note.
    new = new.replace(OLD, "gemini-flash-latest (via GEMINI_MODEL_REF)")
    # Add the import after the last top-level import line if not already present.
    if "import { GEMINI_MODEL_REF }" not in new:
        lines = new.split("\n")
        last_import = -1
        for i, ln in enumerate(lines):
            if ln.startswith("import "):
                last_import = i
        if last_import >= 0:
            lines.insert(last_import + 1, "import { GEMINI_MODEL_REF } from '@/ai/models';")
            new = "\n".join(lines)
        else:
            new = "import { GEMINI_MODEL_REF } from '@/ai/models';\n" + new
    p.write_text(new)
    print(f"  {rel}: refactored to GEMINI_MODEL_REF")

remaining = [rel for rel in FLOWS if "gemini-1.5-flash-latest" in (ROOT / rel).read_text()]
print(f"\nflows still containing the old model id: {remaining or 'NONE'}")
sys.exit(0 if not remaining else 1)
