import React from 'react';
import { HashLink as Link } from 'react-router-hash-link';
import { Crop } from '../types';

interface CropDetailProps {
  crop: Crop;
  onBack: () => void;
}

const CropDetail: React.FC<CropDetailProps> = ({ crop, onBack }) => {
  if (!crop) {
    return (
      <div className="container mx-auto p-6 md:p-8 lg:p-10 text-center bg-white rounded-xl shadow-lg my-8">
        <h2 className="text-3xl font-bold text-red-600 mb-6">Crop not found.</h2>
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
        >
          &larr; Back to Category
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10 bg-white rounded-2xl shadow-2xl my-8">
      <Link
        to={`#category/${crop.category}`}
        onClick={onBack}
        className="inline-flex items-center text-green-700 hover:text-green-900 font-semibold transition-colors duration-200 mb-8 group text-lg"
        scroll={(el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        aria-label={`Back to ${crop.category} category`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 -translate-x-1 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to {crop.category} Crops
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <div className="lg:col-span-1 flex justify-center">
          <img
            src={crop.image}
            alt={crop.name}
            className="w-full max-w-md h-72 sm:h-96 object-cover rounded-xl shadow-xl border border-gray-200"
            onError={(e) => {
              e.currentTarget.src = 'https://picsum.photos/400/300?grayscale'; // Fallback image for 400x300
              e.currentTarget.onerror = null;
            }}
          />
        </div>
        <div className="lg:col-span-2">
          <h1 className="text-5xl font-extrabold text-green-900 mb-3 leading-tight">{crop.name}</h1>
          <p className="text-2xl italic text-gray-600 mb-8">{crop.scientificName}</p>

          <p className="text-gray-700 text-lg leading-relaxed mb-8 pb-6 border-b border-gray-200">
            {crop.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-gray-800">
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Category:</h3>
              <p className="text-lg">{crop.category}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Cultivation Areas:</h3>
              <ul className="list-disc list-inside text-lg pl-2">
                {crop.cultivationAreas.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Soil Requirements:</h3>
              <p className="text-lg">{crop.soilRequirements}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Climate Requirements:</h3>
              <p className="text-lg">{crop.climateRequirements}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Average Yield:</h3>
              <p className="text-lg">{crop.averageYield}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">Economic Importance:</h3>
              <p className="text-lg">{crop.economicImportance}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold text-green-700 mb-2">Common Uses:</h3>
              <ul className="list-disc list-inside text-lg pl-2">
                {crop.commonUses.map((use, index) => (
                  <li key={index}>{use}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropDetail;