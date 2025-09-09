import { useState, useEffect } from 'react';
import { logoApi } from '../api/client';

interface StockLogoProps {
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
};

const fallbackSizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

export const StockLogo = ({ 
  ticker, 
  size = 'md', 
  className = '',
  fallbackClassName = ''
}: StockLogoProps) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadLogo = async () => {
      setIsLoading(true);
      setHasError(false);
      setLogoUrl(null);
      
      try {
        const url = await logoApi.getStockLogo(ticker);
        if (isMounted) {
          if (url) {
            setLogoUrl(url);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadLogo();

    return () => {
      isMounted = false;
      // Note: We don't revoke blob URLs here anymore since the cache manages their lifecycle
    };
  }, [ticker]);

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse ${className}`} />
    );
  }

  if (hasError || !logoUrl) {
    // Fallback to letter-based avatar
    return (
      <div className={`${fallbackSizeClasses[size]} rounded-full bg-gray-600 text-white font-bold flex items-center justify-center ${fallbackClassName} ${className}`}>
        {ticker.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={logoUrl}
      alt={`${ticker} logo`}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => {
        setHasError(true);
        setLogoUrl(null);
      }}
    />
  );
};
