/**
 * migrate-data.mjs
 *
 * Script de migración de datos: SQLite (lithub.db) → Neon PostgreSQL
 *
 * USO:
 *   1. Asegúrate de que .env.local tiene las credenciales correctas de Neon.
 *   2. Asegúrate de haber ejecutado: npm run migrate:deploy  (schema aplicado a Neon)
 *   3. Ejecuta: node prisma/migrate-data.mjs
 *
 * El script es idempotente: usa upsert para no duplicar registros.
 * Puedes ejecutarlo varias veces sin riesgo.
 */

import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'lithub.db')

if (!fs.existsSync(DB_PATH)) {
  console.error('❌  lithub.db not found at', DB_PATH)
  console.error('    Place the SQLite backup in the prisma/ directory and retry.')
  process.exit(1)
}

const sqlite = new Database(DB_PATH, { readonly: true })
const prisma = new PrismaClient()

async function migrate() {
  console.log('🔄  Starting migration: SQLite → Neon PostgreSQL\n')

  // ---- Users ----
  const users = sqlite.prepare('SELECT * FROM User').all()
  console.log(`👤  Migrating ${users.length} users...`)
  for (const u of users) {
    await prisma.user.upsert({
      where: { usuario: u.usuario },
      create: {
        usuario: u.usuario,
        nombre: u.nombre,
        apellido: u.apellido,
        passwordHash: u.passwordHash,
        edad: u.edad,
        sexo: u.sexo || 'Masculino',
        rol: u.rol || 'usuario',
        bio: u.bio || '',
        avatar: u.avatar || '',
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
      update: {},  // don't overwrite existing data
    })
  }
  console.log('   ✅  Users migrated\n')

  // ---- Collections ----
  const collections = sqlite.prepare('SELECT * FROM Collection').all()
  console.log(`📚  Migrating ${collections.length} collections...`)
  for (const c of collections) {
    await prisma.collection.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        description: c.description || '',
        usuario: c.usuario,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
      update: {},
    })
  }
  console.log('   ✅  Collections migrated\n')

  // ---- Books ----
  const books = sqlite.prepare('SELECT * FROM Book').all()
  console.log(`📖  Migrating ${books.length} books...`)
  for (const b of books) {
    await prisma.book.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        title: b.title,
        author: b.author,
        sagaId: b.sagaId || null,
        pages: b.pages || 0,
        format: b.format || 'physical',
        description: b.description || '',
        status: b.status || 'unread',
        coverImage: b.coverImage || '',
        fileUrl: b.fileUrl || '',
        dateStarted: b.dateStarted || null,
        dateFinished: b.dateFinished || null,
        rating: b.rating || 0,
        language: b.language || 'es',
        tags: b.tags || '[]',
        favorite: b.favorite === 1 || b.favorite === true,
        progress: b.progress || 0,
        isbn: b.isbn || '',
        publisher: b.publisher || '',
        lastOpenedAt: b.lastOpenedAt ? new Date(b.lastOpenedAt) : null,
        usuario: b.usuario,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      },
      update: {},
    })
  }
  console.log('   ✅  Books migrated\n')

  // ---- Quotes ----
  const quotes = sqlite.prepare('SELECT * FROM Quote').all()
  console.log(`💬  Migrating ${quotes.length} quotes...`)
  for (const q of quotes) {
    await prisma.quote.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        bookId: q.bookId,
        text: q.text,
        page: q.page || null,
        favorite: q.favorite === 1 || q.favorite === true,
        usuario: q.usuario,
        createdAt: new Date(q.createdAt),
      },
      update: {},
    })
  }
  console.log('   ✅  Quotes migrated\n')

  // ---- Notes ----
  const notes = sqlite.prepare('SELECT * FROM Note').all()
  console.log(`📝  Migrating ${notes.length} notes...`)
  for (const n of notes) {
    await prisma.note.upsert({
      where: { id: n.id },
      create: {
        id: n.id,
        bookId: n.bookId,
        content: n.content,
        page: n.page || null,
        chapter: n.chapter || null,
        usuario: n.usuario,
        createdAt: new Date(n.createdAt),
      },
      update: {},
    })
  }
  console.log('   ✅  Notes migrated\n')

  // ---- ReadingSessions ----
  const sessions = sqlite.prepare('SELECT * FROM ReadingSession').all()
  console.log(`⏱️   Migrating ${sessions.length} reading sessions...`)
  for (const s of sessions) {
    await prisma.readingSession.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        bookId: s.bookId,
        pagesRead: s.pagesRead || 0,
        durationMinutes: s.durationMinutes || 0,
        date: s.date,
        usuario: s.usuario,
        createdAt: new Date(s.createdAt),
      },
      update: {},
    })
  }
  console.log('   ✅  Reading sessions migrated\n')

  console.log('🎉  Migration completed successfully!')
  console.log('\nSummary:')
  console.log(`   Users:    ${users.length}`)
  console.log(`   Books:    ${books.length}`)
  console.log(`   Quotes:   ${quotes.length}`)
  console.log(`   Notes:    ${notes.length}`)
  console.log(`   Sessions: ${sessions.length}`)
}

migrate()
  .catch((e) => {
    console.error('❌  Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    sqlite.close()
  })
