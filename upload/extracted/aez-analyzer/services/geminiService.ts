import { GoogleGenAI } from "@google/genai";
import { AEZData, SoilComposition, AnalysisResult } from "../types";

// Initialize Gemini
// NOTE: API Key is expected to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fetches detailed information about a specific AEZ using Google Search Grounding.
 */
export const getAEZInfo = async (aez: AEZData): Promise<AnalysisResult> => {
  try {
    const prompt = `
      Provide a comprehensive soil analysis report for the Agro-ecological Zone (AEZ) of Bangladesh: "${aez.name}" (ID: ${aez.id}).
      
      **Crucial: Prioritize information from official Bangladesh agricultural sources: SRDI, BARC, BRRI, BARI, and https://czis.cropzoning.gov.bd/.**

      Include the following details:
      1. **Soil Characteristics**: Typical texture class and general fertility status.
      2. **Organic Matter**: Estimated content range (Low/Medium/High and typical %).
      3. **Land Type**: High land, medium high land, etc. distribution.
      4. **Suitable Crops**: List 5 specific crops (mention specific varieties like 'BRRI Dhan' or 'BARI Gom' if possible).
      
      Format the response as a structured agronomic summary. Use Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are an expert soil scientist for the Bangladesh Agricultural Research Council (BARC). You provide accurate, localized data.",
      },
    });

    const text = response.text || "No information available.";
    
    // Extract grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
      .filter((source: any) => source !== null) as Array<{ title: string; uri: string }>;

    return {
      textureClass: "Varies by sub-region",
      recommendation: text,
      suitableCrops: [], // Extracted in text
      organicMatterEstimate: "Refer to description",
      sources: sources
    };

  } catch (error) {
    console.error("Error fetching AEZ info:", error);
    throw new Error("Failed to retrieve AEZ information. Please try again.");
  }
};

/**
 * Analyzes specific soil composition data provided by the user.
 */
export const analyzeSoilSample = async (
  composition: SoilComposition,
  aez?: AEZData,
  organicMatterInput?: number
): Promise<AnalysisResult> => {
  try {
    // Constructing the Prompt Context
    const locationContext = aez 
      ? `**Location**: AEZ ${aez.id} - ${aez.name}` 
      : `**Location**: Bangladesh (General Region)`;

    const compositionContext = `**Soil Composition**: Sand ${composition.sand}%, Silt ${composition.silt}%, Clay ${composition.clay}%`;

    // specific logic for Organic Matter (OM)
    let omInstruction = "";
    if (organicMatterInput !== undefined) {
      omInstruction = `
      - **User Input**: The user provided an Organic Matter content of **${organicMatterInput}%**.
      - **Task**: Evaluate this specific value against the critical limits for ${aez ? `soils in AEZ ${aez.id}` : "typical Bangladeshi agricultural soils"}. 
      - Classify it as Very Low, Low, Medium, High, or Very High based on BARC/SRDI Fertilizer Recommendation Guide.
      `;
    } else {
      omInstruction = `
      - **MISSING INPUT**: The user did NOT provide Organic Matter content.
      - **Task**: Perform a **Contextual Estimation**.
        1. First, determine the USDA Texture Class from the sand/silt/clay percentages.
        2. Based on the **Texture Class** AND the **AEZ (${aez?.name || 'General BD'})**, estimate the typical Organic Matter % range.
        3. *Reasoning Rule*: Use knowledge of the region's land type (e.g., if AEZ is peat basin, OM is high; if Barind Tract, OM is low).
        4. Provide a range (e.g., "Estimated 1.5% - 2.0%") and classify it.
      `;
    }

    const prompt = `
      Act as a senior agronomist from SRDI (Soil Resource Development Institute) Bangladesh. Analyze this soil sample.

      **Sample Data**:
      ${locationContext}
      ${compositionContext}

      **Analysis Requirements**:
      1. **USDA Texture Classification**: explicitly state the texture class.
      2. **Organic Matter (OM) Status**:
         ${omInstruction}
      3. **Crop Suitability & Varieties**:
         - Recommend 4-5 specific crops suitable for this **Texture + OM + AEZ** combination.
         - **MUST** cite specific varieties released by BRRI (Rice), BARI (Wheat/Pulses/Oilseeds), or BINA where appropriate (e.g., "BRRI Dhan 28", "BARI Gom 33").
      4. **Soil Management Recommendations**:
         - Provide technical but practical advice for a farmer managing this specific soil texture and estimated OM level.

      **Sources**: Base recommendations on SRDI, BARC, BRRI, and BARI data.
      
      **Format**: Structured Markdown report.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // Thinking budget to allow calculation logic and lookup simulation
        thinkingConfig: { thinkingBudget: 2048 },
        systemInstruction: "You are an expert agronomist from SRDI. You strictly follow the USDA texture triangle and Bangladesh soil fertility standards.",
      },
    });

    return {
      textureClass: "Calculated in report",
      recommendation: response.text || "Analysis failed.",
      suitableCrops: [],
      organicMatterEstimate: "See report",
    };

  } catch (error) {
    console.error("Error analyzing soil:", error);
    throw new Error("Failed to analyze soil sample.");
  }
};
