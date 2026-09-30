// Shared display policy. Money must come from the API, including explicit zero.
export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function packagePricing(schedule) {
  const infant = schedule?.harga_infant;
  return {
    infantAvailable: typeof infant === 'number' && infant >= 0,
    infantPrice: typeof infant === 'number' ? infant : 0,
    dp: schedule?.effective_minimal_dp ?? null,
  };
}

export function roomSavings(schedule, room) {
  if (!schedule?.is_promo || room !== 'quad') return 0;
  return Math.max(0, (schedule.harga_coret ?? 0) - (schedule.harga_quad ?? 0));
}

export function matchesCategory(schedule, category) {
  if (category === 'all') return true;
  if (category === 'promo') return Boolean(schedule.is_promo);
  return String(schedule.category_id) === String(category) || schedule.category?.slug === category;
}

export function scheduleBelongsToBrand(schedule, brandId) {
  return Number(brandId) > 0 && Number(schedule?.brand_id) === Number(brandId);
}
