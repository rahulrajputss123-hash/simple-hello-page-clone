import { v as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { x as Star } from "../_libs/lucide-react.mjs";
import { i as avatarById, t as AVATAR_OPTIONS } from "./premium-BIRn1NQB.mjs";
import { B as TESTIMONIALS, P as EARN_WAYS, R as SHOWCASE_OFFERS, Z as useCountUpOnVisible } from "./router-sXMnYegW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/TrustSection-CKe3jRbO.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Renders an uploaded landing image cropped to its artwork.
*
* The parent must be positioned and clipped (`relative overflow-hidden`) and set
* the aspect ratio. `max-w-none` is required so the >100% width isn't clamped.
*
* @param blend Maps leftover black (and the artwork's own drop shadow) onto the
*   dark panel behind it. Only valid on a dark surface, and only when no ancestor
*   between the blend root and this image creates a stacking context.
* @param eager Set to true for above-the-fold images that should load immediately.
*/
function CroppedArt({ src, alt, crop, blend = false, eager = false, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt,
		loading: eager ? "eager" : "lazy",
		fetchPriority: eager ? "high" : void 0,
		decoding: "async",
		style: {
			width: `${crop.widthPct}%`,
			left: `${crop.leftPct}%`,
			top: `${crop.topPct}%`
		},
		className: `absolute h-auto max-w-none ${blend ? "mix-blend-lighten" : ""} ${className}`
	});
}
/**
* "8 Ways to Earn" — the uploaded tiles shown on a jade panel.
*
* The artwork already contains its own number badge, title and subtitle, so this
* section deliberately renders no captions over or under the tiles; the labels
* ride along as alt text instead.
*
* Each tile is cropped to its measured artwork bounds, then `mix-blend-lighten`
* folds the artwork's own drop shadow (drawn onto black in the source) into the
* jade behind it.
*
* The blend needs a predictable backdrop, so nothing between this section and the
* `<img>` may create a stacking context — no transforms, filters, opacity or
* `isolation` on the `<ul>`/`<li>`. Adding a hover-lift to the tiles would break
* the blend mid-hover.
*/
function EarnWaysSection() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise-in relative isolate overflow-hidden rounded-[1.75rem] bg-jade-gradient px-4 py-9 shadow-lift sm:px-8 sm:py-12",
		"data-testid": "earn-ways-section",
		"aria-labelledby": "earn-ways-heading",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-40 blur-3xl",
				style: { background: "radial-gradient(closest-side, var(--color-gold), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full opacity-30 blur-3xl",
				style: { background: "radial-gradient(closest-side, var(--color-mint), transparent)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold-foreground shadow-gold",
						children: "Earning methods"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						id: "earn-ways-heading",
						className: "mt-4 font-display text-[2.1rem] leading-none text-primary-foreground sm:text-[2.75rem]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gold",
							children: "8"
						}), " Ways to Earn"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-3 max-w-md text-sm text-primary-foreground/70 sm:text-base",
						children: "Explore all 8 ways and turn your time into real money!"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4",
				"data-testid": "earn-ways-grid",
				children: EARN_WAYS.map((way) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "relative aspect-square overflow-hidden rounded-2xl",
					"data-testid": `earn-way-${way.number}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CroppedArt, {
						src: way.image,
						alt: `${way.title} — ${way.subtitle}`,
						crop: way.crop,
						blend: true
					})
				}, way.number))
			})
		]
	});
}
/**
* One offer card. Each upload is a full offer card whose own caption text is
* truncated mid-word, so only its artwork panel is used and the title /
* description / gold amount are rendered as real text underneath.
*
* No overlay chip is drawn on the art: each panel already carries its own circular
* badge in the lower-right corner.
*/
function OfferCard({ offer, compact, index }) {
	const eager = index < 2;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: `surface-card press-feedback group relative flex flex-col overflow-hidden !p-0 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-gold ${compact ? "w-[70%] shrink-0 snap-start lg:w-auto" : ""}`,
		"data-testid": `showcase-offer-${offer.id}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative aspect-[5/4] w-full overflow-hidden bg-background-alt",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CroppedArt, {
				src: offer.image,
				alt: offer.title,
				crop: offer.crop,
				eager
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col gap-0.5 p-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-[13px] font-semibold leading-tight",
					children: offer.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "line-clamp-2 text-[11px] leading-snug text-muted-foreground",
					children: offer.description
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-amount mt-auto pt-1 text-base leading-none text-gold-dark",
					children: offer.payout
				})
			]
		})]
	});
}
/**
* Featured offers showcase — the three uploaded offer images.
*
* Grid, radius and hover mirror `FeaturedOffers.tsx`.
*
* @param variant
*   `"section"` (default) renders a headed section, used by the /app page.
*   `"compact"` drops the heading and, below `lg`, becomes a horizontal
*   snap-scroll strip with each card at 70% width so the next one peeks in —
*   used inside the web landing hero where vertical space is scarce.
*/
function OffersShowcase({ variant = "section", className = "" }) {
	const compact = variant === "compact";
	const list = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: compact ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden" : "stagger-children mt-6 grid grid-cols-3 gap-3 sm:gap-4",
		"data-testid": "offers-showcase-list",
		children: SHOWCASE_OFFERS.map((offer, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferCard, {
			offer,
			compact,
			index
		}, offer.id))
	});
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		"data-testid": "offers-showcase-compact",
		children: list
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "offers-showcase",
		"aria-labelledby": "offers-showcase-heading",
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				id: "offers-showcase-heading",
				className: "font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]",
				children: ["Real offers, ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-gold-dark",
					children: "real payouts"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground",
				children: "A snapshot of what's live in the app right now. New partner offers land every day."
			})]
		}), list]
	});
}
/** Same five illustrated avatars the app's Live Community block uses. */
var COMMUNITY_AVATARS = AVATAR_OPTIONS.slice(0, 5);
function StarRow({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `flex items-center gap-0.5 text-gold-dark ${className}`,
		"aria-hidden": true,
		children: Array.from({ length: 5 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "size-3.5 fill-current" }, index))
	});
}
/**
* Social proof: the animated community counter, an avatar-stack review badge and
* three short testimonials.
*
* Reuses `useCountUpOnVisible` (the same scroll-triggered counter behind the app's
* Live Community stat) and the illustrated `AVATAR_OPTIONS` from onboarding, so
* the faces here are the same ones users meet in the product.
*/
function TrustSection() {
	const communityStat = useCountUpOnVisible(5e4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "trust-section",
		"aria-labelledby": "trust-heading",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					id: "trust-heading",
					className: "font-display text-[1.6rem] leading-tight text-foreground sm:text-[2rem]",
					children: ["Trusted by ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-gold-dark",
						children: "earners worldwide"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					ref: communityStat.ref,
					"data-testid": "landing-live-community",
					className: "surface-card relative overflow-hidden p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-mint/10 blur-2xl"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary ring-1 ring-inset ring-mint/25",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative grid size-1.5 place-items-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "payout-live-dot absolute inset-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" })]
							}), "Live Community"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-amount font-display text-3xl leading-none text-foreground",
								"data-testid": "landing-live-community-stat",
								children: [communityStat.value.toLocaleString(), "+"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "Users earning with us"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"data-testid": "landing-review-badge",
					className: "surface-card relative overflow-hidden p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -left-10 -bottom-12 size-40 rounded-full bg-gold/10 blur-2xl"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex shrink-0 -space-x-2.5",
							"aria-hidden": true,
							"data-testid": "landing-avatar-stack",
							children: COMMUNITY_AVATARS.map((avatar, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: avatar.imageUrl,
								alt: "",
								loading: "lazy",
								style: { zIndex: COMMUNITY_AVATARS.length - index },
								className: "size-9 rounded-full border-2 border-card object-cover shadow-soft sm:size-11"
							}, avatar.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-lg leading-tight text-foreground",
								children: "1,000+ Happy Earners"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex flex-wrap items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarRow, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-foreground",
										children: "4.8"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "whitespace-nowrap text-[11px] text-muted-foreground",
										children: "average rating"
									})
								]
							})]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "stagger-children mt-4 grid gap-4 sm:grid-cols-3",
				"data-testid": "landing-testimonials",
				children: TESTIMONIALS.map((testimonial) => {
					const avatar = avatarById(testimonial.avatarId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "surface-card flex flex-col gap-3 p-5",
						"data-testid": `landing-testimonial-${testimonial.avatarId}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarRow, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("blockquote", {
								className: "flex-1 text-sm leading-relaxed text-foreground",
								children: [
									"\"",
									testimonial.quote,
									"\""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: avatar.imageUrl,
									alt: "",
									loading: "lazy",
									className: "size-9 shrink-0 rounded-full object-cover shadow-soft ring-1 ring-border"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-semibold text-foreground",
									children: testimonial.name
								})]
							})
						]
					}, testimonial.avatarId);
				})
			})
		]
	});
}
//#endregion
export { OffersShowcase as n, TrustSection as r, EarnWaysSection as t };
