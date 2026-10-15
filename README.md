# ATLAS — Universal Resource & Relationship Explorer

ATLAS is a **browser-first, native-capable, local-first explorer** that unifies user-authorized local files, Cloudflare R2, bookmarks, saved webpages, archives and connected application resources. Users organize them with text, tags, user-defined catalogs and cluster pairings, independent of physical storage locations.

**Delivery direction:** Chrome Manifest V3 extension + authenticated loopback API + separately installed Python native companion bundled with **PyInstaller**, using Chrome Native Messaging for waking/reconnecting as appropriate. Windows/Linux applications and Android may implement the same contracts through platform-appropriate mechanisms.

**Important:** PyInstaller eliminates the user's need to install Python; it does **not** authorize a Chrome Web Store extension to silently install or execute a downloaded program. ATLAS should emulate Chute's convenient **one-time user-consented installation and subsequent wake/reconnect**, not claim otherwise. Chrome Web Store eligibility is a design requirement, not an approval guarantee.

Start with [docs/forever-works/README.md](docs/forever-works/README.md).

**Stage:** P001 architecture and foundations; executable implementation and behavioral proof are future work.

References: [Chute](https://github.com/thanks-cohn/chute), [FileChute](https://github.com/thanks-cohn/filechute), [Redown](https://github.com/thanks-cohn/remote-download-2-cloudfare), [Forever Works](https://github.com/thanks-cohn/forever-works), [Any-Shape](https://github.com/thanks-cohn/any-shape).
