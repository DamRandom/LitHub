'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  coverImage: string | null;
  status: string;
}

export default function BooksToReadLater() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    async function loadBooks() {
      const res = await fetch('/data/books.json', { cache: 'no-store' });
      const data: Book[] = await res.json();

      // Solo libros con coverImage + status "pending"
      setBooks(
        data.filter((b) => b.status === 'pending' && Boolean(b.coverImage))
      );
    }

    loadBooks();
  }, []);

  return (
    <section className="py-10 px-6 lg:px-12 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">To Read Later</h2>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-medium transition">
            <Plus size={18} />
            Add New
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="relative w-full aspect-[2/3] overflow-hidden shadow-md group"
            >
              {book.coverImage && (
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 200px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
