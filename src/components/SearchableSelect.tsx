import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  searchText?: string; // Additional text to search in
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  name?: string;
}

export const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  error,
  name
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.searchText && option.searchText.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get display value for the input
  const displayValue = value ? options.find(opt => opt.value === value)?.label || value : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    if (!isOpen) {
      setIsOpen(true);
    }
    
    setSelectedIndex(-1);
  };

  const handleOptionClick = (option: SelectOption) => {
    onChange(option.value);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleInputBlur = () => {
    // Small delay to allow option clicks to register
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setSearchTerm('');
      }
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
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
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        setSearchTerm('');
        inputRef.current?.blur();
        break;
    }
  };

  const handleClearSelection = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${className} ${
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
          }`}
          disabled={disabled}
          autoComplete="off"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-gray-600 mr-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <div className="text-gray-400 pointer-events-none">
            {isOpen && filteredOptions.length > 0 ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {/* Options dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 text-sm">
                    {option.label}
                  </span>
                  {option.searchText && option.searchText !== option.label && (
                    <span className="text-gray-500 text-xs">
                      {option.searchText}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No options found for "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
