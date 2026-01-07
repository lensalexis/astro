"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

type FilterNavProps = {
  categories?: string[];
  brands: string[];
  strains: string[];
  terpenes: string[];
  weights: string[];
  counts?: {
    categories?: Record<string, number>;
    brands?: Record<string, number>;
    strains?: Record<string, number>;
    terpenes?: Record<string, number>;
    weights?: Record<string, number>;
    thcRanges?: Record<string, number>;
  };
  onChange: (filters: any) => void;
  initialFilters?: {
    categories?: string[];
    brands?: string[];
    strains?: string[];
    terpenes?: string[];
    weights?: string[];
    thcRanges?: string[];
    saleOnly?: boolean;
  };
};

// THC range definitions (5 ranges to cover all possibilities)
const THC_RANGES = [
  '0-10%',
  '10-20%',
  '20-30%',
  '30-40%',
  '40%+',
];

export default function FilterNav({
  categories = [],
  brands,
  strains,
  terpenes,
  weights,
  counts = {},
  onChange,
  initialFilters,
}: FilterNavProps) {
  const categoryOptions = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)))
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    categories: (initialFilters?.categories || []) as string[],
    brands: (initialFilters?.brands || []) as string[],
    strains: (initialFilters?.strains || []) as string[],
    terpenes: (initialFilters?.terpenes || []) as string[],
    weights: (initialFilters?.weights || []) as string[],
    thcRanges: (initialFilters?.thcRanges || []) as string[],
    saleOnly: initialFilters?.saleOnly || false,
  });
  const [search, setSearch] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync filters when initialFilters changes (for programmatic updates)
  // Use a ref to track previous values and only update when they actually change
  const prevInitialFiltersRef = useRef<string>('')
  useEffect(() => {
    if (initialFilters) {
      const filtersKey = JSON.stringify(initialFilters)
      if (filtersKey !== prevInitialFiltersRef.current) {
        prevInitialFiltersRef.current = filtersKey
        setFilters({
          categories: initialFilters.categories || [],
          brands: initialFilters.brands || [],
          strains: initialFilters.strains || [],
          terpenes: initialFilters.terpenes || [],
          weights: initialFilters.weights || [],
          thcRanges: initialFilters.thcRanges || [],
          saleOnly: initialFilters.saleOnly || false,
        })
      }
    }
  }, [initialFilters])

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !Object.values(buttonRefs.current).some(btn => btn?.contains(e.target as Node))
      ) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (!activeDropdown || !dropdownPosition) return;

    const updatePosition = () => {
      const button = buttonRefs.current[activeDropdown!];
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [activeDropdown, dropdownPosition]);

  const toggleDropdown = (key: string) => {
    if (activeDropdown === key) {
      setActiveDropdown(null);
      setDropdownPosition(null);
      setSearch("");
      return;
    }

    const button = buttonRefs.current[key];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
      setActiveDropdown(key);
    setSearch("");
    }
  };

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    const current = filters[type] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const newFilters = { ...filters, [type]: updated };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const toggleSale = () => {
    const newFilters = { ...filters, saleOnly: !filters.saleOnly };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const optionsMap = {
    categories: categoryOptions,
    brands,
    strains,
    terpenes,
    weights,
    thcRanges: THC_RANGES,
  };

  // --- Mobile sheet state ---
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="flex flex-wrap gap-3">
        {Object.keys(optionsMap).map((key) => {
          const displayName = key === 'thcRanges' ? 'THC' : key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <div key={key} className="relative">
              <button
                ref={(el) => (buttonRefs.current[key] = el)}
                onClick={() => toggleDropdown(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold hover:brightness-95 cursor-pointer relative"
                style={{ backgroundColor: '#eaeaea', color: '#5a5a5a' }}
              >
                {displayName}

                {/* ✅ Selection count badge */}
                {filters[key as keyof typeof filters].length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-[#5a5a5a] text-white">
                    {filters[key as keyof typeof filters].length}
                  </span>
                )}

                {activeDropdown === key ? (
                  <ChevronUpIcon className="h-4 w-4" style={{ color: '#5a5a5a' }} />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" style={{ color: '#5a5a5a' }} />
                )}
              </button>
            </div>
          );
        })}

        {/* Discounted toggle */}
<div className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold hover:brightness-95" style={{ backgroundColor: '#eaeaea', color: '#5a5a5a' }}>
  {/* Dollar sign icon */}
  <span style={{ color: '#5a5a5a' }}>$</span>
  <span>Discounted</span>

  {/* Toggle switch */}
  <label className="relative inline-flex items-center cursor-pointer ml-2">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={filters.saleOnly}
      onChange={toggleSale}
    />
    <div className="w-11 h-6 bg-[#5a5a5a]/30 rounded-full peer peer-checked:bg-[#5a5a5a]/50 transition"></div>
    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transform peer-checked:translate-x-5 transition"></div>
  </label>
</div>
      </div>

      {/* Portal-based dropdown to escape overflow clipping */}
      {mounted && activeDropdown && dropdownPosition && createPortal(
        (() => {
          const key = activeDropdown;
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
          const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
          const dropdownWidth = Math.max(dropdownPosition.width, 280);
          const dropdownMaxHeight = 400; // allow taller list with scroll
          
          // Position directly below trigger; clamp horizontally
          let left = dropdownPosition.left;
          let top = dropdownPosition.top;
          
          if (left + dropdownWidth > viewportWidth - 16) {
            left = viewportWidth - dropdownWidth - 16;
          }
          if (left < 16) left = 16;
          
          // Keep within viewport bottom
          if (top + dropdownMaxHeight > viewportHeight - 16) {
            top = viewportHeight - dropdownMaxHeight - 16;
          }
          if (top < 16) top = 16;

          const optionMaxHeight = Math.max(140, dropdownMaxHeight - 72) // leave room for search bar

          return (
            <div
              ref={dropdownRef}
              className="fixed z-[9999] bg-white rounded-xl shadow-xl overflow-hidden"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                maxHeight: `${dropdownMaxHeight}px`,
                width: `${dropdownWidth}px`,
              }}
            >
              <div className="flex flex-col h-full">
                {/* Search */}
                <div className="p-3 border-b border-gray-100 shrink-0">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={`Search ${key}...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 border-none"
                    />
                  </div>
                </div>

                {/* Options with internal scroll */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1"
                  style={{ maxHeight: `${optionMaxHeight}px` }}
                >
                  {optionsMap[key as keyof typeof optionsMap]
                    .filter((opt) =>
                      opt.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((opt) => {
                      const selected = filters[key as keyof typeof filters].includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            toggleFilter(key as keyof typeof filters, opt);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium ${
                            selected
                              ? "bg-green-100 text-green-700"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-4 w-4 border rounded flex items-center justify-center ${
                                selected
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300"
                              }`}
                            >
                              {selected && <CheckIcon className="h-3 w-3" />}
                            </span>
                            <span>{opt}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {counts?.[key as keyof typeof counts]?.[opt] ?? 0}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
          </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}