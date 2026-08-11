export enum PropertyType {
  VILLA = 'Villa',
  APARTMENT = 'Apartamento',
  PENTHOUSE = 'Penthouse',
  MANSION = 'Mansión',
  ESTATE = 'Finca',
  UNKNOWN = 'Desconocido'
}

export interface PrivateData {
  ownerName: string;
  ownerPhone: string;
  legalDescription: string;
  privateNotes: string;
}

export interface Property {
  id: string;
  title: string;
  subtitle?: string; // Short elegant description
  location: string;
  price: number;
  currency: string;
  imageUrl: string;
  bedrooms: number;
  bathrooms: number;
  area: number; // in sq meters
  type: PropertyType;
  description: string;
  amenities?: string[]; // List of features
  isPremium?: boolean; // New: Manual flag for Premium classification
  privateData?: PrivateData; // Optional field for admin use only
}

export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  propertyType?: PropertyType;
}

export interface HeroSearchState {
  location: string;
  bedrooms: string;
  priceRange: string;
}