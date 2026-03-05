export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "nexid/_app",
	assets: new Set([".nojekyll","favicon.png","service-worker.js"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.v36CNyJZ.js",app:"_app/immutable/entry/app.Dg_w89Ib.js",imports:["_app/immutable/entry/start.v36CNyJZ.js","_app/immutable/chunks/BymqsgDZ.js","_app/immutable/chunks/C9tiXKDr.js","_app/immutable/chunks/Oeha0Bd0.js","_app/immutable/entry/app.Dg_w89Ib.js","_app/immutable/chunks/iIOlYSlB.js","_app/immutable/chunks/C9tiXKDr.js","_app/immutable/chunks/D_FHtMGT.js","_app/immutable/chunks/Cdn-3kB6.js","_app/immutable/chunks/B1aXMYWX.js","_app/immutable/chunks/Oeha0Bd0.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
