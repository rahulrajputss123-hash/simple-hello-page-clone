//#region node_modules/.nitro/vite/services/ssr/assets/types-D8DUDHOE.js
/** Provider currency -> USD wallet amount. Pure helper; no wallet writes here. */
function convertSdkCurrency(provider, currencyAmount) {
	const cents = currencyAmount / (Number(provider.currency_per_usd) || 1) * (Number(provider.reward_multiplier) || 1) * 100;
	let value = (provider.rounding_mode === "floor" ? Math.floor(cents) : provider.rounding_mode === "ceil" ? Math.ceil(cents) : Math.round(cents)) / 100;
	if (value < Number(provider.min_reward)) value = Number(provider.min_reward);
	if (provider.max_reward != null && value > Number(provider.max_reward)) value = Number(provider.max_reward);
	return Math.max(0, Math.round(value * 100) / 100);
}
//#endregion
export { convertSdkCurrency as t };
