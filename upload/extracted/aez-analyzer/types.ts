export interface SoilComposition {
  sand: number;
  silt: number;
  clay: number;
}

export interface AEZData {
  id: number;
  name: string;
  description?: string;
}

export interface AnalysisResult {
  textureClass: string;
  recommendation: string;
  suitableCrops: string[];
  organicMatterEstimate: string;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
}

export type ViewMode = 'calculator' | 'explorer';