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
    from atlas_companion.state import State
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifacts', type=Path)
    args = parser.parse_args()
    errors = []
    real_tk = tk.Tk
    with tempfile.TemporaryDirectory(prefix='atlas-native-ui-') as folder:
        base = Path(folder); root = base / 'files'; root.mkdir()
        state_dir = base / 'private'
        state = State(state_dir)
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
                    tabs.select(0); window.update()
                    buttons['Add location...'].invoke()
                    grant = state.grants()[0]
                    assert not grant['writable']
                    tree = next(w for w in widgets if isinstance(w, ttk.Treeview))
                    tree.selection_set(grant['id'])
                    buttons['Change read/write'].invoke()
                    assert State(state_dir).get_grant(grant['id'])['writable']
                    assert len(State(state_dir).grants()) == 1
                    window.update()
                    if args.artifacts:
                        from PIL import ImageGrab
                        args.artifacts.mkdir(parents=True, exist_ok=True)
                        ImageGrab.grab().save(args.artifacts / 'native-locations.png')
                    tree.selection_set(grant['id'])
                    buttons['Revoke'].invoke()
                    assert State(state_dir).grants() == []
                    print('PASS actual Tk: native Add location → read-only grant; permission upgrade retains ID; restart persistence; explicit revoke; no tokens displayed.')
                except BaseException as exc:
                    errors.append(exc)
                finally:
                    window.destroy()
            window.after(150, exercise)
            return window
        with patch('tkinter.Tk', side_effect=factory), patch('tkinter.filedialog.askdirectory', return_value=str(root)), patch('tkinter.messagebox.askyesno', return_value=True), patch('tkinter.messagebox.showinfo', side_effect=lambda *_a, **_k: errors.append(AssertionError('Unexpected info dialog'))), patch('tkinter.messagebox.showerror', side_effect=lambda *_a, **_k: errors.append(AssertionError('GUI showed an unexpected error'))):
            desktop_main(state_dir)
    if errors:
        raise errors[0]
    print('NOT_RUN real user input, Chrome native callback, login/suspend/reboot.')


if __name__ == '__main__':
    main()
