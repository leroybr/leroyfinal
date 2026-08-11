import { GoogleGenAI, Type } from "@google/genai";
import { SearchFilters, PropertyType } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const interpretSearchQuery = async (query: string): Promise<SearchFilters> => {
  if (!query) return {};

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User search query: "${query}"`,
      config: {
        systemInstruction: `
          You are a helpful assistant for a luxury real estate website.
          Your goal is to extract search filters from the user's natural language query.
          
          The available Property Types are: Villa, Apartamento, Penthouse, Mansión, Finca.
          Map user terms like "casa" or "home" to Villa or Mansión depending on context, or ignore if vague.
          "Piso" or "Flat" maps to Apartamento.
          
          Return a JSON object.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            location: { type: Type.STRING, description: "City or Country mentioned" },
            minPrice: { type: Type.NUMBER, description: "Minimum price if mentioned" },
            maxPrice: { type: Type.NUMBER, description: "Maximum price if mentioned" },
            minBedrooms: { type: Type.NUMBER, description: "Minimum number of bedrooms" },
            propertyType: { 
              type: Type.STRING, 
              enum: [
                PropertyType.VILLA,
                PropertyType.APARTMENT,
                PropertyType.PENTHOUSE,
                PropertyType.MANSION,
                PropertyType.ESTATE,
                PropertyType.UNKNOWN
              ]
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return {};
    
    return JSON.parse(text) as SearchFilters;

  } catch (error) {
    console.error("Error interpreting search query with Gemini:", error);
    return {};
  }
};