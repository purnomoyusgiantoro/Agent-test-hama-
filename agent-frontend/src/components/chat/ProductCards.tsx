import { ExternalLink, ShoppingBag } from 'lucide-react'

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
  image_url: string;
  shopee_url: string;
}

interface ProductCardsProps {
  products: ProductInfo[];
}

export default function ProductCards({ products }: ProductCardsProps) {
  if (products.length === 0) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag size={14} className="text-orange-500" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk Rekomendasi</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.shopee_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 w-44 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 cursor-pointer"
          >
            <div className="relative w-full h-28 bg-gray-50 overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">No Image</text></svg>'
                }}
              />
              <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <ExternalLink size={8} />
                Shopee
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug mb-1.5 group-hover:text-orange-600 transition-colors">
                {product.name}
              </h4>
              <p className="text-sm font-bold text-orange-600">
                {formatPrice(product.price)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
