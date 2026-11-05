# Archived theme directions

The previous theme-specific overview layouts are also preserved in `alternate-layouts-v1.mjs` and `alternate-layouts-v1.css`. They were retired in favour of one shared interface across all three active themes. Bionic's current generated artwork remains active inside the shared result panel.

Royal Purple, Silverbolt and Moonshine were hidden at the user's request on 4 November 2026. Black Metal (default), Blood Moon and Bionic are the only active themes. Futuristic was renamed Bionic and refined with leaf-and-circuit motifs.

This directory is retained in Git and excluded from the public app bundle. It contains complete snapshots of the six-theme registry/controller (`theme-system.mjs`), overview compositions (`theme-home.mjs`), and stylesheet (`themes.css`) immediately before the reduction. These files are design references, not active application imports. `assets/` preserves the selected, generated WebP resources without re-encoding.

| Direction | Selected version | Asset |
| --- | --- | --- |
| Royal Purple | Second set: amethyst folds and champagne edges | `assets/theme-royal.webp` |
| Silverbolt | Third set: graphite/platinum | `assets/theme-silverbolt.webp` |
| Moonshine | Third set: pearl/lilac, plum rail | `assets/theme-moonshine.webp` |

Exact image prompts remain in `../theme-art-prompts.json`. Existing self-hosted fonts remain available in `public/assets/fonts/` for the active themes.

To revisit a direction, selectively restore its registry entry, palette and component rules, overview artwork mapping, and WebP in `public/assets/`. The snapshots still reference their former public asset paths. Add its symbol to `app/shell.ts`; preserve the current minimal picker and Bionic preference migration rather than replacing the active controller wholesale. Check all assessment views, persistence, input retention, reduced motion, and responsive layouts before publication.

Retained SVG paths (24 × 24, 1.5 px stroke, no fill):

```js
const archivedSymbols = {
  royal: '<path d="m3 7 4 3 5-6 5 6 4-3-2 12H5Z"/><path d="M5 16h14"/>',
  bolt: '<path d="m14 2-10 12h7l-1 8 10-12h-7Z"/>',
  moonshine: '<path d="M19 14a7 7 0 0 1-9-9 8 8 0 1 0 9 9Z"/><path d="m18 2 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/>',
};
```
