import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { i as useQueryClient } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/preview-refer-DyFZ2f6Z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* TEMPORARY no-login preview of the REAL Refer & Earn screen.
*
* Mounts the actual ReferPage inside a mock AuthContext and seeds the real
* ["referrals", userId] query cache, so what renders is the production component
* with production logic — not a copy. Development only.
*/
var USER_ID = "00000000-0000-4000-8000-000000000001";
var DAY = 864e5;
var iso = (daysAgo) => (/* @__PURE__ */ new Date(Date.now() - daysAgo * DAY)).toISOString();
/** Mock referrals covering every reward state the screen can render. */
var REFERRALS = [
	{
		id: "r1",
		referrer_id: USER_ID,
		referred_id: "f1",
		created_at: iso(120),
		signup_credited_at: iso(120),
		earning_credited_at: iso(118),
		withdrawal_credited_at: iso(90),
		reward_released_at: iso(90),
		bonus_amount: 3,
		status: "completed"
	},
	{
		id: "r2",
		referrer_id: USER_ID,
		referred_id: "f2",
		created_at: iso(40),
		signup_credited_at: iso(40),
		earning_credited_at: iso(38),
		withdrawal_credited_at: null,
		reward_released_at: null,
		bonus_amount: 0,
		status: "active"
	},
	{
		id: "r3",
		referrer_id: USER_ID,
		referred_id: "f3",
		created_at: iso(10),
		signup_credited_at: iso(10),
		earning_credited_at: null,
		withdrawal_credited_at: null,
		reward_released_at: null,
		bonus_amount: 0,
		status: "active"
	},
	{
		id: "r4",
		referrer_id: USER_ID,
		referred_id: "f4",
		created_at: iso(400),
		signup_credited_at: iso(400),
		earning_credited_at: null,
		withdrawal_credited_at: null,
		reward_released_at: null,
		bonus_amount: 0,
		status: "expired"
	}
];
function PreviewRefer() {
	const queryClient = useQueryClient();
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		queryClient.setQueryData(["referrals", USER_ID], REFERRALS);
		setReady(true);
	}, [queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/",
		replace: true
	});
}
//#endregion
export { PreviewRefer as component };
