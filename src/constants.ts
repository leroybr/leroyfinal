import { Property, PropertyType, ListingType } from './types';

export const COMMUNES = [
  'Concepción',
  'San Pedro de la Paz'
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'espectacular-1',
    title: 'Residencia San Pedro del Valle',
    subtitle: 'Arquitectura orgánica y vistas ininterrumpidas al lago',
    location: 'San Pedro de la Paz, Chile',
    price: 32500,
    currency: 'UF',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop',
    bedrooms: 5,
    bathrooms: 6,
    area: 580,
    landArea: 1200,
    parking: 4,
    type: PropertyType.MANSION,
    listingType: ListingType.SALE,
    description: 'Esta impresionante propiedad de diseño contemporáneo destaca por su integración total con el entorno natural. El uso extensivo de maderas nobles en cielos y muros, junto a ventanales de piso a cielo, crean una experiencia de vida única frente al lago. Incluye cocina de alta gama con isla de cuarzo y una terraza panorámica que redefine el concepto de exterior.',
    amenities: ['Muelle Privado', 'Cielos de Madera', 'Cocina de Autor', 'Terraza Panorámica', 'Domótica'],
    isPremium: true,
    categoryImages: [
      { category: 'Exterior', imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=600&auto=format&fit=crop' },
      { category: 'Living', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop' },
      { category: 'Kitchen', imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=600&auto=format&fit=crop' },
      { category: 'Bedrooms', imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=600&auto=format&fit=crop' },
      { category: 'Bathrooms', imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=600&auto=format&fit=crop' },
      { category: 'Other', imageUrl: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=600&auto=format&fit=crop' }
    ]
  },
  {
    id: '1',
    title: 'Villa Moderna Lonco',
    subtitle: 'Lujo costero redefinido en el sector más exclusivo',
    location: 'Concepción, Chile',
    price: 45000,
    currency: 'UF',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200&auto=format&fit=crop',
    bedrooms: 5,
    bathrooms: 6,
    area: 650,
    landArea: 2000,
    parking: 6,
    type: PropertyType.VILLA,
    listingType: ListingType.SALE,
    description: 'Espectacular villa moderna con vistas panorámicas y terminaciones de lujo.',
    amenities: ['Piscina Privada', 'Vista Panorámica', 'Seguridad 24/7'],
    isPremium: true
  },
  {
    id: 'cl-1',
    title: 'Casa Estilo Georgiano en Idahue',
    subtitle: 'Tradición y elegancia en San Pedro',
    location: 'San Pedro de la Paz, Chile',
    price: 18500,
    currency: 'UF',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-2a434f678417?q=80&w=1200&auto=format&fit=crop',
    bedrooms: 5,
    bathrooms: 4,
    area: 420,
    landArea: 800,
    parking: 3,
    type: PropertyType.MANSION,
    listingType: ListingType.SALE,
    description: 'Exclusiva propiedad en el sector más consolidado de San Pedro de la Paz.',
    amenities: ['Calefacción Central', 'Piscina Temperada'],
    isPremium: false
  },
  {
    id: 'rent-1',
    title: 'Penthouse de Lujo en Concepción',
    subtitle: 'Vistas panorámicas y terminaciones de primer nivel',
    location: 'Concepción, Chile',
    price: 120,
    currency: 'UF',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
    bedrooms: 3,
    bathrooms: 3,
    area: 210,
    parking: 2,
    type: PropertyType.PENTHOUSE,
    listingType: ListingType.RENT,
    description: 'Exclusivo penthouse amoblado en el corazón de Concepción. Seguridad 24/7 y acceso directo a servicios.',
    amenities: ['Amoblado', 'Gimnasio', 'Seguridad 24/7'],
    isPremium: true
  }
];
