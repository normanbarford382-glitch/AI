import ProductCard from '../products/ProductCard';
import type { Product } from '../../types';

export default function SpecialOffers({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
