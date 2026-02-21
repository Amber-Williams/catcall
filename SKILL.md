# Queso Bookmarks API Skill

Use this skill to query and act on your Queso Bookmarks data via the REST API.

## Setup

Export your API token before running any commands:

```bash
export QUESO_TOKEN="your_api_token_here"
```

All requests use:

- **Base URL:** `https://quesobookmarks.com/api/v1`
- **Auth header:** `Authorization: Bearer $QUESO_TOKEN`
- **Content-Type:** `application/json`

### Available bookmark fields

`id`, `date_created`, `date_updated`, `title`, `link`, `author`, `estimated_time`, `is_quote`, `is_til`, `tags`, `read`, `notes`, `snapshot`, `meta_image`, `source_type`, `source_id`

---

## Use cases

### Get bookmarks by tag

Retrieve all bookmarks tagged with a specific label (e.g. `design`):

```bash
curl -s -G "https://quesobookmarks.com/api/v1/bookmarks" \
  -H "Authorization: Bearer $QUESO_TOKEN" \
  --data-urlencode "filter[tags][_contains]=design" \
  --data-urlencode "fields[]=id" \
  --data-urlencode "fields[]=title" \
  --data-urlencode "fields[]=link" \
  --data-urlencode "fields[]=tags" \
  --data-urlencode "fields[]=read" \
  --data-urlencode "fields[]=estimated_time" \
  --data-urlencode "sort=-date_created" \
  --data-urlencode "limit=50"
```

Filter by multiple tags using `_and`:

```bash
curl -s -G "https://quesobookmarks.com/api/v1/bookmarks" \
  -H "Authorization: Bearer $QUESO_TOKEN" \
  --data-urlencode "filter[_and][0][tags][_contains]=design" \
  --data-urlencode "filter[_and][1][tags][_contains]=typography" \
  --data-urlencode "fields[]=title" \
  --data-urlencode "fields[]=link" \
  --data-urlencode "fields[]=tags"
```

When asked to **get bookmarks by tag**, query with `filter[tags][_contains]=<tag>`. Ask the user for the tag name if not provided. List results as a markdown table with title, link, tags, and read status.

---

### Review notes

Retrieve bookmarks where you have written personal notes:

```bash
curl -s -G "https://quesobookmarks.com/api/v1/bookmarks" \
  -H "Authorization: Bearer $QUESO_TOKEN" \
  --data-urlencode "filter[notes][_nempty]=true" \
  --data-urlencode "fields[]=id" \
  --data-urlencode "fields[]=title" \
  --data-urlencode "fields[]=link" \
  --data-urlencode "fields[]=notes" \
  --data-urlencode "fields[]=tags" \
  --data-urlencode "fields[]=date_created" \
  --data-urlencode "sort=-date_updated" \
  --data-urlencode "limit=100"
```

To search within notes for a specific topic:

```bash
curl -s -G "https://quesobookmarks.com/api/v1/bookmarks" \
  -H "Authorization: Bearer $QUESO_TOKEN" \
  --data-urlencode "search=machine learning" \
  --data-urlencode "filter[notes][_nempty]=true" \
  --data-urlencode "fields[]=title" \
  --data-urlencode "fields[]=notes" \
  --data-urlencode "fields[]=date_created"
```

When asked to **review notes**, fetch bookmarks with non-empty notes and present each as a section with: title as a heading, date saved, the note content, and a link to the original source. If the user provides a topic, add the `search` parameter. Summarise patterns or insights across the notes at the end.

---

### Generate a 30-minute newsletter

Fetch unread bookmarks that have a saved snapshot, then build a newsletter totalling approximately 30 minutes of reading time.

**Step 1 — Fetch candidates** (request more than you need to allow selection):

```bash
curl -s -G "https://quesobookmarks.com/api/v1/bookmarks" \
  -H "Authorization: Bearer $QUESO_TOKEN" \
  --data-urlencode "filter[_and][0][read][_eq]=false" \
  --data-urlencode "filter[_and][1][snapshot][_nnull]=true" \
  --data-urlencode "fields[]=id" \
  --data-urlencode "fields[]=title" \
  --data-urlencode "fields[]=link" \
  --data-urlencode "fields[]=author" \
  --data-urlencode "fields[]=estimated_time" \
  --data-urlencode "fields[]=snapshot" \
  --data-urlencode "fields[]=tags" \
  --data-urlencode "fields[]=meta_image" \
  --data-urlencode "sort=-date_created" \
  --data-urlencode "limit=100"
```

**Step 2 — Select articles totalling ~30 minutes:**

From the results, greedily pick articles in order of `date_created` (newest first) until their `estimated_time` values sum to approximately 30 minutes (acceptable range: 25–40 minutes). Prefer variety across tags when possible.

**Step 3 — Produce the newsletter** in this format:

```markdown
# Your Reading List — <today's date>
*Estimated reading time: <total> min*

---

## 1. <Title>
**By** <author> · **<estimated_time> min read** · <comma-separated tags>

<First 3–4 sentences of snapshot as a teaser>

[Read →](<link>)

---

## 2. ...
```

When asked to **generate a newsletter**, run steps 1–3 automatically. If fewer than 3 articles are available, inform the user and list what was found. Do not mark items as read unless the user explicitly asks.

---

### Generate TTS audio from a bookmark's snapshot

