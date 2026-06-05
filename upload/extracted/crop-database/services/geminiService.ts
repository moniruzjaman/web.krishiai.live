import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Crop, CropCategory } from '../types';
import { slugify } from '../constants';

const modelName = 'gemini-2.5-pro'; // Using pro for more complex reasoning and detailed data

interface CropDataResponse {
  crops: Crop[];
}

export const fetchCropData = async (category: CropCategory): Promise<Crop[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const exampleCrops: { [key in CropCategory]: string } = {
    [CropCategory.GRAINS]: `e.g., Rice, Wheat, Maize`,
    [CropCategory.OILS]: `e.g., Mustard, Soybean, Sesame`,
    [CropCategory.SPICES]: `e.g., Chili, Turmeric, Ginger`,
    [CropCategory.PULSES]: `e.g., Lentil, Chickpea, Black gram`,
    [CropCategory.FRUITS]: `e.g., Mango, Jackfruit, Litchi`,
    [CropCategory.VEGETABLES]: `e.g., Potato, Brinjal, Cabbage`,
    [CropCategory.HIGH_VALUE_CROPS]: `e.g., Cotton, Tea, Tobacco (though tobacco cultivation is discouraged, it has historical economic value)`,
  };

  const prompt = `Act as an expert on Bangladeshi agriculture. Provide a list of 5-7 distinct crops for the "${category}" category cultivated in Bangladesh.
  For each crop, include the following details:
  - \`name\`: Common name of the crop.
  - \`scientificName\`: Botanical name of the crop.
  - \`description\`: A concise description (2-3 sentences) about the crop and its significance in Bangladesh.
  - \`cultivationAreas\`: An array of 2-3 prominent districts or regions in Bangladesh where it is widely cultivated.
  - \`soilRequirements\`: A brief description of the ideal soil types for its cultivation in Bangladesh.
  - \`climateRequirements\`: A brief description of the ideal climate conditions (temperature, rainfall, seasons) for its cultivation in Bangladesh.
  - \`averageYield\`: An approximate average yield in Bangladesh (e.g., "5-6 tons/hectare", "1.5-2 tons/acre").
  - \`economicImportance\`: A brief explanation of its economic impact and role in the Bangladeshi economy.
  - \`commonUses\`: An array of 2-3 common uses of the crop (e.g., food, oil extraction, spice, industrial).
  - \`image\`: A placeholder image URL using 'https://picsum.photos/400/300' (e.g., "https://picsum.photos/400/300?random=1" where the random number ensures unique images).
  - \`category\`: The category of the crop, which is "${category}".

  Ensure the information is accurate and specific to Bangladesh's agricultural context.
  Do not include any introductory or concluding text, only the JSON array.
  ${exampleCrops[category] ? `Example crops for this category: ${exampleCrops[category]}.` : ''}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              scientificName: { type: Type.STRING },
              description: { type: Type.STRING },
              cultivationAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              soilRequirements: { type: Type.STRING },
              climateRequirements: { type: Type.STRING },
              averageYield: { type: Type.STRING },
              economicImportance: { type: Type.STRING },
              commonUses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              image: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: [
              'name',
              'scientificName',
              'description',
              'cultivationAreas',
              'soilRequirements',
              'climateRequirements',
              'averageYield',
              'economicImportance',
              'commonUses',
              'image',
              'category'
            ],
          },
        },
      },
    });

    let jsonStr = response.text.trim();
    const parsedData: Crop[] = JSON.parse(jsonStr);

    // Add unique IDs to each crop and ensure category is correct
    const cropsWithIds = parsedData.map((crop, index) => ({
      ...crop,
      id: slugify(crop.name + '-' + index), // Ensure unique ID even for same names
      category: category, // Override any potential hallucination
    }));

    return cropsWithIds;

  } catch (error) {
    console.error(`Error fetching crop data for ${category}:`, error);
    throw new Error(`Failed to load crop data for ${category}. Please try again.`);
  }
};