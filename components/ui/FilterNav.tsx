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
  /** If false, do not render the "Filters" trigger button. */
  showTrigger?: boolean;
  /** Controlled open state for the modal sheet. */
  open?: boolean;
  /** Called when modal open state changes (used with `open`). */
  onOpenChange?: (open: boolean) => void;
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
  showTrigger = true,
  open,
  onOpenChange,
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
  const [isMobile, setIsMobile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  const [mobileOpenInternal, setMobileOpenInternal] = useState(false);
  const mobileOpen = open ?? mobileOpenInternal
  const setMobileOpen = (next: boolean) => {
    if (open !== undefined) {
      onOpenChange?.(next)
    } else {
      setMobileOpenInternal(next)
    }
  }

  // Collapsible sections within the modal (Types, Brands, etc.)
  // "Dropdowns instead of all listed" = accordion behavior.
  const [openSection, setOpenSection] = useState<string | null>('categories')
  useEffect(() => {
    if (!mobileOpen) return
    // Reset search + default open section whenever modal opens
    setSearch('')
    setOpenSection('categories')
  }, [mobileOpen])

  const renderOptionsList = (key: string) => {
    if (key === 'discounted') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            toggleSale()
          }}
          className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium ${
            filters.saleOnly ? "bg-green-100 text-green-700" : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`h-5 w-5 border rounded flex items-center justify-center ${
                filters.saleOnly ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
              }`}
            >
              {filters.saleOnly && <CheckIcon className="h-3 w-3" />}
            </span>
            <span>On sale</span>
          </div>
        </button>
      )
    }

    const opts = optionsMap[key as keyof typeof optionsMap] || []
    const filteredOpts = search
      ? opts.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()))
      : opts

    return filteredOpts.map((opt) => {
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
          className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium ${
            selected ? "bg-green-100 text-green-700" : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`h-5 w-5 border rounded flex items-center justify-center ${
                selected ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
              }`}
            >
              {selected && <CheckIcon className="h-3 w-3" />}
            </span>
            <span className="text-left">{opt}</span>
          </div>
          <span className="text-xs text-gray-500">
            {counts?.[key as keyof typeof counts]?.[opt] ?? 0}
          </span>
        </button>
      )
    })
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      {showTrigger && (
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold bg-[#eaeaea] text-[#5a5a5a] hover:brightness-95"
        >
          <FunnelIcon className="h-5 w-5" />
          <span>Filters</span>
          {(filters.categories.length +
            filters.brands.length +
            filters.strains.length +
            filters.terpenes.length +
            filters.weights.length +
            filters.effects.length +
            (filters.saleOnly ? 1 : 0)) > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-[#5a5a5a] text-white">
              {(filters.categories.length +
                filters.brands.length +
                filters.strains.length +
                filters.terpenes.length +
                filters.weights.length +
                filters.effects.length +
                (filters.saleOnly ? 1 : 0))}
            </span>
          )}
        </button>
      )}

      {mounted && mobileOpen && createPortal(
        <div className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-sm flex items-center justify-center">
          <div
            className={`bg-white shadow-2xl rounded-2xl flex flex-col w-full ${
              isMobile ? 'h-full' : 'max-w-3xl max-h-[90vh]'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-700" />
                <span className="text-lg font-semibold text-gray-900">Filters</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-gray-600 hover:text-black"
                aria-label="Close filters"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto px-4 pb-6 ${isMobile ? '' : 'pt-4'}`}>
              {[...Object.keys(optionsMap), 'discounted'].map((key) => {
                const displayName =
                  key === 'categories' ? 'Types' : key === 'discounted' ? 'Discounted' : key.charAt(0).toUpperCase() + key.slice(1)

                const selectedCount =
                  key === 'discounted'
                    ? filters.saleOnly
                      ? 1
                      : 0
                    : Array.isArray(filters[key as keyof typeof filters])
                    ? (filters[key as keyof typeof filters] as string[]).length
                    : 0

                const isOpen = openSection === key

                return (
                  <div key={key} className="border-b border-gray-100 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('')
                        setOpenSection((prev) => (prev === key ? null : key))
                      }}
                      className="w-full flex items-center justify-between gap-3"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-semibold text-gray-900">{displayName}</span>
                      <span className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#5a5a5a] text-white">
                            {selectedCount}
                          </span>
                        )}
                        {isOpen ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mt-3">
                        {key !== 'discounted' && (
                          <div className="mb-3">
                            <div className="relative">
                              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                placeholder={`Search ${displayName}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 border-none"
                              />
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">{renderOptionsList(key)}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-end gap-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
