// Independent of explorer.js so module/startup failures still leave a diagnostic surface.
(() => {
  let ready = false;
  let bootCode = 'UI_STARTING';
  let lastReport = null;
  const byId = id => document.getElementById(id);
  const notify = code => {
    try { chrome.runtime.sendMessage({type:'debug-ui-error',code}).catch(() => {}); } catch {}
  };
  const failed = code => {
    bootCode = code;
    if (byId('debug-fallback')) byId('debug-fallback').hidden = false;
    notify(code);
  };
  window.addEventListener('error', () => failed('UI_SCRIPT_ERROR'));
  window.addEventListener('unhandledrejection', () => failed('UI_SCRIPT_ERROR'));
  window.addEventListener('atlas:boot-ready', () => {ready = true; bootCode = 'UI_READY';});
  setTimeout(() => {if (!ready) failed('UI_BOOT_TIMEOUT');}, 10000);
  document.addEventListener('DOMContentLoaded', () => {
    const output = byId('debug-output');
    async function refresh(probe = false) {
      output.textContent = 'Reading diagnostics…';
      try {
        const response = await Promise.race([
          chrome.runtime.sendMessage({type:probe ? 'debug-probe' : 'debug-report'}),
          new Promise((_,reject) => setTimeout(() => reject(new Error('timeout')),12000))
        ]);
        lastReport = response?.ok ? {ui:{code:bootCode},...response} : {ui:{code:bootCode},code:'DEBUG_API_UNAVAILABLE'};
      } catch { lastReport = {ui:{code:bootCode},code:'WORKER_UNAVAILABLE_OR_TIMEOUT'}; }
      output.textContent = JSON.stringify(lastReport,null,2);
    }
    const show = () => {byId('debug-dialog').showModal(); refresh();};
    byId('debug-open').onclick = show;
    byId('debug-fallback-open').onclick = show;
    byId('debug-refresh').onclick = () => refresh();
    byId('debug-probe').onclick = () => refresh(true);
    byId('debug-close').onclick = () => byId('debug-dialog').close();
    byId('debug-reload').onclick = () => location.reload();
    byId('debug-copy').onclick = async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(lastReport,null,2));
        byId('debug-copy-status').textContent = 'Copied diagnostic report.';
      } catch { byId('debug-copy-status').textContent = 'Copy unavailable. Select the report text and copy it.'; }
    };
  });
})();
