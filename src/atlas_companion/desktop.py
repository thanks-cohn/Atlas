"""Trusted native enrollment and persistent-location management, never served by HTTP.

The model is UI-independent; every grant change requires explicit local consent.
Importing this module never opens windows or authorizes filesystem locations.
"""
import http.client
import os
import re
from pathlib import Path

from .security import APIError, require_platform
if os.name == 'nt':
    from .windows_state import WindowsState as State
else:
    from .state import State


def diagnose(state, port=17892):
    from atlas_native.__main__ import prove
    with state.connect() as db:
        origins = [row['origin'] for row in db.execute('SELECT origin FROM clients')]
    result = {'state': 'NEEDS_PAIRING', 'locations': len(state.grants()),
              'platform': getattr(state, 'platform', 'linux'), 'protocol': 'atlas.local.v1'}
    if not origins:
        result['message'] = 'Install and authorize your exact ATLAS extension identity.'
        return result
    connection = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
    try:
        # prove uses the current fixed-port contract; permit alternate test ports.
        import atlas_native.__main__ as native
        if port != native.PORT:
            import hashlib, hmac, json, secrets
            nonce = secrets.token_hex(32)
            expected = hmac.new(state.bootstrap_key(), f'atlas.native.v1:{nonce}:{port}'.encode(), hashlib.sha256).hexdigest()
            response = native.request(origins[0], '/v1/bootstrap-proof', {'nonce': nonce}, connection=connection)
            if not hmac.compare_digest(expected, response.get('proof', '')):
                raise ValueError('Companion identity mismatch')
        else:
            prove(state, origins[0], connection)
        result['state'] = 'READY'
        result['message'] = 'Verified local companion. Saved authorizations are available.'
    except (OSError, TimeoutError):
        result['state'] = 'OFFLINE'
        result['message'] = 'Companion is not running. Installed native wake can start it automatically.'
    except (ValueError, http.client.HTTPException):
        result['state'] = 'NEEDS_REPAIR'
        result['message'] = 'The local listener could not prove this installation. No credentials were sent.'
    finally:
        connection.close()
    return result


class Management:
    """Trusted-local controller; browser clicks cannot supply consent or paths."""
    def __init__(self, state):
        self.state = state

    def pairing_token(self, extension_id, *, consent=False):
        """Explicit local fallback; rotates one identity's token, never grants files."""
        if consent is not True:
            raise APIError('CONSENT_REQUIRED', 'Generate a token in the native companion.')
        return self.state.pair(extension_id)

    def authorize(self, path, *, writable=False, allow_broad=False, consent=False):
        if consent is not True:
            raise APIError('CONSENT_REQUIRED', 'Approve this location in the native companion.')
        return self.state.grant(path, writable=writable, allow_broad=allow_broad)

    def revoke(self, ident, *, consent=False):
        if consent is not True:
            raise APIError('CONSENT_REQUIRED', 'Confirm revocation in the native companion.')
        self.state.revoke_grant(ident)


