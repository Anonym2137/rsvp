These three Lottie illustrations were authored for RSVP Reader during the redesign. They contain only vector shape layers, have no external images or fonts, and require no attribution to a third-party asset library. They are covered by this repository's license.

- `book.json`: violet and mint open book, used only in empty states.
- `loading.json`: compact violet, mint, and amber pulse, used only while loading.
- `completion.json`: mint completion badge and amber/violet celebration, played once.

`components/StateAnimation.tsx` owns reduced-motion, navigation focus, background state, and failure handling. Word playback never mounts an animation.
