import { getTaxes, type TaxOption } from '@/services/productService';
import type { Product } from '@/types';
import { enrichProductWithTaxes } from '@/utils/productTaxLabel';
import { getOfflineDatabase } from '@/services/offline/db';

type OfflineProductRow = {
  id: string;
  product_id: string | null;
  name: string;
  payload: string;
  created_at: string;
};

async function resolveTaxesForSnapshot(fallback: TaxOption[]): Promise<TaxOption[]> {
  if (fallback.length > 0) return fallback;
  try {
    return await getTaxes();
  } catch {
    return fallback;
  }
}

/** Add (or refresh) a product/service in the offline catalog with full tax snapshot. */
export async function addOfflineProduct(
  product: Product,
  taxes: TaxOption[] = []
): Promise<void> {
  const taxCatalog = await resolveTaxesForSnapshot(taxes);
  const enriched = enrichProductWithTaxes(product, taxCatalog);
  const db = await getOfflineDatabase();
  await db.runAsync(
    `INSERT INTO offline_products (id, product_id, name, payload, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       product_id = excluded.product_id,
       name = excluded.name,
       payload = excluded.payload`,
    enriched.id,
    enriched.productId ?? null,
    enriched.name,
    JSON.stringify(enriched),
    new Date().toISOString()
  );
}

export async function removeOfflineProduct(productId: string): Promise<void> {
  const db = await getOfflineDatabase();
  await db.runAsync(`DELETE FROM offline_products WHERE id = ?`, productId);
}

/** Full offline catalog, as Product objects ready for the Sell screen. */
export async function getOfflineProducts(): Promise<Product[]> {
  const db = await getOfflineDatabase();
  const rows = await db.getAllAsync<OfflineProductRow>(
    `SELECT * FROM offline_products ORDER BY name COLLATE NOCASE ASC`
  );
  return rows.map((row) => JSON.parse(row.payload) as Product);
}

/**
 * Backfill tax snapshots on saved offline items that only have taxesIds.
 * Safe to call whenever the taxes catalog is available.
 */
export async function backfillOfflineProductTaxes(taxes: TaxOption[]): Promise<number> {
  if (taxes.length === 0) return 0;
  const products = await getOfflineProducts();
  let updated = 0;
  for (const product of products) {
    const needsTax =
      (product.taxesIds?.length ?? 0) > 0 && !(product.taxes && product.taxes.length > 0);
    if (!needsTax) continue;
    await addOfflineProduct(product, taxes);
    updated += 1;
  }
  return updated;
}

/** Set of product ids currently registered offline (for toggle state). */
export async function getOfflineProductIds(): Promise<string[]> {
  const db = await getOfflineDatabase();
  const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM offline_products`);
  return rows.map((row) => row.id);
}

export async function countOfflineProducts(): Promise<number> {
  const db = await getOfflineDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM offline_products`
  );
  return row?.count ?? 0;
}
