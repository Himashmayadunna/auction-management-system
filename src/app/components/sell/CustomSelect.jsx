"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CustomSelect
 * Props:
 *  - label?: string
 *  - options: string[]
 *  - value?: string
 *  - onChange?: (val: string) => void
 *  - placeholder?: string
 *  - className?: string
 */
export default function CustomSelect({
  label,
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const containerRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, options.length);
  }, [options]);

  // Close on outside click
  useEffect(() => {
    function handleDocDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocDown);
    return () => document.removeEventListener("mousedown", handleDocDown);
  }, []);

  useEffect(() => {
    if (open && highlighted >= 0 && optionRefs.current[highlighted]) {
      optionRefs.current[highlighted].scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const openAndSetHighlight = () => {
    const idx = options.findIndex((o) => o === value);
    setHighlighted(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const toggleOpen = () => {
    if (!open) openAndSetHighlight();
    else setOpen(false);
  };

  const handleSelect = (val) => {
    onChange?.(val);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        openAndSetHighlight();
        return;
      }
      setHighlighted((p) => Math.min(options.length - 1, (p < 0 ? 0 : p + 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openAndSetHighlight();
        return;
      }
      setHighlighted((p) => (p <= 0 ? options.length - 1 : p - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && highlighted >= 0) handleSelect(options[highlighted]);
      else openAndSetHighlight();
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (open) setHighlighted(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (open) setHighlighted(options.length - 1);
    }
  };

  return (
    <div
      className={`relative w-full ${className}`}
      ref={containerRef}
      onKeyDown={onKeyDown}
    >
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} <span className="text-red-500">*</span>
        </label>
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full p-3 border border-gray-300 rounded-xl bg-white flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#1e2b44]"
        onClick={toggleOpen}
      >
        <span className={`${!value ? "text-gray-400" : ""}`}>
          {value || placeholder}
        </span>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="ml-3"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1"
        >
          {options.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-500">No options</li>
          )}

          {options.map((opt, idx) => {
            const isSelected = value === opt;
            const isHighlighted = highlighted === idx;
            return (
              <li
                id={`option-${idx}`}
                key={opt + idx}
                role="option"
                aria-selected={isSelected}
                ref={(el) => (optionRefs.current[idx] = el)}
                onMouseEnter={() => setHighlighted(idx)}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2 cursor-pointer select-none text-sm hover:bg-yellow-400 hover:text-black hover:font-medium hover:rounded-md`}

              >
                {opt}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
