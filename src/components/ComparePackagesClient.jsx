'use client';

import { useMemo, useState } from 'react';

const formatRupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(value || 0);

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getDuration = (schedule) => {
  if (!schedule?.berangkat_tanggal || !schedule?.pulang_tanggal) return '-';
  return `${Math.round((new Date(schedule.pulang_tanggal) - new Date(schedule.berangkat_tanggal)) / 86400000) + 1} hari`;
};

function Value({ children, strong = false, winner = false }) {
  return (
    <div className={`relative min-w-0 break-words px-3 py-3 text-xs leading-5 ${strong ? 'font-bold text-neutral-900' : 'text-neutral-700'} ${winner ? 'bg-success-50/70' : ''}`}>
      {winner && <span className="mb-1 inline-flex rounded-full bg-success-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-success-700">Lebih hemat</span>}
      <div>{children ?? '-'}</div>
    </div>
  );
}

function CompareRow({ label, left, right, strong = false, leftWinner = false, rightWinner = false }) {
  return (
    <section className="border-b border-neutral-100 last:border-b-0">
      <h3 className="bg-neutral-50 px-3 py-1.5 text-center text-[9px] font-extrabold uppercase tracking-[0.12em] text-neutral-400">{label}</h3>
      <div className="grid grid-cols-2 divide-x divide-neutral-200">
        <Value strong={strong} winner={leftWinner}>{left}</Value>
        <Value strong={strong} winner={rightWinner}>{right}</Value>
      </div>
    </section>
  );
}

