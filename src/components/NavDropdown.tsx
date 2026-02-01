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
              {/* Women's — dress icon */}
              <svg className="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Women's
            </Link>
            <Link
              to="/products?collection=mens"
              className="flex items-center gap-3 px-5 py-3 text-warm-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition font-medium"
              onClick={handleItemClick}
            >
              {/* Men's — shirt/tee icon */}
              <svg className="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Men's
            </Link>
            <Link
              to="/products?collection=kids"
              className="flex items-center gap-3 px-5 py-3 text-warm-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition font-medium"
              onClick={handleItemClick}
            >
              {/* Kids — small person/child icon */}
              <svg className="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM9.75 7.5h4.5M12 7.5v9m-3 0l3 4.5 3-4.5" />
              </svg>
              Kids
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
              {/* Sale — tag icon */}
              <svg className="w-5 h-5 text-hafalohaRed" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              Sale Items
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
