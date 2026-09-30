import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeJsonLd, packagePricing, roomSavings, matchesCategory, scheduleBelongsToBrand } from '../src/lib/packagePolicy.mjs';
import { bindRequestBrand } from '../src/lib/requestBrand.js';

test('JSON-LD cannot close its script element, while JSON data stays intact', () => {
  const data = { name: '</script><img src=x onerror=alert(1)>' };
  const serialized = serializeJsonLd(data);
  assert.equal(serialized.includes('<'), false);
  assert.deepEqual(JSON.parse(serialized), data);
});

test('infant null is unavailable; explicit zero is free; DP uses effective backend value', () => {
  assert.deepEqual(packagePricing({ harga_infant: null, effective_minimal_dp: 7_000_000 }), {infantAvailable:false, infantPrice:0, dp:7_000_000});
  assert.deepEqual(packagePricing({ harga_infant: 0, effective_minimal_dp: 0 }), {infantAvailable:true, infantPrice:0, dp:0});
  assert.equal(packagePricing({ minimal_dp: 8_000_000 }).dp, null);
});

test('Quad promotion is not advertised for Double or Triple', () => {
  const schedule = { is_promo:true, harga_coret:30_000_000, harga_quad:28_500_000 };
  assert.equal(roomSavings(schedule, 'quad'), 1_500_000);
  assert.equal(roomSavings(schedule, 'double'), 0);
  assert.equal(roomSavings(schedule, 'triple'), 0);
});

test('category comes from API identity, not words in package name', () => {
  const schedule = { jadwal_nama:'Umroh Plus Dubai', category_id:4, category:{slug:'plus-dubai'} };
  assert.equal(matchesCategory(schedule, 'reguler'), false);
  assert.equal(matchesCategory(schedule, 'plus-dubai'), true);
  assert.equal(matchesCategory(schedule, '4'), true);
});

test('public page rejects a package from another brand', () => {
  assert.equal(scheduleBelongsToBrand({ brand_id:2 }, '3'), false);
  assert.equal(scheduleBelongsToBrand({ brand_id:3 }, '3'), true);
  assert.equal(scheduleBelongsToBrand({ brand_id:0 }, null), false);
});

test('public proxy rejects cross-brand body and binds missing brand to hostname', async t => {
  const seen = [];
  t.mock.method(globalThis, 'fetch', async url => {
    seen.push(url);
    return Response.json({ id:3 });
  });
  const request = new Request('http://hana.azhan.test/api/public/book', { headers:{host:'hana.azhan.test', 'x-brand-id':'2'} });
  await assert.rejects(bindRequestBrand(request, {brand_id:2}), err => err.status === 400);
  assert.deepEqual(await bindRequestBrand(request, {}), {brand_id:3});
  assert.ok(seen.every(url => url.endsWith('domain=hana.azhan.test')));
});

test('public proxy fails closed when brand resolution is unavailable', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('', {status:503}));
  await assert.rejects(bindRequestBrand(new Request('http://hana.azhan.test', {headers:{host:'hana.azhan.test'}}), {}), err => err.status === 503);
});
