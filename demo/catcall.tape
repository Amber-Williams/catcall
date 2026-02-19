# VHS tape: catcall CLI demo
# Generates demo/catcall.gif and demo screenshots

Output demo/catcall.gif

Set Shell      bash
Set FontSize   20
Set Width      1400
Set Height     1200
Set Padding    8
Set TypingSpeed 80ms

# ── Plain catcall (auto-fit to terminal) ────────────────────────────────────
Type "catcall"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-simple.png

Sleep 1s

# ── Explicit size ─────────────────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 100 -H 100"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-w100.png

Sleep 500ms

# ── Tagged: blep ─────────────────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 100 -H 100 blep"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-blep.png

Sleep 500ms

# ── Tagged: zoomies ──────────────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 100 -H 100 zoomies"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-zoomies.png

Sleep 1s
