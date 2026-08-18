import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-mid" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-10"
      />
    </div>
  );
};

export default SearchBar;