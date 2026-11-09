import { verifiedStoreUrl } from '../config/site';
export interface Product {
  id: string;
  sku?: string;
  nameKey: 'productName';
  slug: string;
  category: 'hair-care' | 'skin-care';
  image?: { src: string; alt: string; width: number; height: number };
  shortDescriptionKey: 'productDescription';
  ingredientsReference?: string;
  officialStoreUrl?: string;
  availability?: 'in-stock' | 'out-of-stock'; // Only populate from an authoritative source.
  demonstration: boolean;
}
export const products: readonly Product[] = [
  {
    id: 'demo-hair-oil',
    nameKey: 'productName',
    slug: 'hair-oil-example',
    category: 'hair-care',
    shortDescriptionKey: 'productDescription',
    demonstration: true,
  },
];
export const purchaseUrl = (product: Product) =>
  verifiedStoreUrl(product.officialStoreUrl);
