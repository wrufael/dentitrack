// src/components/Appointments/PatientSearchInput.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { usePatients } from '../../contexts/PatientsContext';

const PatientSearchInput = ({
  onSelectPatient,
  onRegisterNew,
  onQueryChange,
  value = '',
  placeholder = 'Search for existing patient...',
  className = '',
  disabled = false,
  required = false,
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const wrapperRef = useRef(null);

  const { searchPatients } = usePatients();

  // =========================================================
  // KEEP INPUT IN SYNC WITH PARENT
  // =========================================================

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // =========================================================
  // SEARCH PATIENTS
  // =========================================================

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const results = await searchPatients(query);

        setSearchResults(
          Array.isArray(results) ? results : []
        );
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);

    return () => clearTimeout(debounce);
  }, [query, searchPatients]);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const val = e.target.value;

    setQuery(val);

    // Tell parent exactly what is currently typed.
    onQueryChange?.(val);

    setIsOpen(true);
    setHighlightedIndex(-1);

    // If input is cleared, remove selected patient.
    if (val === '') {
      onSelectPatient?.(null);
    }
  };

  // =========================================================
  // SELECT EXISTING PATIENT
  // =========================================================

  const handleSelectPatient = (patient) => {
    const patientName =
      patient?.name ||
      patient?.full_name ||
      '';

    setQuery(patientName);

    // Keep parent state synchronized.
    onQueryChange?.(patientName);

    setIsOpen(false);
    setHighlightedIndex(-1);

    onSelectPatient?.(patient);
  };

  // =========================================================
  // REGISTER NEW PATIENT
  // =========================================================

  const handleRegisterNew = () => {
    const name = query.trim();

    if (!name) {
      return;
    }

    onQueryChange?.(name);
    onRegisterNew?.(name);
  };

  // =========================================================
  // KEYBOARD NAVIGATION
  // =========================================================

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();

      setHighlightedIndex((prev) =>
        prev < searchResults.length - 1
          ? prev + 1
          : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();

      setHighlightedIndex((prev) =>
        prev > -1 ? prev - 1 : -1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();

      if (
        highlightedIndex >= 0 &&
        highlightedIndex < searchResults.length
      ) {
        handleSelectPatient(
          searchResults[highlightedIndex]
        );
      } else if (searchResults.length === 1) {
        handleSelectPatient(searchResults[0]);
      } else if (query.trim()) {
        handleRegisterNew();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // =========================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const inputClass = `
    w-full
    px-3.5
    py-2.5
    pr-10
    border
    border-gray-300
    rounded-lg
    text-sm
    text-gray-900
    placeholder-gray-400
    focus:outline-none
    focus:ring-2
    focus:ring-[#0EA5A5]/20
    focus:border-[#0EA5A5]
    transition-all
    ${className}
  `;

  const getInitials = (name) => {
    if (!name) return '?';

    const parts = name.trim().split(' ');

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
    >
      <div className="relative">
        <MagnifyingGlassIcon
          className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            w-4
            h-4
            text-gray-400
          "
        />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClass}
          disabled={disabled}
          required={required}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onQueryChange?.('');
              onSelectPatient?.(null);
              setIsOpen(false);
              setHighlightedIndex(-1);
            }}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              p-0.5
              hover:bg-gray-100
              rounded-full
              transition-all
            "
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div
          className="
            absolute
            z-[999]
            w-full
            mt-1
            bg-white
            border
            border-gray-200
            rounded-xl
            shadow-lg
            max-h-60
            overflow-y-auto
          "
        >
          {isSearching ? (
            <div className="p-4 text-center text-sm text-[#5B6B72]">
              <div className="animate-pulse">
                Searching...
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="px-3 py-1.5 text-xs text-[#5B6B72] border-b border-gray-100">
                {searchResults.length} patient
                {searchResults.length > 1 ? 's' : ''}{' '}
                found
              </div>

              {searchResults.map(
                (patient, index) => {
                  const isHighlighted =
                    index === highlightedIndex;

                  const patientName =
                    patient.name ||
                    patient.full_name ||
                    'Unknown';

                  const initials =
                    getInitials(patientName);

                  return (
                    <button
                      type="button"
                      key={patient.id}
                      onClick={() =>
                        handleSelectPatient(patient)
                      }
                      className={`
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        text-left
                        transition-all
                        ${
                          isHighlighted
                            ? 'bg-[#0EA5A5]/5'
                            : 'hover:bg-gray-50'
                        }
                        border-b
                        border-gray-50
                        last:border-b-0
                      `}
                    >
                      <div
                        className="
                          w-9
                          h-9
                          rounded-full
                          bg-[#0EA5A5]/10
                          text-[#0EA5A5]
                          flex
                          items-center
                          justify-center
                          font-semibold
                          text-sm
                          flex-shrink-0
                        "
                      >
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#2B2B2B] text-sm truncate">
                          {patientName}

                          {patient.patient_id && (
                            <span className="ml-2 text-xs font-normal text-[#5B6B72]">
                              #{patient.patient_id}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#5B6B72] truncate">
                          {patient.phone ||
                            'No phone'}

                          {patient.age &&
                            ` · ${patient.age} yrs`}
                        </div>
                      </div>

                      {patient.recurring &&
                        patient.recurring !==
                          'none' && (
                          <span
                            className="
                              text-[10px]
                              font-medium
                              text-[#6366F1]
                              bg-[#6366F1]/10
                              px-2
                              py-0.5
                              rounded-full
                              flex-shrink-0
                            "
                          >
                            {patient.recurring}
                          </span>
                        )}
                    </button>
                  );
                }
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-[#5B6B72]">
                No patient found for "{query}"
              </p>

              <button
                type="button"
                onClick={handleRegisterNew}
                className="
                  mt-2
                  inline-flex
                  items-center
                  gap-1.5
                  text-sm
                  font-medium
                  text-[#0EA5A5]
                  hover:underline
                "
              >
                <UserPlusIcon className="w-4 h-4" />

                Register new patient "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSearchInput;