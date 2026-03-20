idea0: Remove unnecessary polyfills
- Target is modern Chrome, remove unneeded core-js polyfills
- Fix babel targets

idea1: Remove client-side API validation
- Check if DB ORM schema files are bundled into client
- Replace with type-only imports + type assertions

idea2: Replace CSS-replaceable libraries
- Animation libraries → View Transitions API
- Text truncation libraries → CSS line-clamp
- Any other JS-only wrapper replaceable with CSS

idea3: Reduce API response size
- Find heavy endpoints with deeply nested queries
- Drop unused fields, add limits where only partial data is used
- Especially check for large text fields (description etc.) bloating responses

idea4: Fix SSR
- Check if renderToString() result is actually sent in HTML response
- If not, wire it up to improve FCP

idea5: Remove unnecessary preload tags
- Check if HTML contains excessive preload tags
- Remove ones that aren't needed for initial render

idea6: Suppress unnecessary re-renders
- Check for global pointer/mouse tracking causing full re-renders
- Fix state management selectors if subscribing to entire store
- Replace polling (setInterval) with event-driven updates where possible

idea7: Check for intentional response bloat
- Check large streaming/playlist responses for padding or random data
- Remove if found

idea8: Deduplicate video player libraries
- Check if multiple player libraries are bundled
- Keep only the lightest one

idea9: Add DB indexes
- Check for missing indexes on frequently queried columns

idea10: Image lazy loading + CLS fix
- Add loading="lazy" to off-screen images
- Add aspect-ratio to prevent layout shift
- Check if image URLs have cache-busting params that break caching
