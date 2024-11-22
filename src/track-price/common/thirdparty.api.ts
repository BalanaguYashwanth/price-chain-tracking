export const getETHToBTCFromCoinbase = async () => {
  const COINBASE_API = 'https://api.coinbase.com/v2';
  const response = await fetch(`${COINBASE_API}/exchange-rates?currency=ETH`);
  const data = await response.json();
  const ethToBtcRate = data.data.rates.BTC;
  return ethToBtcRate;
};
