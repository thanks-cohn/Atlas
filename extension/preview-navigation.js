export const previewDefaults = {image:true, audio:true, video:true, text:false, pdf:false};
export function previewKind(name) {
  const ext = name.toLowerCase().split('.').pop();
  if (/^(png|jpg|jpeg|gif|webp|bmp|avif|ico)$/.test(ext)) return 'image';
  if (/^(mp3|wav|ogg|oga|flac|m4a|aac|opus)$/.test(ext)) return 'audio';
  if (/^(mp4|webm|ogv|mov|m4v)$/.test(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (/^(txt|md|json|csv|tsv|log|js|mjs|ts|css|html|xml|yaml|yml|py|c|h|cpp|rs|toml|ini)$/.test(ext)) return 'text';
  return null;
}
export function previewStep(entries, current, delta, settings) {
  const eligible = entries.filter(e => !(e.kind === 'directory' || e.is_dir === true || e.type === 'directory') && settings[previewKind(e.name)] === true);
  if (!eligible.length) return null;
  let index = eligible.findIndex(e => e.path === current);
  if (index < 0) {
    const position = entries.findIndex(e => e.path === current);
    const scan = delta > 0 ? entries.slice(position + 1).concat(entries.slice(0, position + 1)) : entries.slice(0, position).reverse().concat(entries.slice(position).reverse());
    return scan.find(e => eligible.includes(e)) || eligible[0];
  }
  return eligible[(index + delta + eligible.length) % eligible.length];
}
