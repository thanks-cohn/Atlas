# Offline pinboard typography

Dark appearance uses Rajdhani SemiBold for headings and Space Grotesk variable for body/controls. The CSS family aliases are Atlas Rajdhani and Atlas Space Grotesk; internal font names are unchanged. Light appearance retains existing typography. Font display uses swap and system fallback; no remote stylesheet, font request or new CSP permission is required.

Sources: Google Fonts repository, downloaded 2026-10-18:

- https://github.com/google/fonts/blob/main/ofl/rajdhani/Rajdhani-SemiBold.ttf — Git blob `d43750bd05c130d36c8e7fbeb06ecd7c5d3c3b17`.
- https://github.com/google/fonts/blob/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf — Git blob `a1b2e6c26093066510a31147e7aec9abdc8d6c5e`.

Source bytes were verified against those Git blob hashes, and bundled without modification. Original SIL Open Font License notices are adjacent in `rajdhani-OFL.txt` and `spacegrotesk-OFL.txt`. Preserve them with distribution. Combined TTF files are approximately 515 KiB; no font framework or runtime dependency is added.
