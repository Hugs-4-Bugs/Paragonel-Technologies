#!/usr/bin/env bash
# 05F responsive check: no horizontal overflow at the 6 required viewports
# for /blog, /blog/[slug], /contact. Also captures screenshots.
set -u
cd /home/z/my-project/paragonel-technologies
mkdir -p /home/z/my-project/download
declare -a VPS=("1440 900" "1366 768" "1280 720" "768 1024" "390 844" "375 812")
SLUG="engineering-logic-acquisition-os"
ROUTES="/blog /blog/$SLUG /contact /terms /cookie-policy"
for vp in "${VPS[@]}"; do
  set -- $vp; W=$1; H=$2
  for r in $ROUTES; do
    S="p5f-$(echo "$r"|tr '/ ' '__')-${W}x${H}"
    agent-browser --session "$S" close >/dev/null 2>&1
    agent-browser --session "$S" set viewport "$W" "$H" >/dev/null 2>&1
    agent-browser --session "$S" open "http://localhost:3000$r" --timeout 45000 >/dev/null 2>&1
    sleep 3
    agent-browser --session "$S" eval "[...document.querySelectorAll('button')].find(b=>/Accept All|Reject Non-Essential/i.test(b.textContent))?.click()" >/dev/null 2>&1
    sleep 1
    RES=$(agent-browser --session "$S" eval "
      const sw=document.documentElement.scrollWidth, cw=document.documentElement.clientWidth;
      JSON.stringify({overflow: sw>cw, sw, cw});
    " 2>/dev/null | tail -1)
    printf '  %sx%s  %-22s %s\n' "$W" "$H" "$r" "$RES"
    agent-browser --session "$S" screenshot "/home/z/my-project/download/$(echo "$S"|sed 's/^p5f-//').png" >/dev/null 2>&1
    agent-browser --session "$S" close >/dev/null 2>&1
  done
done
echo ""
echo "=== screenshot non-blank check (sample) ==="
python3 -c "
from PIL import Image, glob
for p in sorted(glob.glob('/home/z/my-project/download/*blog*engineering-logic*.png'))[:6]:
    im=Image.open(p).convert('L'); h=im.histogram(); r=1-h[255]/sum(h)
    print(f'  {p.split(\"/\")[-1]}: {im.size} non-white={r:.3f} {\"OK\" if r>0.05 else \"BLANK!\"}')
"