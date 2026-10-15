# Optional Linux recovery supervisor

The supervisor is optional, runs as the same OS user, and does not pair extensions, mint credentials, grant folders, execute shell commands or change power policy. Native Messaging demand-wake remains independent when supervision is disabled.

Fixed obligations are authenticated recovery, preserved grants/revocation and no unrelated process termination. Scheduling and Linux systemd are replaceable mechanisms. This implementation only establishes Linux process behavior; Windows, real logon/reboot, suspend/resume and hardware wake remain separate proof gates.

## Explicit opt-in and removal

After explicitly installing/enrolling the intended extension, run from the checkout:

```
PYTHONPATH=src python -m atlas_companion.supervisor --extension-id YOUR_ID enable --consent
PYTHONPATH=src python -m atlas_companion.supervisor --extension-id YOUR_ID status
PYTHONPATH=src python -m atlas_companion.supervisor --extension-id YOUR_ID disable
PYTHONPATH=src python -m atlas_companion.supervisor --extension-id YOUR_ID uninstall
```

Place `--state-dir PATH` before the action to use a nondefault private state directory. The same state directory and extension identity must match the native installation. `enable --consent` installs a per-user `${XDG_CONFIG_HOME:-~/.config}/systemd/user/atlas-supervisor.service` unit and uses `systemctl --user enable --now`. No system service, administrator elevation, lingering, wake timer or sleep inhibitor is installed. A functioning user systemd manager is required; failures are reported, never converted into a success claim. The source checkout and Python must stay in place unless using a tested standalone bundle.

`disable` stops and disables only supervision; it preserves the native host, companion and all durable state. `uninstall` additionally removes this matching startup unit. A unit belonging to another installation is not overwritten or removed. Neither action deletes grants, catalogs, receipts or pairing. Revoke authorization through the companion's trusted management UI/CLI. Systemd `KillMode=process` avoids killing the independently useful companion when the supervisor stops. No processes execute while a machine is suspended, hibernated or powered off; the polling loop resumes when the OS runs it again.

For foreground diagnosis, replace the action with `run`; default healthy polling interval is ten seconds. The supervisor uses one two-second bounded HMAC proof request per tick, with one-second polling while its owned child is starting, capped failure polling up to sixty seconds for unavailable/foreign services, and capped restart backoff. It never transmits a bearer token. A private advisory lock ensures one supervisor per state directory; a separate service lock protects helper startup. Lock files are never unlinked during normal exit, avoiding inode-replacement races.

Recovery distinguishes connection refusal from an unverified listener. Refusal can trigger a fixed-argv companion launch. Invalid proof, foreign port listeners and unowned hung processes produce `NEEDS_REPAIR`; the supervisor never scans process names or kills processes inferred from PID files. Only a still-owned direct `Popen` child may be stopped after repeated failed proofs and a startup grace period; it is terminated, waited, and if necessary killed with a bounded wait before replacement. This deliberately leaves an unresponsive companion started by another supervisor instance/native host for explicit user repair rather than risking unrelated termination. Revoked extension identity yields `NEEDS_PAIRING` without re-enrollment or new authority.

## Executed proof and limits

`PYTHONPATH=src python -m unittest discover -s tests -p test_supervisor.py -v` exercises real helper kill/restart with unchanged bytes, grants and existing token; authenticates health after recovery; confirms revoked roots stay revoked; freezes a directly owned helper with SIGSTOP and verifies bounded recovery; proves native demand-wake with no supervisor loop; tests restart limits, impostor listener non-disclosure/no termination, private single-instance locks and reversible startup-unit generation. Systemd operations in the unit-generation test are mocked, so actual login/startup/resume and systemd enable/disable execution remain NOT_RUN until separately evidenced on an appropriate desktop. These tests do not establish actual Chrome Native Messaging callback behavior or production security.
