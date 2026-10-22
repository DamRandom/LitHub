-- Migration: 20261021_init_postgresql
-- Description: Initial schema migration from SQLite to PostgreSQL for LitHub
-- Generated for: Neon PostgreSQL (Prisma 6.x)

-- CreateTable
CREATE TABLE "User" (
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "sexo" TEXT NOT NULL DEFAULT 'Masculino',
    "rol" TEXT NOT NULL DEFAULT 'usuario',
    "bio" TEXT DEFAULT '',
    "avatar" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("usuario")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "sagaId" TEXT,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT NOT NULL DEFAULT 'physical',
    "description" TEXT DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'unread',
    "coverImage" TEXT DEFAULT '',
    "fileUrl" TEXT DEFAULT '',
    "dateStarted" TEXT,
    "dateFinished" TEXT,
    "rating" INTEGER DEFAULT 0,
    "language" TEXT NOT NULL DEFAULT 'es',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isbn" TEXT DEFAULT '',
    "publisher" TEXT DEFAULT '',
    "lastOpenedAt" TIMESTAMP(3),
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "page" INTEGER,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "page" INTEGER,
    "chapter" TEXT,
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_usuario_idx" ON "Book"("usuario");

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");

-- CreateIndex
CREATE INDEX "Book_usuario_status_idx" ON "Book"("usuario", "status");

-- CreateIndex
CREATE INDEX "Quote_usuario_idx" ON "Quote"("usuario");

-- CreateIndex
CREATE INDEX "Quote_bookId_idx" ON "Quote"("bookId");

-- CreateIndex
CREATE INDEX "Note_usuario_idx" ON "Note"("usuario");

-- CreateIndex
CREATE INDEX "Note_bookId_idx" ON "Note"("bookId");

-- CreateIndex
CREATE INDEX "ReadingSession_usuario_idx" ON "ReadingSession"("usuario");

-- CreateIndex
CREATE INDEX "ReadingSession_bookId_idx" ON "ReadingSession"("bookId");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_usuario_fkey" FOREIGN KEY ("usuario") REFERENCES "User"("usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_usuario_fkey" FOREIGN KEY ("usuario") REFERENCES "User"("usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_sagaId_fkey" FOREIGN KEY ("sagaId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_usuario_fkey" FOREIGN KEY ("usuario") REFERENCES "User"("usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_usuario_fkey" FOREIGN KEY ("usuario") REFERENCES "User"("usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_usuario_fkey" FOREIGN KEY ("usuario") REFERENCES "User"("usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
