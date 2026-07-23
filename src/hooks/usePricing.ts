import {
  fetchCoupons,
  fetchCurrencyCodes,
  fetchExchangeRates,
  fetchGiftCards,
  fetchItemPrices,
  fetchPriceTypes,
  fetchPromotions,
  fetchPromotionConditions,
  fetchPromotionRewardTypes,
} from '@/services/pricingService';
import { useQuery } from '@tanstack/react-query';

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
  });
}

export function useGiftCards() {
  return useQuery({
    queryKey: ['gift-cards'],
    queryFn: fetchGiftCards,
  });
}

export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: fetchPromotions,
  });
}

export function usePromotionFormOptions() {
  return useQuery({
    queryKey: ['promotion-form-options'],
    queryFn: async () => {
      const [conditions, rewardTypes] = await Promise.all([
        fetchPromotionConditions(),
        fetchPromotionRewardTypes(),
      ]);
      return { conditions, rewardTypes };
    },
  });
}

export function useItemPrices() {
  return useQuery({
    queryKey: ['item-prices'],
    queryFn: fetchItemPrices,
  });
}

export function useItemPriceFormOptions() {
  return useQuery({
    queryKey: ['item-price-form-options'],
    queryFn: async () => {
      const priceTypes = await fetchPriceTypes();
      return { priceTypes };
    },
  });
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: fetchExchangeRates,
  });
}

export function useExchangeRateFormOptions() {
  return useQuery({
    queryKey: ['exchange-rate-form-options'],
    queryFn: async () => {
      const currencyCodes = await fetchCurrencyCodes();
      return { currencyCodes };
    },
  });
}
