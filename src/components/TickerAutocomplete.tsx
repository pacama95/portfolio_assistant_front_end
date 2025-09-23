import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { suggestionsApi } from '../api/client';
import type { TickerSuggestion } from '../types/api';

interface TickerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: TickerSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  filters?: {
    currency?: string;
    exchange?: string;
    country?: string;
  };
}

export const TickerAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = 'e.g., AAPL, Apple Inc.',
  className = '',
  disabled = false,
  error,
  filters
}: TickerAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState(value);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  // Handle input changes with debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only search if we have a search term and the input has focus (user is actively typing)
    if (searchTerm.trim() && searchTerm.length >= 2 && inputRef.current === document.activeElement) {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          let response;
          
          // Use advanced search if filters are provided and have values
          const hasFilters = filters && (
            (filters.currency && filters.currency.trim()) ||
            (filters.exchange && filters.exchange.trim()) ||
            (filters.country && filters.country.trim())
          );

          if (hasFilters) {
            response = await suggestionsApi.getAdvancedSearch({
              companyName: searchTerm.trim(),
              currency: filters?.currency || undefined,
              exchange: filters?.exchange || undefined,
              country: filters?.country || undefined,
              limit: 10
            });
          } else {
            response = await suggestionsApi.getTickerSuggestions({
              q: searchTerm.trim(),
              limit: 10
            });
          }

          console.log('API Response:', response);
          setSuggestions(response.suggestions || []);
          setIsOpen(response.suggestions && response.suggestions.length > 0);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Failed to fetch ticker suggestions:', error);
          setSuggestions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else if (!searchTerm.trim() || searchTerm.length < 2) {
      // Clear suggestions if search term is too short
      setSuggestions([]);
      setIsOpen(false);
    }
    // Note: We don't close dropdown if search term exists but input doesn't have focus
    // This allows users to navigate away temporarily without losing their search

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Separate effect for filter changes - only triggers search if there's already a search term and input has focus
  useEffect(() => {
    if (searchTerm.trim() && searchTerm.length >= 2 && inputRef.current === document.activeElement) {
      // Trigger a new search when filters change, but only if user is actively typing
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          let response;
          
          // Use advanced search if filters are provided and have values
          const hasFilters = filters && (
            (filters.currency && filters.currency.trim()) ||
            (filters.exchange && filters.exchange.trim()) ||
            (filters.country && filters.country.trim())
          );

          if (hasFilters) {
            response = await suggestionsApi.getAdvancedSearch({
              companyName: searchTerm.trim(),
              currency: filters?.currency || undefined,
              exchange: filters?.exchange || undefined,
              country: filters?.country || undefined,
              limit: 10
            });
          } else {
            response = await suggestionsApi.getTickerSuggestions({
              q: searchTerm.trim(),
              limit: 10
            });
          }

          console.log('API Response (filter change):', response);
          setSuggestions(response.suggestions || []);
          setIsOpen(response.suggestions && response.suggestions.length > 0);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Failed to fetch ticker suggestions:', error);
          setSuggestions([]);
          setIsOpen(false);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const handleInputBlur = () => {
    // Close dropdown when input loses focus (with a small delay to allow for selection clicks)
    setTimeout(() => {
      if (inputRef.current !== document.activeElement) {
        setIsOpen(false);
      }
    }, 150);
  };

  const handleSuggestionClick = (suggestion: TickerSuggestion) => {
    try {
      console.log('Suggestion clicked:', suggestion);
      setSearchTerm(suggestion.symbol);
      onChange(suggestion.symbol);
      onSelect?.(suggestion);
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error handling suggestion click:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase ${className} ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
          disabled={disabled}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isOpen && suggestions.length > 0 ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.symbol}-${index}`}
              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 text-sm">
                    {suggestion.symbol} • {suggestion.exchange}
                  </span>
                  <span className="text-gray-600 text-xs truncate max-w-xs">
                    {suggestion.name}
                  </span>
                </div>
                {index === selectedIndex && (
                  <div className="text-blue-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && suggestions.length === 0 && searchTerm.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-sm">
            No ticker symbols found for "{searchTerm}"
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
