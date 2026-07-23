import { POS_UOM_ID } from '@/constants/pos';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { apiRequest } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { KeypadCheckoutLine } from '@/store/cartStore';
import type { Product } from '@/types';
import type { ApiCategory, ApiGovernmentItemCategory, ApiProduct } from '@/types/api';
import { mapApiProduct, unwrapData, unwrapList } from '@/utils/apiHelpers';
import { generateKeypadServiceCode } from '@/utils/keypadServiceCode';
import * as FileSystem from 'expo-file-system/legacy';

export interface CreateProductInput {
  name: string;
  productType?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string | null;
  uomId?: string;
  sellingPrice: number;
  costPrice?: number;
  isStockItem?: boolean;
  minStockQty?: number;
  maxStockQty?: number;
  hsCode?: string;
  hsRate?: number;
  description?: string;
  imageUrl?: string;
  useTaxesFromCategory?: boolean;
  saleTaxIds?: string[];
  purchaseTaxIds?: string[];
}

export interface BrandOption {
  id: string;
  name: string;
}

export interface UomOption {
  id: string;
  name: string;
}

export interface TaxOption {
  id: string;
  name: string;
  rate: number;
  scope?: string;
  taxType?: string;
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  barcode?: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  code?: string;
}

export interface GovernmentItemCategory {
  id: string;
  name: string;
  code: string;
  natureOfSupplyCode?: string;
  defaultTaxCode?: string;
  taxCodes: string[];
}

export interface CategoryDetail {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentCategoryId?: string;
  saleTaxIds: string[];
  purchaseTaxIds: string[];
  isActive: boolean;
  governmentCategoryId?: string;
  governmentCategoryName?: string;
  governmentCategoryCode?: string;
  governmentTaxCode?: string;
}

const SEARCH_PAGE_SIZE = 10;
const DEFAULT_SERVICE_CATEGORY_CODE = 'DFSC';

let cachedDefaultUomId: string | null = null;
let cachedDefaultServiceCategoryId: string | null = null;

async function resolveDefaultUomId(): Promise<string> {
  if (cachedDefaultUomId) return cachedDefaultUomId;

  try {
    const response = await apiRequest<unknown>('/inventory/uoms');
    const uoms = unwrapList<{ id?: string }>(response);
    const first = uoms.find((uom) => uom.id);
    if (first?.id) {
      cachedDefaultUomId = String(first.id);
      return cachedDefaultUomId;
    }
  } catch {
    // Fall back to the POS default UOM constant.
  }

  cachedDefaultUomId = POS_UOM_ID;
  return cachedDefaultUomId;
}

async function fetchProducts(params: ProductListParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.pageSize ?? SEARCH_PAGE_SIZE));
  if (params.search) query.set('search', params.search.trim());
  if (params.categoryId) query.set('category_id', params.categoryId);
  if (params.barcode) query.set('barcode', params.barcode.trim());

  const response = await apiRequest<unknown>(`/inventory/products?${query.toString()}`);
  const products = unwrapList<ApiProduct>(response).map(mapApiProduct);
  // Keep offline SQLite catalog in sync whenever items are fetched online.
  void import('@/services/offline/offlineProductsSync')
    .then((m) => m.scheduleOfflineCatalogUpsertFromFetched(products))
    .catch(() => undefined);
  return products;
}

export async function getProducts(): Promise<Product[]> {
  return fetchProducts({ pageSize: 50 });
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await apiRequest<unknown>(`/inventory/products/${id}`);
    const raw = unwrapData<ApiProduct>(response);
    const product = raw?.id || raw?.product_id ? mapApiProduct(raw) : null;
    if (product) {
      void import('@/services/offline/offlineProductsSync')
        .then((m) => m.scheduleOfflineCatalogUpsertFromFetched([product]))
        .catch(() => undefined);
    }
    return product;
  } catch {
    return null;
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const trimmed = barcode.trim();
  if (!trimmed) return null;

  const results = await fetchProducts({ barcode: trimmed, pageSize: SEARCH_PAGE_SIZE });
  return results[0] ?? null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return fetchProducts({ search: trimmed, pageSize: SEARCH_PAGE_SIZE });
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (!categoryId || categoryId === 'all') return getProducts();
  return fetchProducts({ categoryId, pageSize: 50 });
}

