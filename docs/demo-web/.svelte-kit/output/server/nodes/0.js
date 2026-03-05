import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.B_DgNM-c.js","_app/immutable/chunks/B1aXMYWX.js","_app/immutable/chunks/C9tiXKDr.js","_app/immutable/chunks/Cw_Bn73R.js","_app/immutable/chunks/D_FHtMGT.js"];
export const stylesheets = ["_app/immutable/assets/0.CISeNu3s.css"];
export const fonts = [];