function ItemList({ items, included = true }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return <span className="text-neutral-400">Belum tersedia</span>;
  return (
    <ul className="space-y-1.5" role="list">
      {list.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-1.5">
          <span className={included ? 'font-bold text-success-600' : 'text-neutral-400'} aria-hidden="true">{included ? '✓' : '–'}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HotelValue({ hotel }) {
  if (!hotel) return '-';
  return (
    <div>
      <p className="font-semibold text-neutral-900">{hotel.name}</p>
      <p className="mt-0.5 text-[11px] text-neutral-500">{hotel.star_rating || 0}★ • ±{hotel.distance_m ?? '-'}m</p>
    </div>
  );
}

function RouteValue({ schedule, direction }) {
  const isDeparture = direction === 'departure';
  const origin = isDeparture ? schedule.berangkat_bandara_asal : schedule.pulang_bandara_asal;
  const destination = isDeparture ? schedule.berangkat_bandara_tujuan : schedule.pulang_bandara_tujuan;
  const code = isDeparture ? schedule.berangkat_kode_penerbangan : schedule.pulang_kode_penerbangan;
  const transit = !schedule.is_direct_flight ? schedule.transit_bandara : '';
  if (!origin && !destination) return '-';
  return (
    <div>
      <div className="space-y-1 font-semibold text-neutral-900">
        <p>{origin || '-'}</p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand" aria-hidden="true">
          <span className="h-px flex-1 bg-brand/25" />
          <span>↓</span>
          <span className="h-px flex-1 bg-brand/25" />
        </div>
        {transit && (
          <>
            <p className="rounded-lg bg-warning-50 px-2 py-1 text-[11px] text-warning-800">
              Transit {transit}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand" aria-hidden="true">
              <span className="h-px flex-1 bg-brand/25" />
              <span>↓</span>
              <span className="h-px flex-1 bg-brand/25" />
            </div>
          </>
        )}
        <p>{destination || '-'}</p>
      </div>
      <p className="mt-2 text-[10px] text-neutral-500">
        {code || 'Nomor penerbangan belum tersedia'} • {transit ? 'Transit' : 'Direct flight'}
      </p>
    </div>
  );
}

const lowestPrice = (schedule) => Math.min(...[schedule?.harga_quad, schedule?.harga_triple, schedule?.harga_double].filter((price) => Number(price) > 0));

function PackageSummary({ label, schedule, tone }) {
  return (
    <article className={`min-w-0 p-3.5 ${tone === 'brand' ? 'bg-brand text-white' : 'bg-neutral-900 text-white'}`}>
      <span className="inline-flex rounded-full bg-white/15 px-2 py-1 text-[9px] font-extrabold uppercase tracking-widest">{label}</span>
      <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-extrabold leading-5">{schedule.jadwal_nama}</h2>
      <p className="mt-1 text-[10px] text-white/70">Mulai dari</p>
      <p className="mt-0.5 text-sm font-extrabold">{formatRupiah(lowestPrice(schedule))}</p>
    </article>
  );
}

export default function ComparePackagesClient({ schedules = [], initialPackageId = '', initialOpponentId = '' }) {
  const initialPackage = useMemo(
    () => schedules.find((item) => String(item.id) === String(initialPackageId)) || schedules[0] || null,
    [schedules, initialPackageId],
  );
  const validInitialOpponent = schedules.some((item) => String(item.id) === String(initialOpponentId) && String(item.id) !== String(initialPackage?.id)) ? String(initialOpponentId) : '';
  const [opponentId, setOpponentId] = useState(validInitialOpponent);
  const [comparedOpponentId, setComparedOpponentId] = useState(validInitialOpponent);

  const opponents = schedules.filter((item) => String(item.id) !== String(initialPackage?.id));
  const opponent = schedules.find((item) => String(item.id) === comparedOpponentId) || null;

  const handleCompare = () => {
    if (!opponentId) return;
    setComparedOpponentId(opponentId);
    const params = new URLSearchParams({ paket: String(initialPackage.id), lawan: opponentId });
    window.history.replaceState(null, '', `/compare?${params.toString()}`);
  };

  if (!initialPackage) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center">
        <p className="font-semibold text-neutral-800">Belum ada paket untuk dibandingkan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="bg-neutral-900 px-4 py-3 text-white">
          <p className="text-sm font-extrabold">Pilih lawan paket</p>
          <p className="mt-0.5 text-[11px] text-neutral-300">Temukan pilihan terbaik untuk perjalanan Anda</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="min-w-0 rounded-xl border border-brand/25 bg-brand/5 p-3">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-brand">Paket A</p>
              <p className="mt-1 line-clamp-2 text-xs font-bold leading-4 text-neutral-900">{initialPackage.jadwal_nama}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-black text-neutral-500">VS</div>
            <div className="min-w-0">
              <label htmlFor="opponent-package" className="sr-only">Pilih Paket B</label>
              <select id="opponent-package" value={opponentId} onChange={(event) => setOpponentId(event.target.value)} className="h-full min-h-16 w-full rounded-xl border border-neutral-300 bg-white px-2.5 py-2 text-xs font-semibold text-neutral-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand">
                <option value="">Pilih Paket B</option>
                {opponents.map((item) => <option key={item.id} value={item.id}>{item.jadwal_nama}</option>)}
              </select>
            </div>
          </div>
          <button type="button" onClick={handleCompare} disabled={!opponentId} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-white transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
            <span aria-hidden="true">⇄</span> Bandingkan Sekarang
          </button>
        </div>
      </section>

      {opponent && (
        <section aria-label="Hasil perbandingan paket" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-white/20">
            <PackageSummary label="Paket A" schedule={initialPackage} tone="brand" />
            <PackageSummary label="Paket B" schedule={opponent} />
          </div>

          <CompareRow label="Nama Paket" left={initialPackage.jadwal_nama} right={opponent.jadwal_nama} strong />
          <CompareRow label="Durasi" left={getDuration(initialPackage)} right={getDuration(opponent)} />
          <CompareRow label="Tanggal Berangkat" left={formatDate(initialPackage.berangkat_tanggal)} right={formatDate(opponent.berangkat_tanggal)} />
          <CompareRow label="Tanggal Pulang" left={formatDate(initialPackage.pulang_tanggal)} right={formatDate(opponent.pulang_tanggal)} />
          <CompareRow label="Maskapai" left={initialPackage.maskapai?.name || '-'} right={opponent.maskapai?.name || '-'} />
          <CompareRow label="Perjalanan Berangkat" left={<RouteValue schedule={initialPackage} direction="departure" />} right={<RouteValue schedule={opponent} direction="departure" />} />
          <CompareRow label="Perjalanan Pulang" left={<RouteValue schedule={initialPackage} direction="return" />} right={<RouteValue schedule={opponent} direction="return" />} />
          <CompareRow label="Hotel Mekkah" left={<HotelValue hotel={initialPackage.hotel_mekkah} />} right={<HotelValue hotel={opponent.hotel_mekkah} />} />
          <CompareRow label="Hotel Madinah" left={<HotelValue hotel={initialPackage.hotel_madinah} />} right={<HotelValue hotel={opponent.hotel_madinah} />} />
          <CompareRow label="Sisa Kursi" left={`${initialPackage.seat_sisa ?? 0} dari ${initialPackage.seat_total ?? 0}`} right={`${opponent.seat_sisa ?? 0} dari ${opponent.seat_total ?? 0}`} />
          <CompareRow label="Harga Quad" left={formatRupiah(initialPackage.harga_quad)} right={formatRupiah(opponent.harga_quad)} strong leftWinner={Number(initialPackage.harga_quad) < Number(opponent.harga_quad)} rightWinner={Number(opponent.harga_quad) < Number(initialPackage.harga_quad)} />
          <CompareRow label="Harga Triple" left={formatRupiah(initialPackage.harga_triple)} right={formatRupiah(opponent.harga_triple)} strong leftWinner={Number(initialPackage.harga_triple) < Number(opponent.harga_triple)} rightWinner={Number(opponent.harga_triple) < Number(initialPackage.harga_triple)} />
          <CompareRow label="Harga Double" left={formatRupiah(initialPackage.harga_double)} right={formatRupiah(opponent.harga_double)} strong leftWinner={Number(initialPackage.harga_double) < Number(opponent.harga_double)} rightWinner={Number(opponent.harga_double) < Number(initialPackage.harga_double)} />
          <CompareRow label="Sudah Termasuk" left={<ItemList items={initialPackage.include_items} />} right={<ItemList items={opponent.include_items} />} />
          <CompareRow label="Belum Termasuk" left={<ItemList items={initialPackage.exclude_items} included={false} />} right={<ItemList items={opponent.exclude_items} included={false} />} />
        </section>
      )}
    </div>
  );
}
