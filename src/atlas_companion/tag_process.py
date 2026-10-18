"""Bounded, single-job subprocess. Own child only; never process-name termination."""
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
from .security import APIError


def run_engine(state,body,timeout=105):
    from .tag_bundle import engine_command
    try:command=engine_command(state)
    except (ValueError,OSError) as exc:
        raise APIError('TAG_ENGINE_NOT_INSTALLED','Extract the complete new helper bundle and repair its installation.',409) from exc
    environment=dict(os.environ)
    if not getattr(sys,'frozen',False):environment['PYTHONPATH']=str(Path(__file__).parents[1])
    for name in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'):
        environment[name]='1'
    options={'creationflags':subprocess.CREATE_NO_WINDOW} if os.name=='nt' else {'start_new_session':True}
    process=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=environment,**options)
    try:
        output,errors=process.communicate(json.dumps(body,allow_nan=False).encode(),timeout=timeout)
    except subprocess.TimeoutExpired as exc:
        # Engine is onedir: no self-extracting bootloader child. Kill this owned
        # process/session and wait before admitting another job.
        if os.name=='nt':process.kill()
        else:
            try:os.killpg(process.pid,signal.SIGKILL)
            except ProcessLookupError:pass
        process.communicate(timeout=10)
        raise APIError('TAG_TIMEOUT','Tagging took too long; the model process was stopped. Try a lighter model.',408) from exc
    if len(output)>1024*1024:
        raise APIError('TAG_WORKER_OUTPUT_INVALID','Tagging returned an oversized result.',500)
    try:result=json.loads(output)
    except (ValueError,UnicodeError) as exc:
        import logging
        logging.error('Tagging engine exit=%s stderr=%s',process.returncode,errors[-4096:].decode(errors='replace'))
        raise APIError('TAG_WORKER_FAILED','The tagging engine stopped unexpectedly. Your existing tags remain.',500) from exc
    if result.get('ok') is not True or process.returncode:
        error=result.get('error',{})
        raise APIError(error.get('code','TAG_WORKER_FAILED'),error.get('message','Tagging failed.'),409)
    return {key:value for key,value in result.items() if key!='ok'}
