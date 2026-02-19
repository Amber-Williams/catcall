#!/usr/bin/env bash
# create_demo.sh — Build an executable showboat demo document showcasing
# catcall, rodney, and showboat CLI features.
#
# Usage:
#   cd /home/user/catcall
#   bash demo/create_demo.sh

set -euo pipefail

DEMO="demo/demo.md"

# Start fresh
rm -f "$DEMO"

# ── Init ──────────────────────────────────────────────────────────────────────
showboat init "$DEMO" "CLI Tools Demo: catcall, showboat & rodney"

showboat note "$DEMO" \
"This document demos three command-line tools and was built with **showboat**.

- **[catcall](https://github.com/Amber-Williams/catcall)** — renders random cat images from [CATAAS](https://cataas.com) as ASCII art in the terminal
- **[rodney](https://github.com/simonw/rodney)** — automates a persistent headless Chrome browser from the shell
- **[showboat](https://github.com/simonw/showboat)** — creates executable, reproducible demo documents (this very document!)

Each section below runs real commands and captures their output."

# ── catcall ───────────────────────────────────────────────────────────────────
showboat note "$DEMO" \
"## catcall

catcall fetches random cat images from [CATAAS](https://cataas.com) and renders
them as high-resolution ASCII art using the **#justparchment8** 8-color parchment
palette. Half-block Unicode characters (\`▀\`) are used to pack two pixels into every
terminal row, giving double vertical resolution.

### Help"

showboat exec "$DEMO" bash "catcall --help"

showboat note "$DEMO" \
"### Random cute cat — 60 columns wide

Tags are passed as positional arguments and forwarded to the CATAAS API."

showboat exec "$DEMO" bash "catcall -w 60 cute"

showboat note "$DEMO" \
"### Random orange cat — 50 columns wide, rectangular fit

By default catcall crops to a square; \`--no-square\` uses the full rectangular fit."

showboat exec "$DEMO" bash "catcall -w 50 --no-square orange"

showboat note "$DEMO" \
"### Multiple tags — sleeping cat, 40 columns wide"

showboat exec "$DEMO" bash "catcall -w 40 sleeping"

# ── rodney ────────────────────────────────────────────────────────────────────
showboat note "$DEMO" \
"## rodney

rodney keeps a headless Chrome process running in the background. Each CLI
invocation connects via WebSocket, performs its action, and exits — leaving
Chrome alive for the next command. This makes multi-step shell automation fast
and stateful without per-invocation launch overhead.

### Help"

showboat exec "$DEMO" bash "rodney --help"

showboat note "$DEMO" \
"### Browser automation example

The snippet below shows a typical rodney workflow: launch Chrome, navigate to
a page, wait for it to stabilise, capture the title, take a screenshot, then shut
down. (Actual execution is skipped here because a display is not available in this
environment; the commands are shown for reference.)"

showboat note "$DEMO" \
"\`\`\`bash
# Launch headless Chrome
rodney start

# Navigate to the CATAAS website
rodney open https://cataas.com

# Wait for the page to finish loading
rodney waitstable

# Print the page title
rodney title

# Capture a screenshot
rodney screenshot demo/cataas-homepage.png

# Shut down Chrome
rodney stop
\`\`\`"

# ── showboat ──────────────────────────────────────────────────────────────────
showboat note "$DEMO" \
"## showboat

showboat builds markdown documents that interleave narrative, fenced code blocks,
and their captured output. The \`verify\` command re-runs every code block and diffs
the output, turning the document into a reproducible proof of work.

This document itself was built with showboat — see \`demo/create_demo.sh\`.

### Help"

showboat exec "$DEMO" bash "showboat --help"

showboat note "$DEMO" \
"### Recreating this document

Run \`showboat extract\` to see the exact sequence of showboat commands that built
this file:"

showboat exec "$DEMO" bash "showboat extract demo/demo.md --filename demo/demo.md"

showboat note "$DEMO" \
"---

*Built with [showboat](https://github.com/simonw/showboat) on $(date -u +%Y-%m-%d).*"