def _window_main(state, advanced_mode=False):
    if os.name != 'nt':
        require_platform()
    os.umask(0o077)
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk
    model = Management(state)
    try:
        window = tk.Tk()
    except tk.TclError as exc:
        raise APIError('NO_DISPLAY', 'Open ATLAS Companion from your desktop session; a display is required.') from exc
    if os.name == 'nt':
        from .windows_entrypoint import _hide_owned_console
        _hide_owned_console()
    window.title('ATLAS Companion - Setup & Locations')
    window.geometry('820x640')
    window.minsize(660, 500)
    window.configure(background='#f5f7f6')
    style = ttk.Style(window)
    style.theme_use('clam')
    style.configure('TFrame', background='#f5f7f6')
    style.configure('TLabel', background='#f5f7f6', foreground='#233c34', font=('sans', 11))
    style.configure('Title.TLabel', font=('sans', 23, 'bold'))
    style.configure('TButton', padding=(12, 7), font=('sans', 10))
    frame = ttk.Frame(window, padding=24)
    frame.pack(fill='both', expand=True)
    ttk.Label(frame, text='ATLAS Companion', style='Title.TLabel').pack(anchor='w')
    ttk.Label(frame, text='Install once. Choose your locations. Keep control.', padding=(0, 7)).pack(anchor='w')
    tabs = ttk.Notebook(frame)
    tabs.pack(fill='both', expand=True, pady=12)
    locations = ttk.Frame(tabs, padding=14)
    setup = ttk.Frame(tabs, padding=14)
    recovery = ttk.Frame(tabs, padding=14)
    tabs.add(locations, text='Authorized locations')
    tabs.add(setup, text='Chrome connection')
    tabs.add(recovery, text='Recovery & diagnostics')
    manual = ttk.Frame(tabs, padding=14)
    tabs.add(manual, text='Manual pairing (debug)')
    ttk.Label(locations, text='Only locations listed here are available to your paired extension.', wraplength=700).pack(anchor='w', pady=(0, 12))
    tree = ttk.Treeview(locations, columns=('path', 'access'), show='headings', selectmode='browse', height=9)
    tree.heading('path', text='Location'); tree.heading('access', text='Access')
    tree.column('path', width=485); tree.column('access', width=125)
    tree.pack(fill='both', expand=True)
    status = tk.StringVar(value='No location is granted automatically.')
    write = tk.BooleanVar(value=False)
    ttk.Checkbutton(locations, text='Allow write operations for a new location (copy, move, rename and trash)', variable=write).pack(anchor='w', pady=10)
    buttons = ttk.Frame(locations); buttons.pack(fill='x')

    def refresh():
        tree.delete(*tree.get_children())
        for grant in state.grants():
            tree.insert('', 'end', iid=grant['id'], values=(grant['root'], 'Read & write' if grant['writable'] else 'Read only'))

    def show_error(exc):
        from .diagnostics import record, error_code
        record(state, 'NATIVE_MANAGEMENT', error_code(exc))
        messagebox.showerror('ATLAS Companion', str(exc), parent=window)

    def authorize_path(path):
        if not path:
            return
        mode = 'READ AND WRITE' if write.get() else 'READ ONLY'
        prompt = f'Authorize {mode} access to:\n\n{path}\n\nThis includes accessible subfolders and mounted contents. ATLAS never bypasses OS permissions. You can revoke access here.'
        if not messagebox.askyesno('Authorize location', prompt, parent=window):
            return
        try:
            try:
                model.authorize(path, writable=write.get(), consent=True)
            except APIError as exc:
                if exc.code != 'BROAD_CONSENT_REQUIRED':
                    raise
                if not messagebox.askyesno('Broad machine access', f'{path}\n\nThis is a home folder, whole volume or another broad location. It may expose personal or system files available to your account. Private ATLAS state is excluded.\n\nDeliberately authorize this broad scope?', parent=window):
                    return
                model.authorize(path, writable=write.get(), allow_broad=True, consent=True)
            status.set('Saved. This location remains authorized after restarts; no repeated folder picker is needed.')
            refresh()
        except (APIError, OSError) as exc:
            show_error(exc)

    def add():
        authorize_path(filedialog.askdirectory(title='Choose a location to authorize', parent=window, mustexist=True))

    def selected():
        values = tree.selection()
        if not values:
            messagebox.showinfo('Select a location', 'Choose a saved location first.', parent=window)
            return None
        return next((g for g in state.grants() if g['id'] == values[0]), None)

    def revoke():
        grant = selected()
        if grant and messagebox.askyesno('Revoke location', 'Remove ATLAS access to this location? Files and metadata will not be deleted.', parent=window):
            model.revoke(grant['id'], consent=True); refresh(); status.set('Location revoked. Future requests are denied.')

    def change_access():
        grant = selected()
        if not grant:
            return
        writable = not grant['writable']
        if not messagebox.askyesno('Change access', f"Change {grant['root']} to {'READ AND WRITE' if writable else 'READ ONLY'}?", parent=window):
            return
        try:
            model.authorize(grant['root'], writable=writable, allow_broad=True, consent=True)
            refresh(); status.set('Access updated. No existing root was silently expanded.')
        except (APIError, OSError) as exc:
            show_error(exc)

    ttk.Button(buttons, text='Add location...', command=add).pack(side='left')
    ttk.Button(buttons, text='Home folder...', command=lambda: authorize_path(str(Path.home()))).pack(side='left', padx=5)
    ttk.Button(buttons, text='Change read/write', command=change_access).pack(side='left', padx=5)
    ttk.Button(buttons, text='Revoke', command=revoke).pack(side='left')
    ttk.Label(locations, textvariable=status, wraplength=690).pack(anchor='w', pady=(12, 0))

    ttk.Label(setup, text='One-time browser enrollment', style='Title.TLabel').pack(anchor='w', pady=(0, 12))
    ttk.Label(setup, text='Load the ATLAS extension, copy its exact ID from chrome://extensions, and authorize that identity here. No token pasting is required after installation.', wraplength=680).pack(anchor='w')
    ttk.Label(setup, text='ATLAS extension ID').pack(anchor='w', pady=(16, 4))
    extension = tk.StringVar()
    ttk.Entry(setup, textvariable=extension, width=45).pack(anchor='w')
    browser = tk.StringVar(value='chrome')
    ttk.Label(setup, text='Browser').pack(anchor='w', pady=(12, 4))
    ttk.Combobox(setup, textvariable=browser, values=('chrome', 'chromium'), state='readonly').pack(anchor='w')
    install_status = tk.StringVar()
    def install():
        ident = extension.get().strip()
        if not re.fullmatch('[a-p]{32}', ident):
            show_error('Enter the exact 32-character extension ID (letters a-p).'); return
        if not messagebox.askyesno('Install ATLAS Companion', 'Register this exact extension for native wake and install a per-user companion launcher? No folders will be granted and no administrator access is requested.', parent=window):
            return
        try:
            if os.name == 'nt':
                from .windows_install import install_runtime, installation_directory
            else:
                from .install import install_runtime, installation_directory
            appdir = installation_directory()
            upgrade = (appdir / 'installation.json').exists()
            if upgrade and not messagebox.askyesno('Repair / upgrade existing installation', 'Replace only unchanged installer-owned launchers and register this same extension again? Previous runtimes and all user data are preserved. A changed extension identity requires explicit uninstall first.', parent=window):
                return
            install_runtime(ident, browser=browser.get(), state_dir=state.directory, upgrade=upgrade)
            install_status.set('Installed. Open ATLAS in Chrome and choose Connect installed companion once. Future launches reconnect automatically.')
        except (APIError, OSError, ValueError) as exc:
            show_error(exc)
    ttk.Button(setup, text='Install / repair browser connection', command=install).pack(anchor='w', pady=18)
    ttk.Label(setup, textvariable=install_status, wraplength=680).pack(anchor='w')
    ttk.Label(setup, text='A changed extension ID or revoked authorization requires explicit enrollment again. Your location grants stay separate.', wraplength=680).pack(anchor='w', pady=18)
    ttk.Label(manual, text='Manual pairing token', style='Title.TLabel').pack(anchor='w')
    ttk.Label(manual, text='Use this fallback if automatic connection fails. Paste the exact extension ID below, generate a token, then paste it into ATLAS Companion token and click Connect securely. The companion service must be running.', wraplength=680).pack(anchor='w', pady=12)
    ttk.Label(manual, text='ATLAS extension ID (same identity as Chrome connection)').pack(anchor='w')
    ttk.Entry(manual, textvariable=extension, width=45).pack(anchor='w', pady=6)
    token_value = tk.StringVar()
    token_status = tk.StringVar(value='No token generated. Existing folder permissions stay unchanged.')
    ttk.Label(manual, text='Companion token').pack(anchor='w', pady=(12, 4))
    token_entry = ttk.Entry(manual, textvariable=token_value, state='readonly', width=60, show='*')
    token_entry.pack(anchor='w', fill='x')
    reveal = tk.BooleanVar(value=False)
    ttk.Checkbutton(manual, text='Show token', variable=reveal,
                    command=lambda: token_entry.configure(show='' if reveal.get() else '*')).pack(anchor='w', pady=6)
    token_buttons = ttk.Frame(manual); token_buttons.pack(anchor='w', pady=12)
    def clear_token(*_):
        token_value.set('')
        copy_token_button.configure(state='disabled')
        token_status.set('Token cleared from this window. Generate a new token for the selected identity.')
    def generate_token():
        clear_token()
        ident = extension.get().strip()
        if not re.fullmatch('[a-p]{32}', ident):
            show_error('Enter the exact 32-character extension ID (letters a-p).'); return
        if not messagebox.askyesno('Generate companion token', f'Authorize manual pairing for extension {ident}? This replaces its previous token. It does not add folder permissions. Automatic reconnect can replace this token again.', parent=window):
            return
        try:
            token_value.set(model.pairing_token(ident, consent=True))
            copy_token_button.configure(state='normal')
            token_status.set('Token ready. Copy it into the extension and click Connect securely. Keep it private; do not include it in screenshots or support messages.')
        except (APIError, OSError, ValueError) as exc:
            show_error(exc)
    def copy_token():
        if token_value.get():
            window.clipboard_clear()
            window.clipboard_append(token_value.get())
            token_status.set('Copied. Paste into Companion token in the extension, then click Connect securely.')
    ttk.Button(token_buttons, text='Generate token', command=generate_token).pack(side='left')
    copy_token_button = ttk.Button(token_buttons, text='Copy token', command=copy_token, state='disabled')
    copy_token_button.pack(side='left', padx=8)
    ttk.Button(token_buttons, text='Clear displayed token', command=clear_token).pack(side='left')
    ttk.Label(manual, textvariable=token_status, wraplength=680).pack(anchor='w', pady=8)
    extension.trace_add('write', clear_token)

    def uninstall():
        if not messagebox.askyesno('Uninstall ATLAS Companion', 'Remove this user installation, native browser registration and optional recovery startup? Saved location/catalog data and previous runtime files are preserved. Existing browser authorization will be revoked.', parent=window):
            return
        try:
            if os.name == 'nt':
                from .windows_install import uninstall as remove_installation, installation_directory
            else:
                from .install import uninstall as remove_installation, installation_directory
            appdir = installation_directory()
            result = remove_installation(appdir)
            install_status.set('Uninstalled browser/startup integration. Saved data and prior runtimes remain. Modified files retained: ' + str(len(result['retained_modified'])))
        except (APIError, OSError, ValueError, __import__('subprocess').SubprocessError) as exc:
            show_error(exc)
    ttk.Button(setup, text='Uninstall companion integration', command=uninstall).pack(anchor='w')

    diagnostics = tk.StringVar(value='Check the verified local companion without displaying credentials.')
    ttk.Label(recovery, textvariable=diagnostics, wraplength=680).pack(anchor='w', pady=12)
    def doctor():
        result = diagnose(state)
        from .diagnostics import record
        record(state, 'LOCAL_DIAGNOSIS', result['state'])
        diagnostics.set(result['state'] + ' - ' + result['message'])
    ttk.Button(recovery, text='Check connection', command=doctor).pack(anchor='w')
    with state.connect() as db:
        enrolled = [row['origin'].removeprefix('chrome-extension://') for row in db.execute('SELECT origin FROM clients')]
    if len(enrolled) == 1:
        extension.set(enrolled[0])
    supervisor_id = tk.StringVar(value=enrolled[0] if len(enrolled) == 1 else '')
    ttk.Label(recovery, text='Optional background recovery - paired extension ID').pack(anchor='w', pady=(18, 4))
    ttk.Entry(recovery, textvariable=supervisor_id, width=45).pack(anchor='w')
    ttk.Label(recovery, text='Keeps the companion available while your user session is running. This is optional; native demand wake works without it. Never runs while the machine is powered off.', wraplength=680).pack(anchor='w', pady=8)
    def supervisor(enable):
        try:
            if os.name == 'nt':
                from .windows_supervisor import startup
            else:
                from .supervisor import startup
            if enable:
                ident = supervisor_id.get().strip()
                if not messagebox.askyesno('Enable background recovery', 'Enable an optional per-user recovery supervisor at login? You can disable it here. No root grants or wake timers are added.', parent=window): return
                startup(state, ident, 17892, 'enable', consent=True)
            else:
                ident = supervisor_id.get().strip()
                startup(state, ident, 17892, 'disable')
            diagnostics.set('Background recovery enabled.' if enable else 'Background recovery disabled. Native demand wake remains available.')
        except (APIError, OSError, ValueError, __import__('subprocess').SubprocessError) as exc:
            show_error(exc)
    options = ttk.Frame(recovery); options.pack(anchor='w', pady=10)
    ttk.Button(options, text='Enable background recovery', command=lambda: supervisor(True)).pack(side='left')
    ttk.Button(options, text='Disable', command=lambda: supervisor(False)).pack(side='left', padx=8)
    ttk.Label(frame, text='Local first | Explicit grants | No administrator privileges', padding=(0, 8)).pack(anchor='w')
    if not enrolled:
        tabs.select(setup)
    debug = ttk.Frame(tabs, padding=14)
    tabs.add(debug, text='Debug events')
    ttk.Label(debug, text='Native connection stages and error codes. No tokens or file contents.', wraplength=680).pack(anchor='w')
    debug_output = tk.Text(debug, height=16, wrap='word', font=('monospace', 9))
    debug_output.pack(fill='both', expand=True, pady=10)
    def debug_refresh():
        import json
        from .diagnostics import snapshot
        debug_output.configure(state='normal')
        debug_output.delete('1.0', 'end')
        try:
            debug_output.insert('1.0', json.dumps(snapshot(state), indent=2))
        except Exception:
            debug_output.insert('1.0', '{"code":"DIAGNOSTIC_STORE_UNAVAILABLE"}')
        debug_output.configure(state='disabled')
    def debug_copy():
        window.clipboard_clear()
        window.clipboard_append(debug_output.get('1.0', 'end-1c'))
    debug_buttons = ttk.Frame(debug); debug_buttons.pack(anchor='w')
    ttk.Button(debug_buttons, text='Refresh debug events', command=debug_refresh).pack(side='left')
    ttk.Button(debug_buttons, text='Copy debug report', command=debug_copy).pack(side='left', padx=8)
    debug_refresh()
    # Normal setup presents only identity and deliberate folder choices.
    simple = ttk.Frame(frame, padding=12)
    ttk.Label(simple, text='Connect ATLAS', style='Title.TLabel').pack(anchor='w')
    ttk.Label(simple, text='Enter the extension ID once. Choose your folders. ATLAS starts automatically after setup and at sign-in.', wraplength=680).pack(anchor='w', pady=12)
    ttk.Label(simple, text='Extension ID (from chrome://extensions)').pack(anchor='w')
    ttk.Entry(simple, textvariable=extension, width=45).pack(anchor='w', pady=8)
    quick_write = tk.BooleanVar(value=False)
    ttk.Checkbutton(simple, text='Allow file changes in folders I choose (copy, move, rename and trash)', variable=quick_write).pack(anchor='w', pady=8)
    quick_status = tk.StringVar(value='No folder is authorized until you choose it.')
    ttk.Label(simple, textvariable=quick_status, wraplength=680).pack(anchor='w', pady=12)
    def quick_setup():
        import json
        import queue
        import threading
        ident = extension.get().strip()
        if not re.fullmatch('[a-p]{32}', ident):
            show_error('Enter the exact 32-character extension ID (letters a-p).'); return
        if not messagebox.askyesno('Set up ATLAS', 'Install this extension connection and start ATLAS automatically now and at sign-in? No administrator access is needed. Next, choose which folders to allow.', parent=window): return
        mode = 'read and write' if quick_write.get() else 'read only'
        chosen = []
        if messagebox.askyesno('Home folder?', f'Allow {mode} access to your home folder and its accessible subfolders?\n\n{Path.home()}\n\nPrivate ATLAS state is excluded.', parent=window):
            chosen.append((str(Path.home()), quick_write.get()))
        while messagebox.askyesno('Other folders?', 'Would you like to allow another folder?', parent=window):
            path = filedialog.askdirectory(title=f'Choose a folder to allow ({mode})', parent=window, mustexist=True)
            if path: chosen.append((path, quick_write.get()))
            else: break
        quick_button.configure(state='disabled')
        quick_status.set('Setting up and starting ATLAS…')
        results = queue.Queue()
        def task():
            try:
                if os.name == 'nt':
                    from .windows_install import install_runtime, installation_directory
                    from .windows_supervisor import startup
                else:
                    from .install import install_runtime, installation_directory
                    from .supervisor import startup
                appdir = installation_directory()
                receipt = appdir / 'installation.json'
                if receipt.exists():
                    previous = json.loads(receipt.read_text())
                    if previous.get('extension_id') != ident:
                        raise APIError('EXTENSION_ID_CHANGED', 'A different extension is installed. Use Advanced / diagnostics to uninstall its integration, then run setup again. Saved folders remain.')
                from .quick_setup import complete
                result = complete(state, ident, chosen,
                    lambda identity: install_runtime(identity, browser='chrome', state_dir=state.directory, upgrade=receipt.exists()),
                    lambda identity: startup(state, identity, 17892, 'enable', consent=True), consent=True)
                results.put((True, result))
            except Exception as exc:
                results.put((False, exc))
        def poll():
            try: ok, result = results.get_nowait()
            except queue.Empty:
                window.after(100, poll); return
            quick_button.configure(state='normal')
            refresh()
            if ok:
                quick_status.set('Done. ATLAS is running automatically. In Chrome, choose Connect installed companion once.')
                messagebox.showinfo('ATLAS is ready', 'Setup complete. Your choices are saved. Connect installed companion in ATLAS once; normal future launches reconnect automatically.', parent=window)
                window.destroy()
            else:
                quick_status.set('Setup needs attention. Open Advanced / diagnostics.')
                show_error(result)
        threading.Thread(target=task, daemon=True).start()
        window.after(100, poll)
    quick_button = ttk.Button(simple, text='Set up & start', command=quick_setup)
    quick_button.pack(anchor='w', pady=10)
    def advanced():
        simple.pack_forget()
        tabs.pack(fill='both', expand=True, pady=12)
    ttk.Button(simple, text='Advanced / diagnostics', command=advanced).pack(anchor='w', pady=12)
    tabs.pack_forget()
    simple.pack(fill='both', expand=True)
    if advanced_mode:
        advanced()
    refresh()
    window.mainloop()
    return 0


def main(state_dir=None, advanced=False):
    from .runtime import RuntimeLock
    state = State(state_dir or (Path(os.environ.get('LOCALAPPDATA', str(Path.home() / 'AppData/Local'))) / 'Atlas' if os.name == 'nt' else Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share'))) / 'atlas'))
    try:
        with RuntimeLock(state, 'desktop'):
            return _window_main(state, advanced_mode=advanced)
    finally:
        if hasattr(state, 'close'):
            state.close()
