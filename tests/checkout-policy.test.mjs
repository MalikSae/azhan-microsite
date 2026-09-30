import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentTerms, validPhone, validInfant } from '../src/lib/checkoutPolicy.mjs';

test('late departures require full payment; earlier departures honor explicit zero DP', () => {
 const now = new Date('2026-09-28T03:00:00Z');
 assert.deepEqual(paymentTerms({berangkat_tanggal:'2026-10-28',effective_minimal_dp:5000000},2,42000000,now),{fullPayment:true,minimum:42000000});
 assert.deepEqual(paymentTerms({berangkat_tanggal:'2027-01-01',effective_minimal_dp:0},2,42000000,now),{fullPayment:false,minimum:0});
 assert.equal(paymentTerms({berangkat_tanggal:'2027-01-01',effective_minimal_dp:5000000},2,42000000,now).minimum,10000000);
});
test('infant uses calendar birthday and rejects future or invalid birth dates', () => {
 assert.equal(validInfant('2024-10-28','2026-10-28','2026-09-28'),false);
 assert.equal(validInfant('2024-10-29','2026-10-28','2026-09-28'),true);
 assert.equal(validInfant('2026-10-01','2026-10-28','2026-09-28'),false);
 assert.equal(validInfant('2026-02-30','2026-10-28','2026-09-28'),false);
});
test('phone validation uses the same 10–15 digit bound throughout the wizard', () => {
 assert.equal(validPhone('0812345678'),true);
 assert.equal(validPhone('081234567'),false);
 assert.equal(validPhone('0812345678901234'),false);
 assert.equal(validPhone('abcdefghij'),false);
});
