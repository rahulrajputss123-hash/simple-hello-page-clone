import type { CategoryRow, SubcategoryRow } from "./db.server";
import { mktDb } from "./db.server";

/**
 * Category management for the marketplace.
 * Categories are read-only for clients; admin can manage via database.
 */

export type CategoryView = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  sortOrder: number;
};

export type SubcategoryView = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

export type CategoryWithSubcategories = CategoryView & {
  subcategories: SubcategoryView[];
};

/**
 * Lists all active categories
 */
export async function listCategoriesImpl(): Promise<CategoryView[]> {
  const { data, error } = await mktDb
    .from("marketplace_categories")
    .select("id, slug, name, description, icon, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`marketplace_categories: ${error.message}`);

  return ((data ?? []) as CategoryRow[]).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    sortOrder: c.sort_order,
  }));
}

/**
 * Lists all active subcategories for a category
 */
export async function listSubcategoriesImpl(categoryId: string): Promise<SubcategoryView[]> {
  const { data, error } = await mktDb
    .from("marketplace_subcategories")
    .select("id, category_id, slug, name, description, sort_order")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`marketplace_subcategories: ${error.message}`);

  return ((data ?? []) as SubcategoryRow[]).map((s) => ({
    id: s.id,
    categoryId: s.category_id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    sortOrder: s.sort_order,
  }));
}

/**
 * Lists all categories with their subcategories
 */
export async function listCategoriesWithSubcategoriesImpl(): Promise<CategoryWithSubcategories[]> {
  const categories = await listCategoriesImpl();
  
  const { data: subcatsData, error: subcatsError } = await mktDb
    .from("marketplace_subcategories")
    .select("id, category_id, slug, name, description, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (subcatsError) throw new Error(`marketplace_subcategories: ${subcatsError.message}`);

  const subcatsByCategory = new Map<string, SubcategoryView[]>();
  for (const s of (subcatsData ?? []) as SubcategoryRow[]) {
    if (!subcatsByCategory.has(s.category_id)) {
      subcatsByCategory.set(s.category_id, []);
    }
    subcatsByCategory.get(s.category_id)!.push({
      id: s.id,
      categoryId: s.category_id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      sortOrder: s.sort_order,
    });
  }

  return categories.map((cat) => ({
    ...cat,
    subcategories: subcatsByCategory.get(cat.id) ?? [],
  }));
}
