import FadeIn from '../components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import Breadcrumbs from '../components/Breadcrumbs';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[
          { label: 'Home', path: '/' },
          { label: 'Our Story' }
        ]} />
      </div>

      {/* Hero Section - Clean and minimal */}
      <div className="bg-warm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <FadeIn direction="none">
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6 text-gray-900 tracking-tight">
              Our Story
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg sm:text-xl text-center max-w-2xl mx-auto text-gray-600">
              Celebrating Chamorro and Hawaiian cultures through island living apparel and lifestyle
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">

        {/* About Hafaloha Section */}
        <FadeIn>
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 tracking-tight">About Hafaloha</h2>
            <div className="max-w-prose">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                The name "Hafaloha" represents the Chamorro and Hawaiian cultures which are intertwined
                in the Kaae family - Tara Kaae being from Guam, and Len being from Hawaii. Just like the
                Kaae family, Guam and Hawaii are both beautiful cultural melting pots.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our apparel is designed to reflect the beauty of island living, and to bring the warm
                spirit of the islands to everyone wearing our clothing, no matter where they live. And
                our desserts - all cool - will refresh you on a hot day with the sweet taste of the islands.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Håfa Adai & Aloha Definitions */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Håfa Adai */}
          <StaggerItem>
            <div className="rounded-xl p-8 bg-warm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Håfa Adai!</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                "Håfa Adai" is a greeting used by the Chamorro people of the Mariana Islands
                (Guam, Rota, Tinian and Saipan). It invokes the familial spirit, warm affection,
                and "what is mine is yours" communal mindset of the Mariana Islands and its people.
              </p>
              <p className="text-gray-500 italic text-sm">
                "Hello" and "Hi" are friendly, but there is no greeting here quite like "Håfa Adai."
              </p>
            </div>
          </StaggerItem>

          {/* Aloha */}
          <StaggerItem>
            <div className="rounded-xl p-8 bg-warm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Aloha!</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                "Aloha" is a salutation used by the natives of the Hawaiian Islands. It is often
                thought to have a dual meaning of "hello" and "goodbye," but it also used at times
                to say "I love you."
              </p>
              <p className="text-gray-600 italic text-sm">
                "Aloha" is more than just a simple greeting. In Hawaiian, it has a deeper significance,
                including qualities like energy, life, and joy.
              </p>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Our Hope Philosophy */}
        <FadeIn>
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 tracking-tight">Our Hope</h2>
            <div className="max-w-prose">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Our desire is that the "Håfa Adai" mindset and "Aloha" spirit (as described above) would
                be combined in you. Our apparel is designed to reflect the beauty of island living, and to
                bring the warm mood of the islands to everyone wearing our apparel, no matter where they live.
                And our cool desserts will refresh you on a hot day with the sweet taste of the islands.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                But "Hafaloha" is more than just our products or our brand, it is a lifestyle and a way of life.
                Our hope is that your entire experience with us - from the island feel you get from wearing our
                clothing, to savoring our refreshing sweet treats, to visiting our store and interacting with
                our friendly staff family - would leave you immersed both in "Håfa Adai" and "Aloha".
              </p>
              <p className="text-xl text-hafalohaRed font-semibold mt-8 italic">
                We want you to truly feel, Hafaloha.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Founder Story */}
        <FadeIn>
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 tracking-tight">Meet the Founders</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Håfa Adai! We're Leonard Kaae Jr. and Tara Kaae, the founders of Hafaloha. What started as
                just a few designs and a dream has grown into something we're incredibly proud of. The first
                merch drops were folded, packed, and shipped from home-a small hustle built on creativity
                and community love.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                From there, the grind didn't stop. We took that same energy and expanded into shave ice,
                opening up a small shop that quickly became a local favorite. Over time, the menu grew,
                but the heart stayed the same: make good stuff, treat people right, and always bring the
                Håfa Adai spirit and the essence of Aloha.
              </p>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Now, years later, the brand has grown, the team has expanded, and the vision continues to
                evolve. The founders are still hands-on, side by side with the crew every day. Every
                product we create is a love letter to the islands-celebrating our roots while sharing our
                culture with the world.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Thank you for supporting Hafaloha and for being part of our island family. Whether you're
                from Guam, Hawaii, or anywhere else in the world, we're honored to share our culture with you.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Founder Photo & Team Info Section */}
        <div className="mb-16">
          <FadeIn>
            <h2 className="text-2xl font-semibold mb-8 text-gray-900 tracking-tight">Meet the Team</h2>
          </FadeIn>

          {/* Founders Photo */}
          <FadeIn direction="up" delay={0.1}>
            <div className="max-w-2xl mx-auto mb-10 overflow-hidden rounded-xl shadow-md">
              <img 
                src="/images/len_and_tara_hafaloha.webp" 
                alt="Leonard and Tara Kaae - Hafaloha Founders" 
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </FadeIn>

          {/* Team Info Cards */}
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Tara */}
            <StaggerItem>
              <div className="border border-gray-200 rounded-xl p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Tara Kaae</h3>
                <p className="text-hafalohaRed font-medium mb-4">VP & General Manager</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Favorite Food:</span> Spicy Salmon Poke Bowl</p>
                  <p><span className="font-medium">Favorite Dessert:</span> Acai smoothie with oat milk, extra peanut butter and VPP</p>
                  <p><span className="font-medium">Favorite Merch:</span> Any of our XXL umbrellas</p>
                </div>
              </div>
            </StaggerItem>

            {/* Leonard */}
            <StaggerItem>
              <div className="border border-gray-200 rounded-xl p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Leonard Kaae Jr.</h3>
                <p className="text-hafalohaRed font-medium mb-4">CEO & President</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Favorite Food:</span> Mochiko Plate</p>
                  <p><span className="font-medium">Favorite Dessert:</span> Lilikoi, Guava and Pineapple Shave Ice</p>
                  <p><span className="font-medium">Favorite Merch:</span> Lei Style T-Shirts</p>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Follow Us / Social Section */}
        <FadeIn>
          <div className="rounded-xl p-8 sm:p-10 mb-16 bg-warm text-center">
            <h2 className="text-2xl font-semibold mb-3 text-gray-900 tracking-tight">Follow Our Journey</h2>
            <p className="text-gray-600 mb-8 max-w-prose mx-auto">
              Stay connected with us on social media for behind-the-scenes content, new releases, and island vibes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://www.instagram.com/hafaloha"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                @hafaloha on Instagram
              </a>
              <a
                href="https://www.facebook.com/hafaloha"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Hafaloha on Facebook
              </a>
            </div>
          </div>
        </FadeIn>

        {/* Values Section */}
        <div className="mb-16">
          <FadeIn>
            <h2 className="text-2xl font-semibold mb-8 text-gray-900 tracking-tight">Our Values</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerItem>
              <div className="text-center p-6 rounded-xl bg-warm">
                <h3 className="text-lg font-medium mb-2 text-gray-900">Island Pride</h3>
                <p className="text-gray-600 text-sm">
                  Celebrating Chamorro and Hawaiian heritage through every product we create
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center p-6 rounded-xl bg-warm">
                <h3 className="text-lg font-medium mb-2 text-gray-900">Premium Quality</h3>
                <p className="text-gray-600 text-sm">
                  Using only the finest materials and designs that stand the test of time
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="text-center p-6 rounded-xl bg-warm">
                <h3 className="text-lg font-medium mb-2 text-gray-900">Community First</h3>
                <p className="text-gray-600 text-sm">
                  Building connections and supporting our island family, near and far
                </p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Call to Action */}
        <FadeIn>
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 tracking-tight">Ready to Experience Hafaloha?</h2>
            <p className="mb-6 max-w-xl mx-auto text-gray-600">
              Explore our collection of authentic Chamorro pride merchandise and bring the island spirit to your life.
            </p>
            <a
              href="/products"
              className="group inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Shop Now
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
