#!/usr/bin/env python3
"""Parse z-ai web_search outputs (first JSON array only) and consolidate."""
import json, os, glob

OUT = '/tmp/p5e-research/consolidated.md'
files = sorted(glob.glob('/tmp/p5e-research/s*.json'))
lines = []
for f in files:
    raw = open(f).read()
    i = raw.find('[')
    if i < 0:
        continue
    dec = json.JSONDecoder()
    try:
        data, _ = dec.raw_decode(raw[i:])
    except Exception as e:
        lines.append(f"\n## {os.path.basename(f)}  (parse error: {e})\n")
        continue
    label = os.path.basename(f).replace('.json', '')
    lines.append(f"\n## {label}\n")
    for r in data[:8]:
        name = (r.get('name') or '').strip()
        url = (r.get('url') or '').strip()
        snip = (r.get('snippet') or '').strip().replace('\n', ' ')
        host = (r.get('host_name') or '').strip()
        date = (r.get('date') or '').strip()
        lines.append(f"- **{name}** ({host}, {date})\n  {url}\n  {snip}\n")
open(OUT, 'w').write('\n'.join(lines))
print(f"wrote {OUT}, {len(lines)} lines")
# also print a compact summary
total = 0
for f in files:
    raw = open(f).read(); i = raw.find('[')
    if i < 0: continue
    try: data, _ = json.JSONDecoder().raw_decode(raw[i:])
    except: continue
    total += len(data)
    print(f"  {os.path.basename(f)}: {len(data)} results")
print(f"TOTAL results: {total}")
