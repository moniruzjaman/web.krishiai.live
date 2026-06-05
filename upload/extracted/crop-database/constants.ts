
import { CropCategory } from './types';

export const CROP_CATEGORIES: { name: string; value: CropCategory }[] = [
  { name: 'Grains', value: CropCategory.GRAINS },
  { name: 'Oils', value: CropCategory.OILS },
  { name: 'Spices', value: CropCategory.SPICES },
  { name: 'Pulses', value: CropCategory.PULSES },
  { name: 'Fruits', value: CropCategory.FRUITS },
  { name: 'Vegetables', value: CropCategory.VEGETABLES },
  { name: 'High Value Crops', value: CropCategory.HIGH_VALUE_CROPS },
];

// Helper function to create a slug from a string
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};
    