function mapCategoryDetail(raw: ApiCategory): CategoryDetail {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    code: raw.code ?? raw.default_code ?? undefined,
    description: raw.description ?? undefined,
    parentCategoryId: raw.parent_id ?? raw.parent_category_id ?? undefined,
    saleTaxIds: Array.isArray(raw.taxes_id) ? raw.taxes_id.map(String) : [],
    purchaseTaxIds: Array.isArray(raw.supplier_taxes_id) ? raw.supplier_taxes_id.map(String) : [],
    isActive: raw.active ?? raw.is_active ?? true,
    governmentCategoryId: raw.eirms_item_category_id ?? undefined,
    governmentCategoryName: raw.eirms_item_category_name ?? undefined,
    governmentCategoryCode: raw.eirms_item_category_code ?? undefined,
    governmentTaxCode: raw.eirms_tax_code ?? undefined,
  };
}

export async function getCategories(): Promise<CategoryDetail[]> {
  const response = await apiRequest<unknown>('/inventory/categories');
  return unwrapList<ApiCategory>(response).map(mapCategoryDetail);
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest<unknown>(`/inventory/categories/${id}`, { method: 'DELETE' });
}

export async function resolveDefaultServiceCategoryId(): Promise<string | null> {
  if (cachedDefaultServiceCategoryId) return cachedDefaultServiceCategoryId;

  try {
    const response = await apiRequest<unknown>('/inventory/categories');
    const categories = unwrapList<ApiCategory>(response);
    const match =
      categories.find(
        (category) =>
          String(category.code ?? '')
            .trim()
            .toUpperCase() === DEFAULT_SERVICE_CATEGORY_CODE
      ) ??
      categories.find((category) => category.name === 'Default Service Category1');

    if (match?.id) {
      cachedDefaultServiceCategoryId = String(match.id);
      return cachedDefaultServiceCategoryId;
    }
  } catch {
    // Fall back to empty category when lookup fails.
  }

  return null;
}

export async function getGovernmentItemCategories(
  refresh = false
): Promise<GovernmentItemCategory[]> {
  const query = refresh ? '?refresh=1' : '';
  const response = await apiRequest<unknown>(`/inventory/eirms/item-categories${query}`);
  return unwrapList<ApiGovernmentItemCategory>(response)
    .filter((category) => category.id)
    .map((category) => ({
      id: String(category.id),
      name: String(category.name ?? ''),
      code: String(category.code ?? ''),
      natureOfSupplyCode: category.natureOfSupplyCode
        ? String(category.natureOfSupplyCode)
        : undefined,
      defaultTaxCode: category.defaultTaxCode ? String(category.defaultTaxCode) : undefined,
      taxCodes: Array.isArray(category.taxCodes) ? category.taxCodes.map(String) : [],
    }));
}

export interface CreateCategoryInput {
  name: string;
  code?: string;
  parentCategoryId?: string;
  description?: string;
  saleTaxIds?: string[];
  purchaseTaxIds?: string[];
  isActive?: boolean;
  governmentCategoryId?: string;
  governmentCategoryName?: string;
  governmentCategoryCode?: string;
  governmentTaxCode?: string;
}

function buildCategoryRequestBody(input: CreateCategoryInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    code: input.code?.trim() ?? '',
    description: input.description?.trim() ?? '',
    taxes_id: input.saleTaxIds ?? [],
    supplier_taxes_id: input.purchaseTaxIds ?? [],
    active: input.isActive ?? true,
    parent_id: input.parentCategoryId || null,
    eirms_item_category_id: input.governmentCategoryId ?? null,
    eirms_item_category_name: input.governmentCategoryName ?? null,
    eirms_item_category_code: input.governmentCategoryCode ?? null,
    eirms_tax_code: input.governmentTaxCode ?? null,
  };

  return body;
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryOption> {
  const response = await apiRequest<unknown>('/inventory/categories', {
    method: 'POST',
    body: buildCategoryRequestBody(input),
  });
  const raw = unwrapData<ApiCategory>(response);
  return {
    id: String(raw.id),
    name: String(raw.name ?? input.name.trim()),
  };
}

