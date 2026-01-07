import ProductCard from '@/components/ui/ProductCard'

export default function ProductSlider({ products }) {
  if (!products.length) return null

  return (
    <div className="flex gap-4 overflow-x-auto scroll-smooth px-2 scrollbar-hide">
      {products.map((product) => (
        <div key={product.id} className="min-w-[250px] max-w-[250px] flex-shrink-0">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}