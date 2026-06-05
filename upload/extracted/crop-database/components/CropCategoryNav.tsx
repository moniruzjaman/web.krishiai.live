import React from 'react';
import { HashLink as Link } from 'react-router-hash-link'; // HashLink for scrolling and hash routing
import { CROP_CATEGORIES } from '../constants';
import { CropCategory } from '../types';

interface CropCategoryNavProps {
  onSelectCategory: (category: CropCategory) => void;
  selectedCategory: CropCategory | null;
}

const CropCategoryNav: React.FC<CropCategoryNavProps> = ({ onSelectCategory, selectedCategory }) => {
  return (
    <nav className="p-4 bg-gradient-to-r from-green-600 to-green-800 text-white shadow-xl sticky top-0 z-20" aria-label="Crop Categories">
      <div className="container mx-auto flex flex-wrap justify-center gap-3 sm:gap-4">
        {CROP_CATEGORIES.map((category) => (
          <Link
            key={category.value}
            to={`#category/${category.value}`}
            onClick={() => onSelectCategory(category.value)}
            className={`
              px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 ease-in-out
              transform hover:-translate-y-1 hover:scale-105
              ${selectedCategory === category.value
                ? 'bg-green-200 text-green-800 shadow-lg ring-2 ring-green-500'
                : 'bg-green-700 hover:bg-green-500 text-white hover:text-white shadow-md'}
              focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-75
              whitespace-nowrap
            `}
            scroll={(el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            aria-current={selectedCategory === category.value ? 'page' : undefined}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default CropCategoryNav;