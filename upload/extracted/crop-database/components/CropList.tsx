import React from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import { Crop } from '../types';

interface CropListProps {
  crops: Crop[];
  selectedCategory: string;
}

const CropList: React.FC<CropListProps> = ({ crops, selectedCategory }) => {
  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <h2 className="text-4xl font-extrabold text-green-800 mb-10 text-center sm:text-left">
        {selectedCategory} Crops in Bangladesh
      </h2>
      {crops.length === 0 ? (
        <p className="text-gray-600 text-xl text-center p-8 bg-white rounded-lg shadow-md">No crops found for this category. Please select another or try again.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {crops.map((crop) => (
            <Link
              key={crop.id}
              to={`#crop/${crop.id}`}
              className="group block bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 overflow-hidden cursor-pointer border border-gray-100"
              scroll={(el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              aria-label={`View details for ${crop.name}`}
            >
              <img
                src={crop.image}
                alt={crop.name}
                className="w-full h-52 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300 ease-in-out"
                onError={(e) => {
                  e.currentTarget.src = 'https://picsum.photos/400/300?grayscale'; // Fallback image for 400x300
                  e.currentTarget.onerror = null;
                }}
              />
              <div className="p-5">
                <h3 className="text-2xl font-bold text-green-700 group-hover:text-green-900 transition-colors duration-200 mb-2 leading-tight">
                  {crop.name}
                </h3>
                <p className="text-sm text-gray-500 italic mb-3">{crop.scientificName}</p>
                <p className="text-gray-700 text-base line-clamp-3">
                  {crop.description}
                </p>
                <div className="mt-5 text-green-600 font-semibold text-right group-hover:text-green-800 group-hover:underline transition-colors duration-200">
                  Explore More &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropList;