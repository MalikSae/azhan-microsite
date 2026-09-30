import test from 'node:test';
import assert from 'node:assert/strict';
import { localTransferDate, chooseBooking, requirements, documentProgress, paymentFileError } from '../src/lib/portalPolicy.mjs';
test('midnight WIB keeps the actual local transfer date', () => {
  assert.equal(localTransferDate(new Date('2026-09-27T17:30:00Z')), '2026-09-28');
});
test('explicit booking remains selected regardless of list ordering', () => {
  const items = [{ id: 2, status: 'lunas' }, { id: 1, status: 'dp' }];
  assert.equal(chooseBooking(items, '1').id, 1);
  assert.equal(chooseBooking(items, '3'), null);
  assert.equal(chooseBooking(items).id, 1);
});
test('optional documents do not prevent complete required progress', () => {
  const items = requirements({ tanggal_lahir: '1990-01-01' }, { berangkat_tanggal: '2026-12-01' });
  const docs = items.filter(i => i.required).map(i => ({ jenis: i.jenis, status: 'approved' }));
  assert.deepEqual(documentProgress(docs, items), { approved: 5, total: 5 });
  docs[0].status = 'rejected';
  assert.equal(documentProgress(docs, items).approved, 4);
});
test('child document requirements replace KTP with birth certificate', () => {
  const items = requirements({ tanggal_lahir: '2020-10-01' }, { berangkat_tanggal: '2026-12-01' });
  assert.equal(items.find(i => i.jenis === 'ktp').required, false);
  assert.equal(items.find(i => i.jenis === 'akte_lahir').required, true);
});
test('payment evidence validates type and size', () => {
  assert.equal(paymentFileError({ type: 'application/pdf', size: 100 }), null);
  assert.ok(paymentFileError({ type: 'application/pdf', size: 6 * 1024 * 1024 }));
  assert.ok(paymentFileError({ type: 'text/html', size: 100 }));
  assert.ok(paymentFileError(null));
});
