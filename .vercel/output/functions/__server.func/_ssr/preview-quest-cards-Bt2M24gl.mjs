import { S as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-quest-cards-Bt2M24gl.js
var import_jsx_runtime = require_jsx_runtime();
/**
* TEMPORARY preview-only route used to visually verify the QuestCard redesign
* without requiring Supabase auth. Renders the real QuestCard component with
* mock quest data covering all three quest types plus locked/credited states.
* Development only.
*/
function PreviewQuestCards() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
}
//#endregion
export { PreviewQuestCards as component };
