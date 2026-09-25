# Hanzi Writer integration

A shared, lazy-loaded wrapper around [Hanzi Writer](https://hanziwriter.org/). It loads the library only when a character canvas is mounted. Character stroke data is fetched by Hanzi Writer from its data CDN on demand, so the first use of a character requires an internet connection.

## Import

```tsx
import { HanziWriterCanvas } from "@/lib/HanziWriter";
```

## Examples

Show a character:

```tsx
<HanziWriterCanvas character="你" mode="static" width={180} height={180} />
```

Animate stroke order:

```tsx
<HanziWriterCanvas character="好" mode="animate" />
```

Let the learner draw the character:

```tsx
<HanziWriterCanvas
  character="我"
  mode="quiz"
  onComplete={({ totalMistakes }) => {
    // Update lesson progress here.
  }}
/>
```

Modes: `static`, `animate`, `quiz`. For colors and additional Hanzi Writer settings, pass `options`. Use `onReady` to access the writer instance (e.g. to call `animateCharacter()`, `loopCharacterAnimation()`, or `updateColor()`).

## License notes

Hanzi Writer JavaScript is MIT-licensed. Character stroke data is distributed separately and is derived from Make Me a Hanzi / Arphic sources under their respective licenses. This wrapper loads the library from jsDelivr and character data from Hanzi Writer's configured data source; it does not copy third-party source or the complete character database into this repository.

- Library: https://github.com/chanind/hanzi-writer
- Data: https://github.com/chanind/hanzi-writer-data
- Original data project: https://github.com/skishore/makemeahanzi
