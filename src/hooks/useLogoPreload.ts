import { useEffect } from 'react';
import { logoApi } from '../api/client';

/**
 * Hook to preload stock logos in the background
 * Useful for pages with multiple stocks to improve perceived performance
 */
export const useLogoPreload = (tickers: string[]) => {
  useEffect(() => {
    // Only preload if we have tickers
    if (!tickers.length) return;

    // Preload logos in the background without blocking UI
    const preloadLogos = async () => {
      // Use Promise.allSettled to not fail if one logo fails
      const preloadPromises = tickers.map(ticker => 
        logoApi.getStockLogo(ticker).catch(error => {
          // Silently handle errors - we don't want preloading to cause issues
          console.warn(`Failed to preload logo for ${ticker}:`, error);
          return null;
        })
      );

      await Promise.allSettled(preloadPromises);
    };

    // Small delay to not interfere with initial page load
    const timeoutId = setTimeout(preloadLogos, 100);

    return () => clearTimeout(timeoutId);
  }, [tickers]);
};

/**
 * Hook to preload a single logo
 */
export const useLogoPreloadSingle = (ticker: string) => {
  useEffect(() => {
    if (!ticker) return;

    const preloadLogo = async () => {
      try {
        await logoApi.getStockLogo(ticker);
      } catch (error) {
        // Silently handle errors
        console.warn(`Failed to preload logo for ${ticker}:`, error);
      }
    };

    const timeoutId = setTimeout(preloadLogo, 50);
    return () => clearTimeout(timeoutId);
  }, [ticker]);
};
