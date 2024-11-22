export const getCryptoPriceFromCoinbase = async (chain) => {
  const COINBASE_API = 'https://api.coinbase.com/v2';
  const response = await fetch(
    `${COINBASE_API}/exchange-rates?currency=${chain}`,
  );
  const data = await response.json();
  return data;
};
