import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { I as RefreshCw, p as TriangleAlert, pt as House } from "../_libs/lucide-react.mjs";
import { Ot as Button } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ErrorBoundary-_LI25I0d.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ErrorBoundary = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null
		};
	}
	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			error
		};
	}
	errorInfo = null;
	componentDidCatch(error, errorInfo) {
		this.errorInfo = errorInfo;
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		console.error("Current URL:", typeof window !== "undefined" ? window.location.href : "N/A");
	}
	reset = () => {
		this.setState({
			hasError: false,
			error: null
		});
		this.errorInfo = null;
	};
	render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
			const currentUrl = typeof window !== "undefined" ? window.location.href : "N/A";
			const currentPath = typeof window !== "undefined" ? window.location.pathname : "N/A";
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-screen flex-col items-center justify-center p-4 bg-background",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-2xl space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto grid size-16 place-items-center rounded-full bg-destructive/10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-8 text-destructive" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-4 text-2xl font-bold",
									children: "This page didn't load"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-muted-foreground",
									children: "We encountered an error while loading this page. Try refreshing or return to the home page."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "rounded-lg border border-destructive/30 bg-destructive/5 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "cursor-pointer text-sm font-semibold text-destructive",
								children: "Technical details (click to expand)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 space-y-3 text-left",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Error Message:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-mono text-xs text-destructive",
										children: this.state.error.message
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Current URL:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 break-all font-mono text-xs text-destructive",
										children: currentUrl
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Route Path:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-mono text-xs text-destructive",
										children: currentPath
									})] }),
									this.state.error.stack && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Stack Trace:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "mt-1 max-h-60 overflow-auto rounded border border-destructive/20 bg-black/5 p-2 font-mono text-[10px] leading-tight text-destructive/90",
										children: this.state.error.stack
									})] }),
									this.errorInfo?.componentStack && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Component Stack:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
										className: "mt-1 max-h-40 overflow-auto rounded border border-destructive/20 bg-black/5 p-2 font-mono text-[10px] leading-tight text-destructive/90",
										children: this.errorInfo.componentStack
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Error Type:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-mono text-xs text-destructive",
										children: this.state.error.name || "Error"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-destructive/80",
										children: "Timestamp:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 font-mono text-xs text-destructive",
										children: (/* @__PURE__ */ new Date()).toISOString()
									})] })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => window.location.reload(),
								className: "gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), "Refresh page"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								asChild: true,
								variant: "outline",
								className: "gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "size-4" }), "Go home"]
								})
							})]
						})
					]
				})
			});
		}
		return this.props.children;
	}
};
//#endregion
export { ErrorBoundary as t };
