import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import CropCategoryNav from './components/CropCategoryNav';
import CropList from './components/CropList';
import CropDetail from './components/CropDetail';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { CROP_CATEGORIES, slugify } from './constants';
import { Crop, CropCategory } from './types';
import { fetchCropData } from './services/geminiService';

// Define the main App component outside of any other component to avoid re-renders
const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation(); // To read the hash part of the URL
  const { cropId } = useParams<{ cropId: string }>();

  // Function to load crops for a given category
  const loadCrops = useCallback(async (category: CropCategory) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCropData(category);
      setCrops(data);
      setSelectedCategory(category);
    } catch (err) {
      console.error("Error fetching crops:", err);
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to handle initial load and URL hash changes
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith('#category/')) {
      const categoryFromHash = hash.replace('#category/', '') as CropCategory;
      const isValidCategory = CROP_CATEGORIES.some(cat => cat.value === categoryFromHash);
      if (isValidCategory && categoryFromHash !== selectedCategory) {
        loadCrops(categoryFromHash);
      } else if (!isValidCategory && selectedCategory === null) {
        // Default to the first category if hash is invalid or no category selected initially
        loadCrops(CROP_CATEGORIES[0].value);
        navigate(`#category/${CROP_CATEGORIES[0].value}`, { replace: true });
      }
    } else if (hash.startsWith('#crop/')) {
      // If navigating directly to a crop detail, ensure its category is loaded
      const potentialCropId = hash.replace('#crop/', '');
      const foundCrop = crops.find(c => c.id === potentialCropId);
      if (foundCrop && foundCrop.category !== selectedCategory) {
        loadCrops(foundCrop.category); // Reload category to ensure context
      } else if (!foundCrop && selectedCategory === null) {
        // If no category selected and crop not found, default to first category and then show error
        loadCrops(CROP_CATEGORIES[0].value);
        // Error will be shown by CropDetail if cropId doesn't match after loading
      }
    } else if (selectedCategory === null) {
      // No hash, no selected category, load first category by default
      loadCrops(CROP_CATEGORIES[0].value);
      navigate(`#category/${CROP_CATEGORIES[0].value}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, loadCrops]); // Removed selectedCategory from dependencies to prevent infinite loop

  const handleSelectCategory = useCallback((category: CropCategory) => {
    if (category !== selectedCategory) {
      navigate(`#category/${category}`);
      setCrops([]); // Clear crops when category changes, new ones will be fetched
    }
  }, [navigate, selectedCategory]);

  const handleBackToCategory = useCallback(() => {
    if (selectedCategory) {
      navigate(`#category/${selectedCategory}`);
    } else {
      // Fallback if selectedCategory somehow isn't set
      navigate(`#category/${CROP_CATEGORIES[0].value}`);
    }
  }, [navigate, selectedCategory]);

  const currentCrop = cropId ? crops.find((crop) => crop.id === cropId) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-green-700 to-green-900 text-white p-8 shadow-2xl">
        <div className="container mx-auto">
          <h1 className="text-5xl font-extrabold text-center tracking-tight leading-tight drop-shadow-lg">
            Bangladesh Crop Database
          </h1>
          <p className="text-center text-green-200 mt-4 text-xl font-light">
            A comprehensive guide to vital crops cultivated across Bangladesh.
          </p>
        </div>
      </header>

      <CropCategoryNav
        onSelectCategory={handleSelectCategory}
        selectedCategory={selectedCategory}
      />

      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}

        <Routes>
          <Route path="/" element={
            selectedCategory ? (
              <CropList crops={crops} selectedCategory={selectedCategory} />
            ) : (
              <p className="text-center text-gray-600 text-lg p-8">Select a category to view crops.</p>
            )
          } />
          <Route path="/category/:categoryName" element={
            selectedCategory ? (
              <CropList crops={crops} selectedCategory={selectedCategory} />
            ) : (
              <p className="text-center text-gray-600 text-lg p-8">Loading category...</p>
            )
          } />
          <Route path="/crop/:cropId" element={
            <CropDetail crop={currentCrop!} onBack={handleBackToCategory} />
          } />
        </Routes>
      </main>

      <footer className="bg-gray-900 text-white p-8 text-center text-sm mt-auto shadow-inner">
        <p className="text-base">&copy; {new Date().getFullYear()} Bangladesh Crop Database. All rights reserved.</p>
        <p className="mt-3 text-gray-400">Powered by Gemini AI, enriching agricultural knowledge with authentic Bangladeshi insights.</p>
        <p className="mt-1 text-gray-500 text-xs">For educational and informational purposes only.</p>
      </footer>
    </div>
  );
};

// Wrapper for App component to provide Router context
const AppWrapper: React.FC = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;