export async function updateCategory(
  id: string,
  input: CreateCategoryInput
): Promise<CategoryOption> {
  const response = await apiRequest<unknown>(`/inventory/categories/${id}`, {
    method: 'PUT',
    body: buildCategoryRequestBody(input),
  });
  const raw = unwrapData<ApiCategory>(response);
  return {
    id: String(raw.id ?? id),
    name: String(raw.name ?? input.name.trim()),
  };
}

export async function getBrands(): Promise<BrandOption[]> {
  const response = await apiRequest<unknown>('/inventory/brands');
  return unwrapList<{ id?: string; name?: string }>(response)
    .filter((brand) => brand.id)
    .map((brand) => ({
      id: String(brand.id),
      name: String(brand.name ?? 'Unbranded'),
    }));
}

export async function getUoms(): Promise<UomOption[]> {
  const response = await apiRequest<unknown>('/inventory/uoms');
  return unwrapList<{ id?: string; name?: string }>(response)
    .filter((uom) => uom.id)
    .map((uom) => ({
      id: String(uom.id),
      name: String(uom.name ?? 'Unit'),
    }));
}

function mapApiTax(raw: Record<string, unknown>): TaxOption | null {
  const id = raw.id;
  if (id == null) return null;
  if (raw.is_active === false) return null;

  const name = String(raw.tax_name ?? raw.name ?? 'Tax');
  const taxType = raw.taxType ?? raw.tax_type ?? raw.scope ?? raw.type;
  return {
    id: String(id),
    name,
    rate: Number(raw.rate ?? raw.amount ?? 0),
    scope: taxType ? String(taxType) : undefined,
    taxType: taxType ? String(taxType) : undefined,
  };
}

export async function getTaxes(): Promise<TaxOption[]> {
  try {
    const response = await apiRequest<unknown>('/purchase/taxes?page_size=100');
    return unwrapList<Record<string, unknown>>(response)
      .map(mapApiTax)
      .filter((tax): tax is TaxOption => tax !== null);
  } catch {
    return [];
  }
}

export async function getDefaultUomId(): Promise<string> {
  return resolveDefaultUomId();
}

export async function getLowStockProducts(): Promise<Product[]> {
  const products = await fetchProducts({ pageSize: 200 });
  return products.filter((p) => p.stock <= p.lowStockAlert);
}

function resolveUploadUrl(response: unknown): string {
  const data = unwrapData<Record<string, unknown>>(response);
  const candidates = [data.url, data.image_url, data.file_url, data.path];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  throw new Error('Upload did not return a file URL');
}

function getImageFileMeta(uri: string): { name: string; type: string } {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return { name: 'product.png', type: 'image/png' };
  if (ext === 'webp') return { name: 'product.webp', type: 'image/webp' };
  if (ext === 'heic' || ext === 'heif') return { name: 'product.heic', type: 'image/heic' };
  return { name: 'product.jpg', type: 'image/jpeg' };
}

