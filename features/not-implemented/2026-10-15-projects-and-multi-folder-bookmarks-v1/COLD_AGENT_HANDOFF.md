# Cold-agent inheritance
1. Read `AGENTS.md`, canonical `forever/manifest.json`, latest status/evidence, the 2026-10-15 Atlas knowledge package, then this standalone proposal. Do not infer any implementation from these records.
2. Preserve stable existing resource graph IDs and provider-authority boundaries; identify source migration requirements before coding.
3. Implement multiple folder memberships as normalized relationships, not copies of bookmarks. Test adds/removals, same-URL edge cases, consistency, undo and provider import/export behavior.
4. Implement Projects as selection + template + ordered non-destructive presentation blocks. Place connected bookmarks beneath their images by default; don't invent edges. Keep user overrides and snapshots explicit.
5. Build accessible preview, edit, public-filter, HTML export and independent JSON conformance with real fixtures. Document negative tests for private membership edge leakage.
6. Mark test statuses with reproducible evidence only after execution. Ensure staging and production-value acceptance before **appending** accepted records to canonical Forever Works manifest. Never remove old historical records; for amendments create new dated packages and explicit predecessor links.
