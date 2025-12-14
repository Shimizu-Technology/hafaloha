import { Link } from 'react-router-dom';
import FeaturedProducts from '../components/FeaturedProducts';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Island Living theme */}
      <div 
        className="relative bg-cover bg-center text-white"
        style={{ 
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920')" 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 sm:p-12 inline-block max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-gray-900">
              Island Living Apparel for All 🌺
            </h1>
            <p className="text-xl sm:text-2xl mb-3 text-hafalohaRed font-semibold">
              Håfa Adai Spirit + Essence of Aloha
            </p>
            <p className="text-lg mb-6 sm:mb-8 text-gray-700">
              Premium Chamorro pride merchandise celebrating island culture and heritage
            </p>
            <Link
              to="/products"
              className="inline-block bg-hafalohaRed text-white font-bold px-10 py-4 rounded-lg hover:bg-red-700 transition text-lg shadow-lg hover:shadow-xl"
            >
              Shop Now →
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-gray-50">
        <FeaturedProducts />
      </div>

      {/* Founder Teaser Section */}
      <div className="bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">The Hafaloha Story</h2>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 sm:p-12">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Håfa Adai! We're Leonard and Tara Kaae, the founders of Hafaloha. What started as just 
              a few designs and a dream has grown into something we're incredibly proud of. From merch 
              to shave ice, we're celebrating Chamorro culture and island life through everything we create.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed italic">
              "Hafaloha is more than just products or a brand—it's a lifestyle and a way of life."
            </p>
            <Link
              to="/about"
              className="inline-block mt-6 bg-hafalohaRed text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-lg"
            >
              Read Our Full Story →
            </Link>
          </div>
        </div>
      </div>

      {/* Shop by Gender - matching their old site */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12 text-gray-900">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Shop Womens */}
            <Link 
              to="/products?category=womens"
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition"
            >
              <div 
                className="aspect-[4/3] bg-cover bg-center"
                style={{ 
                  backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800')" 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">Shop Womens</h3>
                  <p className="text-lg mb-4">Vibrant styles for island living</p>
                  <span className="inline-block bg-hafalohaRed px-6 py-2 rounded-lg group-hover:bg-red-700 transition font-semibold">
                    Shop Now →
                  </span>
                </div>
              </div>
            </Link>

            {/* Shop Mens */}
            <Link 
              to="/products?category=mens"
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition"
            >
              <div 
                className="aspect-[4/3] bg-cover bg-center"
                style={{ 
                  backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800')" 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-2">Shop Mens</h3>
                  <p className="text-lg mb-4">Bold designs with island pride</p>
                  <span className="inline-block bg-hafalohaRed px-6 py-2 rounded-lg group-hover:bg-red-700 transition font-semibold">
                    Shop Now →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

