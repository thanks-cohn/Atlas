# Cold-agent inheritance and reconstitution protocol

**Purpose:** make ATLAS reconstructible from archived engineering meaning and independently verifiable evidence, rather than relying on original authors, agents, languages or frameworks.

## Inheritance packet requirements

The project's canonical Forever Works corpus (to be implemented) should be organized into small individually addressable records with stable IDs and revision lineage. Maintain an index to **purpose, capabilities, invariants, constraints, dependencies, decisions, compatibility boundaries, implementations, evidence and migrations**. Record explicit provenance and confidence. Model interfaces **between** components as first-class contract interactions, including grant transfer prohibitions, state authority, failure semantics and alternate deployment patterns.

A reconstruction package should contain, or checksum-pin: normative standard/profile versions; complete accepted records; source-of-truth policy; portable schema and fixtures; data migrations; threat model; independent test harness/oracles; relevant hardware/OS requirements; signed/checksummed release artifacts where available; bibliography of historical implementations and decisions; and known gaps. Original source remains valuable evidence but is not required for the blinded reconstruction condition.

## Reconstruction algorithm, tool-neutral

1. **Read:** load the package, verify integrity, validate format/schema/references, enumerate unsupported profiles and unresolved authority.
2. **Explain:** trace for each capability WHY it exists, observable promises, who holds state and permissions, and dependent components.
3. **Partition:** classify fixed invariants, bounded variations and freely replaceable mechanisms at the chosen platform/version.
4. **Design:** propose a new implementation satisfying obligations under target hardware and OS. Explicitly mark non-equivalent permissions/features.
5. **Implement:** construct the smallest real vertical slice and any necessary adapters. Do not merely redraw the old UI or transliterate code.
6. **Verify:** execute independently held-out positive/negative, security, state, lifecycle and target-runtime tests; assign PASS/FAIL/UNKNOWN per obligation.
7. **Migrate:** compare exported data, identifiers, relations, grants and secrets, verifying zero unauthorized privilege inheritance.
8. **Record:** archive design decisions, new implementation digests, actual evidence and unresolved gaps; never overwrite history to make the replacement look complete.

## Hard cold-agent experiment

Provide the package to an agent lacking the original implementation and its development chats. Ask it to reconstruct a subsystem in a different language (e.g. the catalog graph or the local capability bridge). Test against hidden cases for identity persistence, revoked grants, symlink escape and crash recovery. Compare with source-only and ordinary-documentation controls. Success must include real effects, not only compilation.

## Century-scale design commitments, not guarantees

Open portable text formats, checksummed and version-pinned dependencies, optional modular profiles, local-first ownership, explicit migration/compatibility versions, readable semantics and negative evidence can **improve odds of survival across technological generations**. No finite corpus or test suite can guarantee a future century of compatibility, safe autonomous rebuilds or operating-system support. Treat unsupported new conditions as research and migration work.
