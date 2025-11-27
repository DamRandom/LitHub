'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, X } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  coverImage: string | null;
  status: string;
}

export default function BooksToReadLater() {
  const [books, setBooks] = useState<Book[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadBooks() {
      const res = await fetch('/data/books.json', { cache: 'no-store' });
      const data: Book[] = await res.json();

      setBooks(
        data.filter((b) => b.status === 'unread' && Boolean(b.coverImage))
      );
    }

    loadBooks();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const closeModal = () => setOpen(false);

  return (
    <section className="py-10 px-4 sm:px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="space-y-6 relative"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">To Read Later</h2>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm font-medium transition">
            <Plus size={18} />
            Add New
          </button>
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 pr-8">
            {books.map((book) => (
              <div
                key={book.id}
                className="relative flex-shrink-0 w-28 sm:w-32 md:w-36 lg:w-40 aspect-[2/3] overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-shadow duration-300"
              >
                {book.coverImage && (
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/5 hover:bg-black/15 transition" />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white/95 via-white/60 to-transparent" />

          <button
            onClick={() => setOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white hover:bg-gray-700 p-2 rounded-full shadow-md transition z-10"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {open && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] p-6 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition"
              >
                <X size={22} />
              </button>

              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                All Pending Books
              </h3>

              <div className="overflow-y-auto pr-2 max-h-[70vh]">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className="relative w-full aspect-[2/3] overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-shadow duration-300 hover:shadow-[0_6px_14px_rgba(0,0,0,0.3)]"
                    >
                      {book.coverImage && (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          sizes="150px"
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/5 hover:bg-black/15 transition" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
