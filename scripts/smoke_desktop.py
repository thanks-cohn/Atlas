#!/usr/bin/env python3
"""Actual Tk window/controller smoke on DISPLAY; dialogs use disposable test choices.

This exercises native widgets and persisted scope changes, not Chrome callbacks.
Run DISPLAY=:N python scripts/smoke_desktop.py [--artifacts artifacts/desktop]
"""
import argparse
from pathlib import Path
import sys
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))


def main():
    import tkinter as tk
    from tkinter import ttk
    from atlas_companion.desktop import main as desktop_main
    from atlas_companion.desktop import State
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifacts', type=Path)
    args = parser.parse_args()
    errors = []
    real_tk = tk.Tk
    with tempfile.TemporaryDirectory(prefix='atlas-native-ui-') as folder:
        base = Path(folder); root = base / 'files'; root.mkdir()
        state_dir = base / 'private'
        state = State(state_dir)
        def saved_grants():
            reopened = State(state_dir)
            try:
                return reopened.grants()
            finally:
                if hasattr(reopened, 'close'):
                    reopened.close()
        def factory():
            window = real_tk()
            def walk(widget):
                yield widget
                for child in widget.winfo_children():
                    yield from walk(child)
            def exercise():
                try:
                    widgets = list(walk(window))
                    buttons = {str(w.cget('text')): w for w in widgets if isinstance(w, ttk.Button)}
                    tabs = next(w for w in widgets if isinstance(w, ttk.Notebook))
                    buttons['Advanced / diagnostics'].invoke()
                    tabs.select(0); window.update()
                    buttons['Add location...'].invoke()
                    grant = state.grants()[0]
                    assert not grant['writable']
                    tree = next(w for w in widgets if isinstance(w, ttk.Treeview))
                    tree.selection_set(grant['id'])
                    buttons['Change read/write'].invoke()
                    persisted = saved_grants()
                    assert len(persisted) == 1 and persisted[0]['writable'] and persisted[0]['id'] == grant['id']
                    window.update()
                    if args.artifacts:
                        from PIL import ImageGrab
                        args.artifacts.mkdir(parents=True, exist_ok=True)
                        ImageGrab.grab().save(args.artifacts / 'native-locations.png')
                    tree.selection_set(grant['id'])
                    buttons['Revoke'].invoke()
                    assert saved_grants() == []
                    tabs.select(3); window.update()
                    manual = window.nametowidget(tabs.tabs()[3])
                    entries = [w for w in walk(manual) if isinstance(w, ttk.Entry)]
                    identity, token_field = entries
                    identity.delete(0, 'end'); identity.insert(0, 'a' * 32)
                    assert str(buttons['Copy token'].cget('state')) == 'disabled'
                    buttons['Generate token'].invoke()
                    token = token_field.get()
                    assert len(token) >= 20 and state.authenticate('chrome-extension://' + 'a' * 32, token)
                    assert token_field.cget('show') == '*'
                    buttons['Copy token'].invoke()
                    assert window.clipboard_get() == token
                    buttons['Clear displayed token'].invoke()
                    assert not token_field.get()
                    assert str(buttons['Copy token'].cget('state')) == 'disabled'
                    buttons['Generate token'].invoke()
                    assert not state.authenticate('chrome-extension://' + 'a' * 32, token)
                    identity.delete(0, 'end'); identity.insert(0, 'b' * 32)
                    assert not token_field.get()
                    assert saved_grants() == []
                    buttons['Refresh debug events'].invoke()
                    buttons['Copy debug report'].invoke()
                    assert 'atlas.diagnostics.v1' in window.clipboard_get()
                    assert token not in window.clipboard_get()
                    window.clipboard_clear()
                    print('PASS actual Tk: grants, permission changes, revoke; manual token generation, masking, clipboard, rotation and identity-change clearing.')
                except BaseException as exc:
                    errors.append(exc)
                finally:
                    window.destroy()
            window.after(150, exercise)
            return window
        with patch('tkinter.Tk', side_effect=factory), patch('tkinter.filedialog.askdirectory', return_value=str(root)), patch('tkinter.messagebox.askyesno', return_value=True), patch('tkinter.messagebox.showinfo', side_effect=lambda *_a, **_k: errors.append(AssertionError('Unexpected info dialog'))), patch('tkinter.messagebox.showerror', side_effect=lambda *_a, **_k: errors.append(AssertionError('GUI showed an unexpected error'))):
            try:
                desktop_main(state_dir)
            finally:
                if hasattr(state, 'close'):
                    state.close()
    if errors:
        raise errors[0]
    print('NOT_RUN real user input, Chrome native callback, login/suspend/reboot.')


if __name__ == '__main__':
    main()
