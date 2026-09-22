export const COINS_PER_PKR = 100;
export const USD_PKR = 280;

export function coinsToPkr(coins: number, coinsPerPkr = COINS_PER_PKR) {
  return coins / coinsPerPkr;
}

export function coinsToUsd(coins: number, coinsPerPkr = COINS_PER_PKR, usdPkr = USD_PKR) {
  return coinsToPkr(coins, coinsPerPkr) / usdPkr;
}

export function pkrToCoins(pkr: number, coinsPerPkr = COINS_PER_PKR) {
  return Math.round(pkr * coinsPerPkr);
}

export function fmtCoins(coins: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(coins));
}

export function fmtPkr(coins: number, coinsPerPkr = COINS_PER_PKR) {
  return `${coinsToPkr(coins, coinsPerPkr).toFixed(2)} PKR`;
}

export function fmtUsd(coins: number, coinsPerPkr = COINS_PER_PKR, usdPkr = USD_PKR) {
  return `$${coinsToUsd(coins, coinsPerPkr, usdPkr).toFixed(3)}`;
}

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
