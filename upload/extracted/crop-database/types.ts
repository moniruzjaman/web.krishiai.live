
export enum CropCategory {
  GRAINS = 'Grains',
  OILS = 'Oils',
  SPICES = 'Spices',
  PULSES = 'Pulses',
  FRUITS = 'Fruits',
  VEGETABLES = 'Vegetables',
  HIGH_VALUE_CROPS = 'High Value Crops',
}

export interface Crop {
  id: string; // Unique identifier (e.g., lowercase-slugified-crop-name)
  name: string;
  scientificName: string;
  description: string;
  cultivationAreas: string[]; // Districts/regions in Bangladesh
  soilRequirements: string;
  climateRequirements: string;
  averageYield: string;
  economicImportance: string;
  commonUses: string[];
  image: string; // Placeholder image URL
  category: CropCategory; // To link back to category
}
    