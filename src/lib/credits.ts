/**
 * Usage credits, kept in this browser only (localStorage).
 *
 * - Everyone gets FREE_DAILY credits that refill at 00:00 (local time) each day.
 * - Monthly Pro Pass adds PRO_MONTHLY credits that reset each calendar month.
 * - Credit packs add credits that never expire.
 * Spending order: today's free credits → Pro monthly credits → pack credits.
 */
import { useSyncExternalStore } from "react";

import { isPro } from "./plan";

export const FREE_DAILY = 250;
export const PRO_MONTHLY = 25_000;
export const RUN_COST = 20;
export const CREDITS_KEY = "gtr.credits.v1";

export type CreditState = {
  /** Local date (YYYY-MM-DD) the free usage belongs to. */
  day: string;
  freeUsed: number;
  /** Local month (YYYY-MM) the Pro usage belongs to. */
  month: string;
  proUsed: number;
  /** Non-expiring credits from packs. */
  pack: number;
};

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** Rolls the daily/monthly counters over when the date has changed. */
export function normalize(s: CreditState, now: Date): CreditState {
  const day = dayKey(now);
  const month = monthKey(now);
  return {
    ...s,
    day,
    freeUsed: s.day === day ? s.freeUsed : 0,
    month,
    proUsed: s.month === month ? s.proUsed : 0,
  };
}

export function balance(s: CreditState, pro: boolean) {
  const free = Math.max(0, FREE_DAILY - s.freeUsed);
  const monthly = pro ? Math.max(0, PRO_MONTHLY - s.proUsed) : 0;
  return { free, monthly, pack: s.pack, total: free + monthly + s.pack };
}

/** Deducts `cost`; returns null when there isn't enough. */
export function spend(s: CreditState, cost: number, pro: boolean): CreditState | null {
  const b = balance(s, pro);
  if (b.total < cost) return null;
  let left = cost;
  const fromFree = Math.min(left, b.free);
  left -= fromFree;
  const fromPro = Math.min(left, b.monthly);
  left -= fromPro;
  return { ...s, freeUsed: s.freeUsed + fromFree, proUsed: s.proUsed + fromPro, pack: s.pack - left };
}

export function emptyState(now: Date): CreditState {
  return { day: dayKey(now), freeUsed: 0, month: monthKey(now), proUsed: 0, pack: 0 };
}

let cache: CreditState | null = null;
const listeners = new Set<() => void>();

function load(): CreditState {
  const now = new Date();
  if (!cache) {
    cache = emptyState(now);
    if (typeof window !== "undefined") {
      try {
        const raw = JSON.parse(window.localStorage.getItem(CREDITS_KEY) ?? "null");
        if (raw && typeof raw === "object") cache = { ...cache, ...raw };
      } catch {
        /* ignore broken value */
      }
    }
  }
  const next = normalize(cache, now);
  if (next.day !== cache.day || next.month !== cache.month) save(next);
  return cache;
}

function save(s: CreditState) {
  cache = s;
  if (typeof window !== "undefined") window.localStorage.setItem(CREDITS_KEY, JSON.stringify(s));
  listeners.forEach((l) => l());
}

export function getBalance() {
  return balance(load(), isPro());
}

export function canAfford(cost = RUN_COST): boolean {
  return getBalance().total >= cost;
}

/** Spends credits for one run; false when there aren't enough. */
export function spendCredits(cost = RUN_COST): boolean {
  const next = spend(load(), cost, isPro());
  if (!next) return false;
  save(next);
  return true;
}

/** Adds non-expiring pack credits (used after the admin confirms a payment). */
export function addPackCredits(amount: number) {
  const s = load();
  save({ ...s, pack: s.pack + amount });
}

let snap: { key: string; value: ReturnType<typeof getBalance> } | null = null;
function snapshot() {
  const b = getBalance();
  const key = `${b.free}|${b.monthly}|${b.pack}`;
  if (!snap || snap.key !== key) snap = { key, value: b };
  return snap.value;
}

export function useCredits() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    snapshot,
    () => null,
  );
}

/** Test helper. */
export function __resetCreditsForTests() {
  cache = null;
  snap = null;
}
