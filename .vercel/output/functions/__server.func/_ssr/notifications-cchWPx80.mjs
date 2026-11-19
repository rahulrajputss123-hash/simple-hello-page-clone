import { i as __toESM } from "../_runtime.mjs";
import { a as formatDateTime } from "./referral-progress-DmJLJmiB.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { Qt as Bell } from "../_libs/lucide-react.mjs";
import { n as supabase } from "./client-QOMq7HzS.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { M as SectionHeading, d as AppShell, tr as useAuth } from "./router-sXMnYegW.mjs";
import { t as EmptyState } from "./States-Cg9ELwgo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-cchWPx80.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotificationsPage() {
	const { session } = useAuth();
	const queryClient = useQueryClient();
	const notifications = useQuery({
		queryKey: ["notifications", session?.user.id],
		enabled: Boolean(session),
		queryFn: async () => {
			const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (!session || !notifications.data?.some((n) => !n.is_read)) return;
		supabase.from("notifications").update({ is_read: true }).eq("user_id", session.user.id).eq("is_read", false).then(() => queryClient.invalidateQueries({ queryKey: ["notifications-unread"] }));
	}, [
		session,
		notifications.data,
		queryClient
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		subtitle: "Notifications",
		mainClass: "page-fade-in",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
			variant: "ribbon",
			size: "page",
			icon: Bell,
			iconSrc: "/icons/icon-notifications.webp",
			title: "Notifications"
		}), !notifications.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
			icon: Bell,
			title: "Nothing here yet",
			description: "Quest rewards and payout updates will show up here."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-2",
			children: notifications.data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "surface-card p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: item.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: item.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] text-muted-foreground",
						children: formatDateTime(item.created_at)
					})
				]
			}, item.id))
		})]
	});
}
//#endregion
export { NotificationsPage as component };
