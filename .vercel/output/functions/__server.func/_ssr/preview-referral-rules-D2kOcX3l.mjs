import { S as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-referral-rules-D2kOcX3l.js
var import_jsx_runtime = require_jsx_runtime();
/**
* TEMPORARY no-login preview of the REAL Referral Program Rules page.
* Mounts the production component inside a mock AuthContext (AppShell's header
* needs one). Development only.
*/
function PreviewReferralRules() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
}
//#endregion
export { PreviewReferralRules as component };