export function toUploadItemName(name?: string): string {
  const slug = (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'new-product';
}

export async function uploadProductImage(
  localUri: string,
  itemName = 'new-product'
): Promise<string> {
  const { type } = getImageFileMeta(localUri);
  const url = buildApiUrl(API_CONFIG.baseUrl, '/upload');
  const { token } = useAuthStore.getState();

  const result = await FileSystem.uploadAsync(url, localUri, {
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: type,
    parameters: { item_name: toUploadItemName(itemName) },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (result.status < 200 || result.status >= 300) {
    let message = `Upload failed (${result.status})`;
    try {
      const parsed = JSON.parse(result.body) as Record<string, unknown>;
      if (typeof parsed.message === 'string') message = parsed.message;
      else if (typeof parsed.error === 'string') message = parsed.error;
    } catch {
      if (result.body?.trim()) message = result.body;
    }
    throw new Error(message);
  }

  return resolveUploadUrl(JSON.parse(result.body));
}

async function buildProductRequestBody(
  input: CreateProductInput,
  uomId: string
): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    type: input.productType ?? 'storable',
    default_code: input.sku?.trim() ?? '',
    barcode: input.barcode?.trim() ?? '',
    description: input.description?.trim() ?? '',
    category_id: input.categoryId ?? '',
    brand_id: input.brandId ?? null,
    list_price: input.sellingPrice,
    standard_price: input.costPrice ?? 0,
    uom_id: uomId,
    sale_ok: true,
    purchase_ok: true,
    is_stock_item: input.isStockItem ?? true,
    is_published: true,
    active: true,
    min_stock_qty: input.minStockQty ?? 0,
    max_stock_qty: input.maxStockQty ?? 100,
    hs_code: input.hsCode ?? '',
    hs_rate: input.hsRate ?? 0,
    attribute_lines: [],
    attributes: [],
    variants: [],
  };

  if (input.imageUrl?.trim()) {
    body.image_url = input.imageUrl.trim();
  }

  if (!input.useTaxesFromCategory && input.saleTaxIds?.length) {
    body.taxes_id = input.saleTaxIds;
  }

  return body;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const uomId = input.uomId ?? (await resolveDefaultUomId());
  const body = await buildProductRequestBody(input, uomId);

  const response = await apiRequest<unknown>('/inventory/products', {
    method: 'POST',
    body,
  });
  const raw = unwrapData<ApiProduct>(response);
  const product = mapApiProduct(raw);
  void import('@/services/offline/offlineProductsSync')
    .then((m) => m.scheduleOfflineCatalogUpsertFromFetched([product]))
    .catch(() => undefined);
  return product;
}

/** Registers an ad-hoc keypad service using the same defaults as Add Item (type: service). */
export async function registerKeypadServiceProduct(
  name: string,
  sellingPrice: number
): Promise<Product> {
  const categoryId = (await resolveDefaultServiceCategoryId()) ?? '';

  return createProduct({
    name: name.trim(),
    productType: 'service',
    sku: generateKeypadServiceCode(name),
    barcode: '',
    description: '',
    categoryId,
    brandId: null,
    sellingPrice,
    costPrice: 0,
    isStockItem: false,
    minStockQty: 0,
    maxStockQty: 0,
    hsCode: '',
    hsRate: 0,
    useTaxesFromCategory: true,
    saleTaxIds: [],
    purchaseTaxIds: [],
  });
}

export async function resolveKeypadCheckoutLines(
  lines: KeypadCheckoutLine[]
): Promise<KeypadCheckoutLine[]> {
  const resolved: KeypadCheckoutLine[] = [];

  for (const line of lines) {
    if (line.serviceId || line.amount <= 0) {
      resolved.push(line);
      continue;
    }

    const noteName = line.note?.trim();
    if (!noteName) {
      resolved.push(line);
      continue;
    }

    const product = await registerKeypadServiceProduct(noteName, line.amount);
    resolved.push({
      ...line,
      serviceId: product.productId,
      serviceName: product.name,
      serviceUomId: product.uomId,
      serviceTaxesIds: product.taxesIds,
    });
  }

  return resolved;
}

export async function updateProduct(id: string, input: CreateProductInput): Promise<Product> {
  const uomId = input.uomId ?? (await resolveDefaultUomId());
  const body = await buildProductRequestBody(input, uomId);

  const response = await apiRequest<unknown>(`/inventory/products/${id}`, {
    method: 'PUT',
    body,
  });
  const raw = unwrapData<ApiProduct>(response);
  const product = mapApiProduct(raw);
  void import('@/services/offline/offlineProductsSync')
    .then((m) => m.scheduleOfflineCatalogUpsertFromFetched([product]))
    .catch(() => undefined);
  return product;
}
