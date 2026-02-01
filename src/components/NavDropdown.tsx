import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface NavDropdownProps {
  onItemClick: () => void;
  darkMode?: boolean;
}

export default function NavDropdown({ onItemClick, darkMode = false }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  const handleItemClick = () => {
    setIsOpen(false);
    onItemClick();
  };

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        className={`flex items-center font-semibold transition py-2 ${
          darkMode 
            ? 'text-white hover:text-hafalohaGold' 
            : 'text-warm-700 hover:text-hafalohaRed nav-link-hover'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        Shop
        <svg
          className={`ml-1 w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Simple dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-warm-100 z-50 animate-slide-down overflow-hidden w-56">
          <div className="py-2">
            <Link
              to="/products?collection=womens"
              className="flex items-center gap-3 px-5 py-3 text-warm-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition font-medium"
              onClick={handleItemClick}
            >
              <span className="text-lg">👩</span>
              Women's
            </Link>
            <Link
              to="/products?collection=mens"
              className="flex items-center gap-3 px-5 py-3 text-warm-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition font-medium"
              onClick={handleItemClick}
            >
              <span className="text-lg">👨</span>
              Men's
            </Link>

            <div className="border-t border-warm-100 my-1" />

            <Link
              to="/products"
              className="flex items-center gap-3 px-5 py-3 text-warm-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition font-medium"
              onClick={handleItemClick}
            >
              <svg className="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Products
            </Link>
            <Link
              to="/collections"
              className="flex items-center gap-3 px-5 py-3 text-warm-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition font-medium"
              onClick={handleItemClick}
            >
              <svg className="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Collections
            </Link>

            <div className="border-t border-warm-100 my-1" />

            <Link
              to="/products?sale=true"
              className="flex items-center gap-3 px-5 py-3 text-hafalohaRed hover:bg-red-50 transition font-semibold"
              onClick={handleItemClick}
            >
              <span className="bg-hafalohaRed text-white text-xs px-2 py-0.5 rounded-full">SALE</span>
              Sale Items
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
