The main.js bundle is 85MB, likely because @ffmpeg/core (wasm) is being bundled.

1. Investigate what @ffmpeg is used for in the client code
2. If it's used for runtime media processing, externalize it from webpack and load from CDN instead
3. If it's not needed at runtime (e.g. only used at build time), remove it from the client bundle entirely

Goal: reduce main.js from 85MB to something reasonable.
