# VHS tape: catcall CLI demo
# Generates demo/catcall.gif and demo screenshots

Output demo/catcall.gif

Set Shell      bash
Set FontSize   16
Set Width      700
Set Height     450
Set Padding    8
Set TypingSpeed 80ms

# ── Help ────────────────────────────────────────────────────────────────────
Type "catcall --help"
Sleep 500ms
Enter
Sleep 1s
Screenshot demo/screenshot-help.png

Sleep 1s

# ── Basic cat (tiny, fast) ───────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 20 -H 20"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-basic.png

Sleep 500ms

# ── Tagged cat ──────────────────────────────────────────────────────────────
Ctrl+L
Type "catcall -w 20 -H 20 cute"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-cute.png

Sleep 500ms

# ── No-square (rectangular fit preview) ──────────────────────────────────────
Ctrl+L
Type "catcall -w 20 -H 20 --no-square orange"
Sleep 500ms
Enter
Sleep 5s
Screenshot demo/screenshot-no-square.png

Sleep 1s
