#!/usr/bin/env bash
# Hero viewport verification (Prompt 05E §8): for each required viewport,
# confirm the primary CTA ("Discuss a challenge") is within the first viewport
# (rect.top + rect.height <= viewport height) and there is no horizontal overflow.
set -u
cd /home/z/my-project/paragonel-technologies
mkdir -p /home/z/my-project/download
URL="http://localhost:3000/"
declare -a VPS=("1440 900" "1366 768" "1280 720" "375 812" "390 844")
i=0
for vp in "${VPS[@]}"; do
  set -- $vp; W=$1; H=$2; i=$((i+1))
  S="p5e-hero-${W}x${H}"
  agent-browser --session "$S" close >/dev/null 2>&1
  agent-browser --session "$S" set viewport "$W" "$H" >/dev/null 2>&1
  agent-browser --session "$S" open "$URL" --timeout 45000 >/dev/null 2>&1
  sleep 4
  # dismiss cookie banner if present (no navigation)
  agent-browser --session "$S" eval "[...document.querySelectorAll('button')].find(b=>/Accept All|Accept/i.test(b.textContent))?.click()" >/dev/null 2>&1
  sleep 1
  # primary CTA visibility + overflow (measure only — do NOT click the CTA)
  RES=$(agent-browser --session "$S" eval "
    const cta=[...document.querySelectorAll('a,button')].find(b=>/Discuss a challenge/i.test(b.textContent));
    const r=cta?cta.getBoundingClientRect():null;
    const vw=window.innerWidth, vh=window.innerHeight;
    const sw=document.documentElement.scrollWidth, cw=document.documentElement.clientWidth;
    const ctaVisible = r ? (r.top + r.height <= vh && r.top >= 0) : null;
    JSON.stringify({vh, ctaTop: r?Math.round(r.top):null, ctaBottom: r?Math.round(r.top+r.height):null, ctaVisible, sw, cw, overflow: sw>cw});
  " 2>/dev/null | tail -1)
  echo "  ${W}x${H}: $RES"
  agent-browser --session "$S" screenshot "/home/z/my-project/download/p5e-hero-${W}x${H}.png" >/dev/null 2>&1
  agent-browser --session "$S" close >/dev/null 2>&1
done
echo ""
echo "=== screenshot non-blank check ==="
python3 -c "
from PIL import Image
for wh in ['1440x900','1366x768','1280x720','375x812','390x844']:
    p=f'/home/z/my-project/download/p5e-hero-{wh}.png'
    im=Image.open(p).convert('L'); h=im.histogram(); r=1-h[255]/sum(h)
    print(f'  {wh}: {im.size} non-white={r:.3f} {\"OK\" if r>0.05 else \"BLANK!\"}')
"