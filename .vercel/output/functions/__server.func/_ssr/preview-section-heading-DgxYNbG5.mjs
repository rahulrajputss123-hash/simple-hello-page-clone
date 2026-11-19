import { S as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-section-heading-DgxYNbG5.js
var import_jsx_runtime = require_jsx_runtime();
/**
* TEMPORARY preview-only route for visually reviewing the ribbon SectionHeading
* rollout without Supabase auth (every real screen is behind /_authenticated).
*
* Renders the real component with the real props from each screen, so what you
* see here is what those screens render. Development only.
*/
function PreviewSectionHeading() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
}
//#endregion
export { PreviewSectionHeading as component };
