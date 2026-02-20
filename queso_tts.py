#!/usr/bin/env python3
"""
queso_tts.py — Convert a Queso bookmark snapshot to an MP3 audio file via OpenAI TTS.

Usage:
    python queso_tts.py <bookmark_id>
    python queso_tts.py --search "title keywords"
    python queso_tts.py 696 --voice shimmer --output my-article.mp3

Requirements:
    pip install requests
    export QUESO_TOKEN=...
    export OPENAI_API_KEY=...

Optional (for multi-chunk articles):
    ffmpeg must be on PATH to concatenate audio chunks
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile

import requests

QUESO_BASE = "https://quesobookmarks.com/api/v1"
OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
MAX_CHARS = 4000  # OpenAI TTS limit is 4096; keep a small buffer


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def get_queso_token():
    token = os.environ.get("QUESO_TOKEN")
    if not token:
        sys.exit("Error: QUESO_TOKEN environment variable is not set.")
    return token


def get_openai_key():
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("Error: OPENAI_API_KEY environment variable is not set.")
    return key


# ---------------------------------------------------------------------------
# Bookmark fetching
# ---------------------------------------------------------------------------

def fetch_bookmark_by_id(bookmark_id, token):
    r = requests.get(
        f"{QUESO_BASE}/bookmarks/{bookmark_id}/",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["data"]


def fetch_bookmark_by_search(query, token):
    r = requests.get(
        f"{QUESO_BASE}/bookmarks/",
        headers={"Authorization": f"Bearer {token}"},
        params={
            "search": query,
            "fields[]": ["id", "title", "snapshot", "estimated_time"],
            "limit": 5,
        },
        timeout=30,
    )
    r.raise_for_status()
    results = r.json()["data"]
    if not results:
        sys.exit(f"No bookmarks found matching: {query!r}")

    if len(results) == 1:
        return results[0]

    print("Multiple matches — picking the closest:")
    for i, b in enumerate(results):
        print(f"  [{i+1}] (id:{b['id']}) {b['title']}")
    return results[0]


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

def clean_markdown(text):
    """Strip Markdown formatting so TTS reads clean prose."""
    # Remove fenced code blocks entirely — they don't speak well
    text = re.sub(r"```[\s\S]*?```", " ", text)
    # Inline code → bare text
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Images → nothing
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    # Links → just the link text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    # Headings → text only (strip leading #s)
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    # Bold / italic
    text = re.sub(r"\*{1,3}([^*\n]+)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,3}([^_\n]+)_{1,3}", r"\1", text)
    # Horizontal rules
    text = re.sub(r"^[-*_]{3,}\s*$", "", text, flags=re.MULTILINE)
    # HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Collapse runs of blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_text(text, max_chars=MAX_CHARS):
    """Split text into chunks ≤ max_chars, breaking at sentence boundaries."""
    chunks = []
    while len(text) > max_chars:
        # Prefer splitting after a period + space
        split_at = text.rfind(". ", 0, max_chars)
        if split_at == -1:
            split_at = text.rfind("\n", 0, max_chars)
        if split_at == -1:
            split_at = max_chars
        else:
            split_at += 1  # include the period
        chunks.append(text[:split_at].strip())
        text = text[split_at:].strip()
    if text:
        chunks.append(text)
    return chunks


# ---------------------------------------------------------------------------
# TTS generation
# ---------------------------------------------------------------------------

def tts_chunk(text, index, total, openai_key, voice):
    """Call OpenAI TTS for one text chunk, return MP3 bytes."""
    print(f"  Generating part {index + 1}/{total} ({len(text):,} chars)...")
    r = requests.post(
        OPENAI_TTS_URL,
        headers={
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json",
        },
        json={"model": "tts-1-hd", "input": text, "voice": voice},
        timeout=120,
    )
    r.raise_for_status()
    return r.content


# ---------------------------------------------------------------------------
# MP3 assembly
# ---------------------------------------------------------------------------

def save_mp3(mp3_parts, output_path):
    """Write one or more MP3 byte-parts to a single output file."""
    if len(mp3_parts) == 1:
        with open(output_path, "wb") as f:
            f.write(mp3_parts[0])
        return

    # Multiple parts — concatenate via ffmpeg
    print(f"  Concatenating {len(mp3_parts)} parts with ffmpeg...")
    with tempfile.TemporaryDirectory() as tmpdir:
        part_paths = []
        for i, data in enumerate(mp3_parts):
            p = os.path.join(tmpdir, f"part_{i:04d}.mp3")
            with open(p, "wb") as f:
                f.write(data)
            part_paths.append(p)

        list_path = os.path.join(tmpdir, "list.txt")
        with open(list_path, "w") as f:
            for p in part_paths:
                f.write(f"file '{p}'\n")

        subprocess.run(
            [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0",
                "-i", list_path,
                "-c", "copy",
                output_path,
            ],
            check=True,
            capture_output=True,
        )


# ---------------------------------------------------------------------------
# Filename helpers
# ---------------------------------------------------------------------------

def slugify(title):
    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    return slug[:60]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Convert a Queso bookmark snapshot to an MP3 via OpenAI TTS."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("id", nargs="?", metavar="BOOKMARK_ID", help="Bookmark ID")
    group.add_argument("--search", "-s", metavar="QUERY", help="Search by title keywords")
    parser.add_argument(
        "--voice", "-v",
        default="nova",
        choices=["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        help="OpenAI TTS voice (default: nova)",
    )
    parser.add_argument("--output", "-o", metavar="FILE", help="Output MP3 path")
    args = parser.parse_args()

    token = get_queso_token()
    openai_key = get_openai_key()

    # --- Fetch ---
    if args.search:
        print(f'Searching: "{args.search}"')
        bookmark = fetch_bookmark_by_search(args.search, token)
    else:
        print(f"Fetching bookmark {args.id}...")
        bookmark = fetch_bookmark_by_id(args.id, token)

    title = bookmark.get("title") or "article"
    snapshot = bookmark.get("snapshot") or ""
    est = bookmark.get("estimated_time")
    print(f'Article : "{title}"')
    if est:
        print(f"Est. read: {est} min")

    if not snapshot:
        sys.exit("Error: this bookmark has no saved snapshot text.")

    # --- Clean & chunk ---
    text = clean_markdown(snapshot)
    chunks = chunk_text(text)
    print(f"Text    : {len(text):,} chars → {len(chunks)} chunk(s)")

    # --- Generate audio ---
    mp3_parts = []
    for i, chunk in enumerate(chunks):
        mp3_parts.append(tts_chunk(chunk, i, len(chunks), openai_key, args.voice))

    # --- Save ---
    output = args.output or f"{slugify(title)}.mp3"
    save_mp3(mp3_parts, output)

    size_kb = os.path.getsize(output) // 1024
    print(f"\nSaved : {output} ({size_kb:,} KB)")


if __name__ == "__main__":
    main()
