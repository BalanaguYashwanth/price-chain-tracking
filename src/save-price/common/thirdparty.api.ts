import Moralis from 'moralis';
import { ETHERUM_ADDRESS, MORALIS_API_KEY, POLYGON_ADDRESS } from './config';

let isInitialized = false;

export const getTokenPrice = async () => {
  try {
    // Initialize Moralis only once
    if (!isInitialized) {
      await Moralis.start({ apiKey: MORALIS_API_KEY });
      isInitialized = true;
    }

    // Ethereum price fetch (ETH)
    const ethData = await Moralis.EvmApi.token.getTokenPrice({
      chain: '0x1',
      include: 'percent_change',
      address: ETHERUM_ADDRESS,
    });

    // Polygon price fetch (MATIC)
    const polygonData = await Moralis.EvmApi.token.getTokenPrice({
      chain: '0x89',
      include: 'percent_change',
      address: POLYGON_ADDRESS,
    });

    const eth = ethData?.raw?.usdPriceFormatted
      ? parseFloat(ethData.raw.usdPriceFormatted).toFixed(2)
      : '0.00';

    const polygon = polygonData?.raw?.usdPriceFormatted
      ? parseFloat(polygonData.raw.usdPriceFormatted).toFixed(2)
      : '0.00';

    return { eth, polygon };
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return { eth: '0.00', polygon: '0.00' };
  }
};