Use `queso_tts.py` to convert any bookmark's snapshot into a clean MP3 audio file via the OpenAI TTS API. The script handles Markdown cleaning, chunking for long articles, and automatic filename generation.

**Requirements:**

```bash
pip install requests
export QUESO_TOKEN="..."
export OPENAI_API_KEY="..."
# ffmpeg required on PATH only for articles that exceed 4,000 characters
```

**By bookmark ID:**

```bash
python queso_tts.py 696
# → saves: everything-i-know-about-good-api-design.mp3
```

**By title search:**

```bash
python queso_tts.py --search "api design"
# → finds the closest match, then generates audio
```

**Custom voice or output path:**

```bash
python queso_tts.py 696 --voice shimmer --output api-design.mp3
```

Available voices: `alloy`, `echo`, `fable`, `onyx`, `nova` (default), `shimmer`

**What the script does:**

1. Fetches the bookmark's `snapshot` field from the Queso API
2. Replaces each fenced code block with a spoken description via `gpt-4o-mini` — e.g. `[Ruby code that establishes a thread-safe tenant database connection pool]` — so listeners understand what the code does without hearing raw syntax read aloud
3. Strips remaining Markdown syntax (headings, links, bold, HTML) so the spoken text is clean prose
4. Splits the text into ≤ 4,000-character chunks at sentence boundaries (OpenAI TTS limit is 4,096 chars)
5. Calls `tts-1-hd` for each chunk
6. Concatenates all chunks into a single MP3 (requires `ffmpeg` if more than one chunk)
7. Saves to `<slugified-title>.mp3` unless `--output` is specified

When asked to **generate TTS audio** for a bookmark, first identify the bookmark (ask for a title, tag, or ID if not provided), then run:

```bash
python queso_tts.py --search "<title keywords>"
```

Report the output filename and file size when done.

---

## Query reference

### Filtering

```
filter[<field>][<operator>]=<value>
```

| Operator | Meaning |
|---|---|
| `_eq` | equals |
| `_neq` | not equals |
| `_contains` | contains substring / array item |
| `_ncontains` | does not contain |
| `_null` | field is null |
| `_nnull` | field is not null |
| `_empty` | field is empty string |
| `_nempty` | field is not empty string |
| `_gt` / `_gte` | greater than / or equal |
| `_lt` / `_lte` | less than / or equal |

Combine with `filter[_and][N][...]` or `filter[_or][N][...]`.

### Sorting

```
sort=date_created        # ascending
sort=-date_created       # descending
```

Sortable fields: `date_created`, `date_updated`, `title`, `read`, `estimated_time`

### Pagination

```
limit=50   # 1–100, default 50
page=2     # 1-based
```

Add `meta=total_count` or `meta=filter_count` to get counts in the response.

### Aggregation

```
aggregate[count]=id
aggregate[sum]=estimated_time
aggregate[avg]=estimated_time
```

---

## Extra use cases worth exploring

### Daily reading digest by topic

Each morning, pick a tag or keyword and surface the 5 most recently saved unread items for a focused reading session:

```bash
filter[tags][_contains]=<tag>&filter[read][_eq]=false&sort=-date_created&limit=5
```

### Reading stats dashboard

Use aggregations to understand your habits:

- Total bookmarks saved: `aggregate[count]=id`
- Total estimated reading time in backlog: `aggregate[sum]=estimated_time` + `filter[read][_eq]=false`
- Average article length: `aggregate[avg]=estimated_time`
- Breakdown by read vs unread: run twice with `filter[read][_eq]=true` and `false`

### TIL (Today I Learned) journal

Pull all `is_til=true` bookmarks, optionally filtered to a date range, and compile into a dated learning log. Works well as a weekly or monthly retrospective:

```bash
filter[is_til][_eq]=true&sort=-date_created&fields[]=title&fields[]=notes&fields[]=date_created
```

### Quote collection

Retrieve all `is_quote=true` entries and format as a styled quote book, grouped by tag or author. Useful for presentations, writing, or just reflection:

```bash
filter[is_quote][_eq]=true&fields[]=title&fields[]=author&fields[]=notes&fields[]=tags
```

### Stale backlog cleanup

Find bookmarks saved more than 90 days ago that are still unread, so you can decide whether to read or delete them:

```bash
filter[_and][0][read][_eq]=false&filter[_and][1][date_created][_lt]=<90-days-ago-ISO>
```

### Smart search across notes and content

Use `search=` for a cross-field keyword search (title, link, author, notes) to quickly resurface anything you half-remember saving:

```bash
search=<keyword>&fields[]=title&fields[]=link&fields[]=notes&fields[]=tags
```

### Export snapshot to Markdown or PDF

Fetch a snapshot and write it to a file for offline reading or archiving:

```bash
curl -s "https://quesobookmarks.com/api/v1/bookmarks/<ID>" \
  -H "Authorization: Bearer $QUESO_TOKEN" \
  | jq -r '"# " + .title + "\n\n" + .snapshot' > article.md
```

Convert to PDF with `pandoc article.md -o article.pdf` if pandoc is installed.

### Weekly reading report

At the end of each week, fetch bookmarks marked as read in the last 7 days and produce a brief summary of what you consumed, with notes where present:

```bash
filter[_and][0][read][_eq]=true&filter[_and][1][date_updated][_gte]=<7-days-ago-ISO>&sort=-date_updated
```
