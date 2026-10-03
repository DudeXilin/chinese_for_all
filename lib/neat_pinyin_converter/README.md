# Neat Pinyin Converter

Dependency-free client-side utility for converting keyboard-friendly Pinyin into standard tone-marked Pinyin.

Examples:
- peng2 -> péng
- bu2ke4qi -> búkèqi
- ping2guo3 -> píngguǒ
- you3 -> yǒu
- gui3 -> guǐ
- nv3 -> nǚ
- lv4 -> lǜ
- de5 -> de

Tone placement follows standard Pinyin orthography:
1. a takes the mark before other vowels.
2. Otherwise e takes the mark.
3. In ou, o takes the mark.
4. Otherwise the final vowel takes the mark.

v/V are accepted as keyboard aliases for ü. u: is accepted as well.

The converter preserves unnumbered text, so it can safely run on every keystroke of a controlled input.
