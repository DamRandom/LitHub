"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import SearchInput from "./ui/SearchInput";
import SortDirectionButton from "./ui/SortDirectionButton";
import SortSelect from "./ui/SortSelect";

interface Book {
  id: number;
  title: string;
  author: string;
  sagaId: number | null;
  coverImage: string | null;
  description: string;
  tags?: string[];
  addedAt?: string;
}

interface Collection {
  id: number;
  name: string;
}

type SortField = "name" | "added" | "author";

export default function Collections() {
  const [books, setBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const booksRes = await fetch("/data/books.json", { cache: "no-store" });
    const colsRes = await fetch("/data/sagas.json", { cache: "no-store" });

    const booksData: Book[] = await booksRes.json();
    const colsData: Collection[] = await colsRes.json();

    setBooks(booksData);
    setCollections(colsData);
  }

  const getBooksForCollection = useCallback(
    (id: number) => books.filter((b) => b.sagaId === id),
    [books]
  );

  const booksInCollectionsCount = useMemo(() => {
    const sagaIds = new Set(collections.map((c) => c.id));
    return books.filter((b) => b.sagaId !== null && sagaIds.has(b.sagaId))
      .length;
  }, [books, collections]);

  const filteredAndSortedCollections = useMemo(() => {
    let result = [...collections];

    const q = search.trim().toLowerCase();
    if (q !== "") {
      result = result.filter((col) => {
        if (col.name.toLowerCase().includes(q)) return true;

        const colBooks = getBooksForCollection(col.id);

        if (colBooks.some((b) => b.author?.toLowerCase().includes(q)))
          return true;

        if (
          colBooks.some((b) =>
            (b.tags || []).some((tag) => tag.toLowerCase().includes(q))
          )
        )
          return true;

        return false;
      });
    }

    result.sort((a, b) => {
      const aBooks = getBooksForCollection(a.id);
      const bBooks = getBooksForCollection(b.id);

      let valA = "";
      let valB = "";

      switch (sortField) {
        case "name":
          valA = a.name;
          valB = b.name;
          break;

        case "author":
          valA = aBooks[0]?.author ?? "";
          valB = bBooks[0]?.author ?? "";
          break;

        case "added":
          valA = aBooks[0]?.addedAt ?? "";
          valB = bBooks[0]?.addedAt ?? "";
          break;
      }

      if (sortDir === "asc") return valA.localeCompare(valB);
      return valB.localeCompare(valA);
    });

    return result;
  }, [collections, search, sortField, sortDir, getBooksForCollection]);

  return (
    <section className="py-6 px-3 max-w-3xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg text-gray-500">
            There are {collections.length} collections
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            ({booksInCollectionsCount} books)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search collections…"
            debounceMs={200}
            autoFocus={false}
          />

          <SortSelect
            value={sortField}
            onChange={(val) => setSortField(val as SortField)}
            options={[
              { label: "Name", value: "name" },
              { label: "Author", value: "author" },
              { label: "Added", value: "added" },
            ]}
          />

          <SortDirectionButton
            direction={sortDir}
            onToggle={() =>
              setSortDir((d) => (d === "asc" ? "desc" : "asc"))
            }
          />
        </div>
      </header>

      <div className="space-y-6">
        {filteredAndSortedCollections.map((col) => {
          const colBooks = getBooksForCollection(col.id);
          const sample = colBooks[0];
          const mainAuthor = sample?.author ?? "";
          const covers = colBooks.slice(0, 3);

          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-[96px_1fr] gap-3 items-start"
            >
              <div className="relative h-28 w-full flex items-center justify-center">
                {covers.length > 0 ? (
                  covers.map((book, i) => {
                    const validSrc =
                      book.coverImage && book.coverImage.trim() !== ""
                        ? book.coverImage
                        : null;

                    const rotations = ["-5deg", "0deg", "5deg"];
                    const offsets = ["-12px", "0px", "12px"];

                    return (
                      <div
                        key={book.id}
                        className="absolute w-16 h-24 overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
                        style={{
                          transform: `rotate(${rotations[i]}) translateX(${offsets[i]})`,
                          zIndex: 10 - i,
                        }}
                      >
                        {validSrc ? (
                          <Image
                            src={validSrc}
                            alt={book.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                            No cover
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="w-16 h-24 bg-gray-100 flex items-center justify-center text-gray-400 text-[11px]">
                    No books
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {col.name}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {colBooks.length} book{colBooks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {mainAuthor && (
                  <p className="text-xs text-gray-500 font-medium">
                    {mainAuthor}
                  </p>
                )}

                {sample ? (
                  <p className="text-xs text-gray-600 leading-snug line-clamp-3 max-w-[44ch]">
                    {sample.description}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    No description available.
                  </p>
                )}

                {sample?.tags && sample.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sample.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-gray-600 bg-gray-100 px-2 py-[2px] rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
