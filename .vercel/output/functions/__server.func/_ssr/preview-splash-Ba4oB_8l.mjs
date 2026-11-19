import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-splash-Ba4oB_8l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Preview route for the two transitional screens, which are otherwise only
* visible for a fraction of a second.
*
* Toggle between the splash (logo-card corner fix) and the redesigned `/`
* loading screen. Development only.
*/
function PreviewSplash() {
	const [view, setView] = (0, import_react.useState)("loading");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
}
//#endregion
export { PreviewSplash as component };
