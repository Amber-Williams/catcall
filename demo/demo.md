# catcall

Display random cats from [CATAAS](https://cataas.com) as high-resolution ASCII art in the **#justparchment8** 8-colour parchment palette. Half-block Unicode characters (`▀`) pack two pixels into every terminal row for double vertical resolution.

## Install

```bash
pip install catcall
```

## Usage

```
usage: catcall [-h] [-w WIDTH] [-H HEIGHT_PX] [--no-fit]
               [--margin-cols MARGIN_COLS] [--margin-rows MARGIN_ROWS]
               [--no-square]
               [tags ...]

Show a high-res ASCII cat using the #justparchment8 palette (auto-fits to
terminal).

positional arguments:
  tags                  Optional tags (cute, orange, etc).

options:
  -h, --help            show this help message and exit
  -w WIDTH, --width WIDTH
                        Output width in characters (overrides auto-fit).
  -H HEIGHT_PX, --height-px HEIGHT_PX
                        Image height in pixels (overrides auto-fit)
  --no-fit              Disable auto-fit and use width/height as-is.
  --margin-cols MARGIN_COLS
                        Column margin when auto-fitting (default: 2).
  --margin-rows MARGIN_ROWS
                        Row margin when auto-fitting (default: 1).
  --no-square           When auto-fitting, use max rectangle instead of
                        square.
```

### Examples

```bash
catcall                          # random cat, auto-fits to terminal
catcall cute                     # filter by CATAAS tag
catcall -w 100 -H 100 blep      # explicit size + tag
catcall -w 100 -H 100 zoomies
catcall --no-square sleeping     # fill full width × height
```

## Gallery

### Intro video

<video src="intro.mp4" controls width="100%"></video>

### Animated demo

![catcall demo](catcall.gif)

### Screenshots

| Command | Preview |
|---|---|
| `catcall` | ![auto-fit random cat](screenshot-simple.png) |
| `catcall -w 100 -H 100` | ![100×100 explicit size](screenshot-w100.png) |
| `catcall -w 100 -H 100 blep` | ![blep tagged cat](screenshot-blep.png) |
| `catcall -w 100 -H 100 zoomies` | ![zoomies tagged cat](screenshot-zoomies.png) |
