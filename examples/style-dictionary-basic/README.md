# Style Dictionary Font Example

Demonstrates `@gamesome/style-dictionary-font` with three variable fonts defined as design tokens:

- **Rubik Variable** (sans-serif) — applied to `html`
- **Sora Variable** (sans-serif) — applied to `.font-sora`
- **Lora Variable** (serif) — applied to `.font-lora`

Uses Style Dictionary v4 to generate `@font-face` CSS from token definitions in `src/tokens/fonts.json`. The React + Vite app lets you switch between fonts and see the same comparison showcase as the Astro example.

## Running

```bash
pnpm install
pnpm dev
```

This runs `build-tokens.mjs` (generating CSS + copying font files) then starts the Vite dev server.
