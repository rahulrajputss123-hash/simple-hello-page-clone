import { c as mktDb, o as init_db_server } from "./advertiser.server-DyvSoHf7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/categories.server-L6n-f_NZ.js
init_db_server();
/**
* Lists all active categories
*/
async function listCategoriesImpl() {
	const { data, error } = await mktDb.from("marketplace_categories").select("id, slug, name, description, icon, sort_order").eq("is_active", true).order("sort_order");
	if (error) throw new Error(`marketplace_categories: ${error.message}`);
	return (data ?? []).map((c) => ({
		id: c.id,
		slug: c.slug,
		name: c.name,
		description: c.description,
		icon: c.icon,
		sortOrder: c.sort_order
	}));
}
/**
* Lists all categories with their subcategories
*/
async function listCategoriesWithSubcategoriesImpl() {
	const categories = await listCategoriesImpl();
	const { data: subcatsData, error: subcatsError } = await mktDb.from("marketplace_subcategories").select("id, category_id, slug, name, description, sort_order").eq("is_active", true).order("sort_order");
	if (subcatsError) throw new Error(`marketplace_subcategories: ${subcatsError.message}`);
	const subcatsByCategory = /* @__PURE__ */ new Map();
	for (const s of subcatsData ?? []) {
		if (!subcatsByCategory.has(s.category_id)) subcatsByCategory.set(s.category_id, []);
		subcatsByCategory.get(s.category_id).push({
			id: s.id,
			categoryId: s.category_id,
			slug: s.slug,
			name: s.name,
			description: s.description,
			sortOrder: s.sort_order
		});
	}
	return categories.map((cat) => ({
		...cat,
		subcategories: subcatsByCategory.get(cat.id) ?? []
	}));
}
//#endregion
export { listCategoriesWithSubcategoriesImpl };
