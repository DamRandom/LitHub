import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import books from "../../public/data/books.json";

export default function ContinueReading() {
  const readingBook = books.find((book) => book.status === "reading");

  const [progress] = useState(48);

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="backdrop-blur-lg bg-white/10 shadow-2xl rounded-xl p-8 max-w-5xl w-full mt-18 flex flex-col md:flex-row gap-8"
      >
        {readingBook ? (
          <>
            <div className="flex-shrink-0 shadow-2xs w-full md:w-1/3">
              <Image
                src={readingBook.coverImage}
                alt={readingBook.title}
                width={300}
                height={450}
                className="shadow-md"
                priority
              />
            </div>

            <div className="flex flex-col justify-between w-full">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {readingBook.title}
                </h1>
                <h2 className="text-lg text-gray-500 mb-4">
                  by {readingBook.author}
                </h2>
                <p className="text-gray-900 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {readingBook.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gray-800"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="ml-4 text-sm text-gray-900">{progress}%</span>
              </div>

              <button className="mt-6 self-start bg-gray-800 hover:bg-gray-100 text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg transition-colors">
                Continue Reading
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-center">
            <Image
              src="/images/empty-reading.png"
              alt="No current book"
              width={300}
              height={300}
              className="mb-6 opacity-80"
            />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              You&apos;re not reading anything right now
            </h2>
            <p className="text-gray-600">
              Add a book to your current reading list and it’ll show up here.
            </p>
          </div>
        )}
      </motion.div>
    </main>
  );
}
