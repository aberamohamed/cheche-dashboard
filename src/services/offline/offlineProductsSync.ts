import {
  addOfflineProduct,
  getOfflineProductIds,
  getOfflineProducts,
} from '@/services/offline/offlineProductsDb';
import { getProductById, getTaxes, type TaxOption } from '@/services/productService';
import type { Product } from '@/types';
import { isOnlineNow } from '@/store/connectivityStore';
import { useOfflineProductsStore } from '@/store/offlineProductsStore';

let refreshInFlight: Promise<number> | null = null;
let upsertInFlight: Promise<number> | null = null;

function productMatchesOfflineId(product: Product, offlineId: string): boolean {
  return product.id === offlineId || product.productId === offlineId;
}

/**
 * Whenever products are fetched online, push matching rows into the offline catalog
 * so cached items stay up to date (price, tax, name, etc.). Fire-and-forget safe.
 */
export async function upsertOfflineCatalogFromFetched(
  products: Product[],
  taxes: TaxOption[] = []
): Promise<number> {
  if (!products.length) return 0;

  // Coalesce concurrent fetch-driven upserts.
  if (upsertInFlight) {
    await upsertInFlight.catch(() => 0);
  }

  upsertInFlight = (async (): Promise<number> => {
    const offlineIds = await getOfflineProductIds();
    if (offlineIds.length === 0) return 0;

    const offlineIdSet = new Set(offlineIds);
    const taxCatalog = taxes.length > 0 ? taxes : await getTaxes().catch(() => []);
    let updated = 0;

    for (const product of products) {
      const matchedId = offlineIds.find((id) => productMatchesOfflineId(product, id));
      if (!matchedId || !offlineIdSet.has(matchedId)) continue;

      await addOfflineProduct(
        {
          ...product,
          id: matchedId,
        },
        taxCatalog
      );
      updated += 1;
    }

    if (updated > 0) {
      await useOfflineProductsStore.getState().refresh();
    }
    return updated;
  })();

  try {
    return await upsertInFlight;
  } finally {
    upsertInFlight = null;
  }
}

/** Schedule a non-blocking upsert after any product list/detail fetch. */
export function scheduleOfflineCatalogUpsertFromFetched(products: Product[]): void {
  void upsertOfflineCatalogFromFetched(products).catch(() => undefined);
}

/**
 * Pull latest online product details for every item saved in the offline catalog,
 * and rewrite SQLite payloads. Used after sales sync / when coming online.
 */
export async function refreshOfflineProductsFromServer(): Promise<number> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async (): Promise<number> => {
    if (!isOnlineNow()) return 0;

    const localProducts = await getOfflineProducts();
    if (localProducts.length === 0) return 0;

    const taxes = await getTaxes().catch(() => []);
    let updated = 0;

    for (const local of localProducts) {
      if (!isOnlineNow()) break;

      const online =
        (await getProductById(local.id)) ??
        (local.productId && local.productId !== local.id
          ? await getProductById(local.productId)
          : null);

      if (!online) continue;

      await addOfflineProduct(
        {
          ...online,
          id: local.id,
        },
        taxes
      );
      updated += 1;
    }

    if (updated > 0) {
      await useOfflineProductsStore.getState().refresh();
    }

    return updated;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
