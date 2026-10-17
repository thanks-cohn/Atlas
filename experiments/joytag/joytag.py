"""Opt-in one-image CPU experiment. Never imported by Atlas startup.

Commands: --download, --image PATH [--output JSON], or --gui.
Only the download command contacts a network. Inference reads explicit local files.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import time
import urllib.request

from joytag_provider import cache_dir, download, predict

def gui(directory):
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox
    import subprocess
    root=tk.Tk();root.title('Atlas · JoyTag experiment');root.geometry('620x520')
    frame=ttk.Frame(root,padding=24);frame.pack(fill='both',expand=True)
    ttk.Label(frame,text='Suggest image tags',font=('Segoe UI',18)).pack(anchor='w')
    ttk.Label(frame,text='Optional experiment · one image · one CPU thread').pack(anchor='w',pady=(8,20))
    text=tk.Text(frame,wrap='word',height=16);text.pack(fill='both',expand=True)
    status=ttk.Label(frame,text='Choose a local image. Nothing is added to Atlas automatically.');status.pack(anchor='w',pady=12)
    process=None;result=None;deadline=0
    def poll():
        nonlocal process,result
        if process.poll() is None and time.monotonic()>deadline:
            process.kill();process.communicate();button.configure(state='normal');status.configure(text='Stopped after 120 seconds. Atlas remains unchanged.');return
        if process.poll() is None:
            root.after(150,poll);return
        out,err=process.communicate();button.configure(state='normal')
        if process.returncode:
            status.configure(text='Experiment failed. Atlas remains unchanged.');messagebox.showerror('JoyTag',err[-1500:]);return
        result=json.loads(out);text.delete('1.0','end')
        text.insert('1.0','\n'.join(f"{x['tag']}   {x['score']:.0%}" for x in result['suggestions']))
        status.configure(text=f"{result['inference_seconds']}s inference · {len(result['suggestions'])} suggestions · review before using")
    def choose():
        nonlocal process,deadline,result
        if process is not None and process.poll() is None:return
        image=filedialog.askopenfilename(filetypes=[('Images','*.png *.jpg *.jpeg *.webp *.gif')])
        if not image:return
        result=None;text.delete('1.0','end')
        process=subprocess.Popen([sys.executable,str(Path(__file__).resolve()),'--model-dir',str(directory),'--image',image],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        deadline=time.monotonic()+120
        button.configure(state='disabled');status.configure(text='Running one image…');root.after(150,poll)
    button=ttk.Button(frame,text='Choose Image & Suggest Tags',command=choose);button.pack(anchor='w')
    def copy():
        if result:
            root.clipboard_clear();root.clipboard_append(', '.join(x['tag'] for x in result['suggestions']));status.configure(text='Copied. Paste into Atlas’s Create New Tags field.')
    ttk.Button(frame,text='Copy Suggested Tags',command=copy).pack(anchor='w',pady=10)
    def close():
        if process is not None and process.poll() is None:process.kill()
        root.destroy()
    root.protocol('WM_DELETE_WINDOW',close);root.mainloop()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download',action='store_true');parser.add_argument('--gui',action='store_true')
    parser.add_argument('--image');parser.add_argument('--output');parser.add_argument('--model-dir',type=Path,default=cache_dir())
    parser.add_argument('--threshold',type=float,default=.4);parser.add_argument('--top',type=int,default=30)
    args=parser.parse_args()
    if args.download:download(args.model_dir)
    if args.gui:gui(args.model_dir)
    elif args.image:
        result=predict(args.image,args.model_dir,args.threshold,args.top)
        body=json.dumps(result,indent=2)
        if args.output:Path(args.output).write_text(body+'\n',encoding='utf-8')
        print(body)
    elif not args.download:parser.error('Choose --download, --gui or --image.')

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('JOYTAG_EXPERIMENT_FAILED: '+str(exc),file=sys.stderr);sys.exit(1)
