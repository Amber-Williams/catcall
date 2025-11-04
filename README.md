# catcall
**catcall** is a command‐line tool that displays a random cat from [CATAAS](https://cataas.com) as high‐resolution ASCII art, beautifully quantized to the eight‑colour [#justparchment8](https://lospec.com/palette-list/justparchment8) palette.

<p align="center">
  <img src="https://github.com/user-attachments/assets/5ebdefea-46f8-42ea-8133-9411729b1e60" width="600" />
</p>


## Installation

### Using pipx (recommended)

The easiest way to install `catcall` is with [pipx](https://pipx.pypa.io/), which installs the tool in an isolated environment:

```bash
pipx install catcall
```

### Using pip

You can also install with pip:

```bash
pip install catcall
```

### From source

Clone the repository and install in development mode:

```bash
git clone https://github.com/amberstarlight/catcall.git
cd catcall
pip install -e .
```

## Usage

### Basic usage

Display a random cat that auto‐fits your terminal:

```bash
catcall
```

### With tags

Request specific types of cats using CATAAS tags:

```bash
catcall cute
catcall orange cute
catcall sleeping
```

### Size options

Override auto‐fit with specific dimensions:

```bash
# Set width in characters
catcall -w 80

# Set height in pixels (remember: 2 pixels per terminal row)
catcall -H 160

# Disable auto-fit and use exact dimensions
catcall -w 80 -H 160 --no-fit
```

### Layout options

```bash
# Use maximum rectangular fit instead of square
catcall --no-square

# Adjust margins when auto-fitting
catcall --margin-cols 4 --margin-rows 2
```

## How it works

`catcall` uses half‐block characters (`▀`) to achieve double the vertical resolution of standard character‐based rendering. Each terminal cell displays two pixels—one as the foreground colour and one as the background—effectively turning your 80×24 terminal into a 80×48 pixel canvas.

The image is quantized to the #justparchment8 palette using perceptually‐weighted colour distance in linear sRGB space, giving the output a distinctive parchment aesthetic.

## Requirements

- Python 3.8 or later
- A terminal with true‐colour (24‐bit) support
- The `requests` and `Pillow` libraries (installed automatically)

## Credits

- Cat images courtesy of [CATAAS](https://cataas.com)
- Colour palette: [#justparchment8 by AdigunPolack](https://lospec.com/palette-list/justparchment8)

🐱
