// src/app/home/page.tsx
export default function HomePage() {
    return (
      <main className="min-h-screen bg-[#f9f8f6] text-[#2b2b28]">
        {/* Hero section */}
        <section className="py-20 px-6 text-center bg-[#eae6df]">
          <h1 className="text-4xl font-bold mb-4">Welcome to LitHub</h1>
          <p className="text-lg max-w-xl mx-auto">
            Your personal space to manage books, track reading progress, and discover new literature.
          </p>
        </section>
  
        {/* Features section */}
        <section className="py-16 px-6 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Library</h2>
            <p className="text-sm">Organize your book collection in one place.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Tracking</h2>
            <p className="text-sm">Keep track of your current reads and goals.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Discover</h2>
            <p className="text-sm">Get book recommendations based on your taste.</p>
          </div>
        </section>
  
        {/* Stats section */}
        <section className="py-12 bg-[#ddd7cf] text-center">
          <div className="flex justify-center gap-10 flex-wrap max-w-4xl mx-auto">
            <div>
              <p className="text-3xl font-bold">124</p>
              <p className="text-sm">Books Read</p>
            </div>
            <div>
              <p className="text-3xl font-bold">8</p>
              <p className="text-sm">Currently Reading</p>
            </div>
            <div>
              <p className="text-3xl font-bold">42</p>
              <p className="text-sm">Recommendations</p>
            </div>
          </div>
        </section>
  
        {/* Footer */}
        <footer className="py-6 text-center text-sm text-[#908a80] border-t border-[#c6c1bb]">
          © {new Date().getFullYear()} LitHub. All rights reserved.
        </footer>
      </main>
    );
  }
  