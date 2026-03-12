'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Shield, RotateCcw, Star, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';

export default function HomeClient() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, catsRes] = await Promise.all([
          api.get('/products/featured'),
          api.get('/categories'),
        ]);
        setFeaturedProducts(productsRes.data.data);
        setCategories(catsRes.data.data.slice(0, 8));
      } catch { }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>Trusted by 50,000+ customers</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight mb-6">
              Your One-Stop<br />
              <span className="text-yellow-300">Retail & Wholesale</span><br />
              Marketplace
            </h1>
            <p className="text-lg text-primary-100 mb-8 leading-relaxed">
              Shop thousands of products at the best prices. Retail customers enjoy easy shopping, while wholesale buyers get bulk pricing and exclusive deals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Shop Now
              </Link>
              <Link href="/wholesale" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold py-3 px-8 rounded-xl hover:bg-white/30 transition-colors">
                Wholesale Access
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: Shield, title: 'Secure Payments', desc: '100% safe & encrypted' },
              { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
              { icon: Star, title: 'Quality Assured', desc: 'Verified sellers only' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
              <Link href="/products" className="text-primary-600 font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map(cat => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl hover:shadow-md hover:border-primary-200 border border-transparent transition-all"
                >
                  {cat.image?.url ? (
                    <img src={cat.image.url} alt={cat.name} className="w-12 h-12 object-cover rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">🛍️</div>
                  )}
                  <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked products for you</p>
            </div>
            <Link href="/products" className="btn-outline text-sm py-2 px-4 flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map(product => <ProductCard key={product._id} product={product} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3" />
              <p>No featured products yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Wholesale Banner */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative max-w-2xl">
              <span className="badge bg-white/20 text-white text-sm mb-4 inline-block">🏪 For Business Owners</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Wholesale Access for Your Business</h2>
              <p className="text-amber-100 mb-6 leading-relaxed">
                Get exclusive bulk pricing, priority support, and dedicated account management. Apply for wholesale access today and unlock better margins.
              </p>
              <Link href="/wholesale" className="bg-white text-amber-700 font-bold py-3 px-8 rounded-xl hover:bg-amber-50 transition-colors inline-flex items-center gap-2">
                Apply for Wholesale <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
