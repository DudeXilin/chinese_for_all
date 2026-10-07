# Make Me a Hanzi data

This folder contains the Make Me a Hanzi dictionary data used by Chinese For All.

Included:
- Pinyin
- learner-oriented definitions
- IDS character decomposition
- etymology
- radical data
- a TypeScript IDS parser and character-data API

The original Make Me a Hanzi dictionary is newline-delimited JSON. `dictionary.txt` is preserved here as the source database, while `dictionary.json` is a compact runtime representation keyed by character.

The source project:
https://github.com/skishore/makemeahanzi

Source data:
- dictionary.txt is derived from Unihan and CJKlib.
- The source project distributes dictionary.txt under the GNU LGPL v3 or later.

The graphics/stroke data from Make Me a Hanzi are intentionally not copied here because Chinese For All already uses HanziWriter for character animation.

The IDS parser follows the Unicode Ideographic Description Sequence grammar and supports the Make Me a Hanzi operators, including the binary, ternary, unary, and subtraction operators.

