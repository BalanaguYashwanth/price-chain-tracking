import Moralis from 'moralis';
import { ConfigService } from '@nestjs/config';
import { ENV_CONFIG } from 'src/common/config';

let isInitialized = false;

const config = new ConfigService();
export const getTokenPrice = async () => {
  try {
    // Initialize Moralis only once
    if (!isInitialized) {
      await Moralis.start({ apiKey: config.get(ENV_CONFIG.MORALIS_API_KEY) });
      isInitialized = true;
    }

    // Ethereum price fetch (ETH)
    const ethData = await Moralis.EvmApi.token.getTokenPrice({
      chain: '0x1',
      include: 'percent_change',
      address: config.get(ENV_CONFIG.ETHERUM_ADDRESS),
    });

    // Polygon price fetch (MATIC)
    const polygonData = await Moralis.EvmApi.token.getTokenPrice({
      chain: '0x89',
      include: 'percent_change',
      address: config.get(ENV_CONFIG.POLYGON_ADDRESS),
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
