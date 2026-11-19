import { a as TSS_SERVER_FUNCTION, o as getServerFnById } from "./server-CpGMOUrW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-Bbq2Yr9O.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
export { createSsrRpc as t };
