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
  effects: string[];
  counts?: {
    categories?: Record<string, number>;
    brands?: Record<string, number>;
    strains?: Record<string, number>;
    terpenes?: Record<string, number>;
    weights?: Record<string, number>;
    effects?: Record<string, number>;
  };
  onChange: (filters: any) => void;
  initialFilters?: {
    categories?: string[];
    brands?: string[];
    strains?: string[];
    terpenes?: string[];
    weights?: string[];
    effects?: string[];
    saleOnly?: boolean;
  };
};

export default function FilterNav({
  categories = [],
  brands,
  strains,
  terpenes,
  weights,
  effects,
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
    effects: (initialFilters?.effects || []) as string[],
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
          effects: initialFilters.effects || [],
          saleOnly: initialFilters.saleOnly || false,
        })
      }
    }
  }, [initialFilters])

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      // Check if click is inside the dropdown portal
      const portalElement = document.querySelector('[data-filter-dropdown]')
      
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !Object.values(buttonRefs.current).some(btn => btn?.contains(target)) &&
        !(portalElement && portalElement.contains(target))
      ) {
        setActiveDropdown(null);
        setDropdownPosition(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
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

  const toggleFilter = (type: keyof typeof filters, value: string, e?: React.MouseEvent) => {
    // Prevent event propagation to avoid closing dropdown
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    const current = filters[type] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const newFilters = { ...filters, [type]: updated };
    setFilters(newFilters);
    onChange(newFilters);
    // Keep dropdown open after selection
  };

  const toggleSale = () => {
    const newFilters = { ...filters, saleOnly: !filters.saleOnly };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const optionsMap: Partial<Record<string, string[]>> = {}
  if (categoryOptions.length) optionsMap.categories = categoryOptions
  if (brands?.length) optionsMap.brands = brands
  if (strains?.length) optionsMap.strains = strains
  if (terpenes?.length) optionsMap.terpenes = terpenes
  if (weights?.length) optionsMap.weights = weights
  if (effects?.length) optionsMap.effects = effects

  // --- Mobile sheet state ---
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="flex flex-wrap gap-3">
        {Object.keys(optionsMap).map((key) => {
          const displayName = key === 'categories' ? 'Types' : key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <div key={key} className="relative">
              <button
                ref={(el) => {
                  buttonRefs.current[key] = el
                }}
                onClick={() => toggleDropdown(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold hover:brightness-95 cursor-pointer relative"
                style={{ backgroundColor: '#eaeaea', color: '#5a5a5a' }}
              >
                {displayName}

                {/* ✅ Selection count badge */}
                {Array.isArray(filters[key as keyof typeof filters]) && (filters[key as keyof typeof filters] as string[]).length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-[#5a5a5a] text-white">
                    {(filters[key as keyof typeof filters] as string[]).length}
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

        {/* Discounted - same pattern as other filters */}
        <div className="relative">
          <button
            ref={(el) => {
              buttonRefs.current['discounted'] = el
            }}
            onClick={() => toggleDropdown('discounted')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold hover:brightness-95 cursor-pointer relative"
            style={{ backgroundColor: '#eaeaea', color: '#5a5a5a' }}
          >
            <span>$</span>
            <span>Discounted</span>

            {/* Selection count badge */}
            {filters.saleOnly && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-[#5a5a5a] text-white">
                1
              </span>
            )}

            {activeDropdown === 'discounted' ? (
              <ChevronUpIcon className="h-4 w-4" style={{ color: '#5a5a5a' }} />
            ) : (
              <ChevronDownIcon className="h-4 w-4" style={{ color: '#5a5a5a' }} />
            )}
          </button>
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
              data-filter-dropdown
              ref={dropdownRef}
              className="fixed z-[9999] bg-white rounded-xl shadow-xl overflow-hidden"
              style={{
                top: `${top}px`,
                left: `${left}px`,
                maxHeight: `${dropdownMaxHeight}px`,
                width: `${dropdownWidth}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Search - hide for discounted */}
                {key !== 'discounted' && (
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
                )}

                {/* Options with internal scroll */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1"
                  style={{ maxHeight: `${optionMaxHeight}px` }}
                >
                  {key === 'discounted' ? (
                    // Special handling for discounted - single checkbox option
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        toggleSale()
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium ${
                        filters.saleOnly
                          ? "bg-green-100 text-green-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 border rounded flex items-center justify-center ${
                            filters.saleOnly
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {filters.saleOnly && <CheckIcon className="h-3 w-3" />}
                        </span>
                        <span>On sale</span>
                      </div>
                    </button>
                  ) : (
                    // Regular filter options
                    optionsMap[key as keyof typeof optionsMap]
                      ?.filter((opt) =>
                        opt.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((opt) => {
                        const filterValues = (filters[key as keyof typeof filters] as string[]) || []
                        const selected = filterValues.some(val => val.toLowerCase() === opt.toLowerCase());
                        return (
                          <button
                            key={opt}
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              toggleFilter(key as keyof typeof filters, opt, e);
                            }}
                            onMouseDown={(e) => {
                              // Prevent mousedown from triggering outside click handler
                              e.stopPropagation()
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
                      })
                  )}
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
