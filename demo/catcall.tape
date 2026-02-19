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

# ── Tagged: screaming ────────────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 100 -H 100 screaming"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-screaming.png

Sleep 500ms

# ── Tagged: scared ───────────────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 100 -H 100 scared"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-scared.png

Sleep 1s
