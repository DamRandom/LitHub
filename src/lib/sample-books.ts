import { PrismaClient } from '@prisma/client'
import { AppData, Book, Collection } from './store'

export const SAMPLE_COLLECTION = {
  name: 'Blood and Moonlight',
  description: 'Saga de fantasía medieval y misterio de Erin Beaty',
  coverColor: '#1e1b4b',
}

export const SAMPLE_BOOKS = [
  {
    title: 'Blood and Moonlight',
    author: 'Erin Beaty',
    description:
      'En la ciudad medieval de Collis se alza el Santo Sanctum. Catrin, una joven huérfana con una visión mágica secreta, presencia un brutal asesinato. Debido a esto, se ve arrastrada a una peligrosa cadena de crímenes y termina atrapada entre el brillante y enigmático detective Simon, quien investiga el caso con una precisión aterradora, y el asesino en serie al que este persigue. Catrin deberá ocultar sus poderes prohibidos otorgados por la luna mientras intenta evitar convertirse en la siguiente víctima.',
    pages: 448,
    format: 'epub' as const,
    coverImage: '/uploads/covers/blood-and-moonlight.jpg',
    filePath: '/uploads/books/blood-and-moonlight.epub',
    fileUrl: '/uploads/books/blood-and-moonlight.epub',
    publisher: 'Farrar, Straus and Giroux (BYR)',
    isbn: '9781250755827',
    language: 'en',
    tags: ['Fantasía oscura', 'misterio', 'thriller', 'romance', 'juvenil (Young Adult)'],
    status: 'finished' as const,
    progress: 100,
    rating: 5,
    dateStarted: '2026-09-01',
    dateFinished: '2026-09-20',
  },
  {
    title: 'Silence and Shadow',
    author: 'Erin Beaty',
    description:
      'Tras un explosivo enfrentamiento contra un despiadado asesino, la novicia Selenae Catrin y el perfilador criminal Simon huyen hacia la enorme ciudad de Londunium. Para evitar levantar sospechas, fingen estar recién casados. Sin embargo, la seguridad de ambos corre peligro cuando un consejo de líderes mágicos universitarios amenaza con borrar la memoria de Simon para proteger sus secretos. Cuando una serie de cuerpos mutilados aparece en los bosques aledaños, Simon es reclutado para perfilar al nuevo asesino, sumergiendo a ambos de regreso en un mundo de magia peligrosa, muerte y caos.',
    pages: 464,
    format: 'epub' as const,
    coverImage: '/uploads/covers/silence-and-shadow.jpg',
    filePath: '/uploads/books/silence-and-shadow.epub',
    fileUrl: '/uploads/books/silence-and-shadow.epub',
    publisher: 'Farrar, Straus and Giroux (BYR)',
    isbn: '9781250755841',
    language: 'en',
    tags: ['Romantasy', 'fantasía medieval', 'misterio', 'romance', 'magia', 'juvenil (Young Adult)'],
    status: 'reading' as const,
    progress: 50, // Página ~232 de 464
    rating: null,
    dateStarted: '2026-10-01',
    dateFinished: null,
  },
]

/**
 * Seeds sample books and saga collection into the database for a user
 * only if they don't already exist.
 */
export async function seedUserSampleBooks(prisma: PrismaClient, usuario: string) {
  try {
    let collection = await prisma.collection.findFirst({
      where: { usuario, name: SAMPLE_COLLECTION.name },
    })

    if (!collection) {
      collection = await prisma.collection.create({
        data: {
          name: SAMPLE_COLLECTION.name,
          description: SAMPLE_COLLECTION.description,
          usuario,
        },
      })
    }

    for (const book of SAMPLE_BOOKS) {
      const exists = await prisma.book.findFirst({
        where: { usuario, title: book.title },
      })

      if (!exists) {
        await prisma.book.create({
          data: {
            title: book.title,
            author: book.author,
            description: book.description,
            pages: book.pages,
            format: book.format,
            coverImage: book.coverImage,
            fileUrl: book.fileUrl,
            publisher: book.publisher,
            isbn: book.isbn,
            language: book.language,
            tags: JSON.stringify(book.tags),
            status: book.status,
            progress: book.progress,
            rating: book.rating || 0,
            dateStarted: book.dateStarted,
            dateFinished: book.dateFinished,
            sagaId: collection.id,
            usuario,
          },
        })
      }
    }
  } catch (err) {
    console.error(`Error seeding sample books for ${usuario}:`, err)
  }
}

/**
 * Initial sample data for guest mode (without DB persistence)
 */
export function getGuestInitialData(): AppData {
  const colId = 'guest-col-blood-moonlight'
  const now = new Date().toISOString()

  const guestCollection: Collection = {
    id: colId,
    usuario: 'guest',
    name: SAMPLE_COLLECTION.name,
    description: SAMPLE_COLLECTION.description,
    coverColor: SAMPLE_COLLECTION.coverColor,
    createdAt: '2026-09-01T00:00:00.000Z',
  }

  const guestBook1: Book = {
    id: 'guest-book-1',
    usuario: 'guest',
    title: SAMPLE_BOOKS[0].title,
    author: SAMPLE_BOOKS[0].author,
    description: SAMPLE_BOOKS[0].description,
    pages: SAMPLE_BOOKS[0].pages,
    format: SAMPLE_BOOKS[0].format,
    coverImage: SAMPLE_BOOKS[0].coverImage,
    filePath: SAMPLE_BOOKS[0].filePath,
    fileUrl: SAMPLE_BOOKS[0].fileUrl,
    publisher: SAMPLE_BOOKS[0].publisher,
    isbn: SAMPLE_BOOKS[0].isbn,
    language: SAMPLE_BOOKS[0].language,
    sagaId: colId,
    tags: [...SAMPLE_BOOKS[0].tags],
    status: SAMPLE_BOOKS[0].status,
    progress: SAMPLE_BOOKS[0].progress,
    rating: SAMPLE_BOOKS[0].rating,
    dateStarted: SAMPLE_BOOKS[0].dateStarted,
    dateFinished: SAMPLE_BOOKS[0].dateFinished,
    favorite: false,
    addedAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    lastOpenedAt: null,
  }

  const guestBook2: Book = {
    id: 'guest-book-2',
    usuario: 'guest',
    title: SAMPLE_BOOKS[1].title,
    author: SAMPLE_BOOKS[1].author,
    description: SAMPLE_BOOKS[1].description,
    pages: SAMPLE_BOOKS[1].pages,
    format: SAMPLE_BOOKS[1].format,
    coverImage: SAMPLE_BOOKS[1].coverImage,
    filePath: SAMPLE_BOOKS[1].filePath,
    fileUrl: SAMPLE_BOOKS[1].fileUrl,
    publisher: SAMPLE_BOOKS[1].publisher,
    isbn: SAMPLE_BOOKS[1].isbn,
    language: SAMPLE_BOOKS[1].language,
    sagaId: colId,
    tags: [...SAMPLE_BOOKS[1].tags],
    status: SAMPLE_BOOKS[1].status,
    progress: SAMPLE_BOOKS[1].progress,
    rating: null,
    dateStarted: SAMPLE_BOOKS[1].dateStarted,
    dateFinished: null,
    favorite: true,
    addedAt: '2026-10-01T00:00:00.000Z',
    updatedAt: now,
    lastOpenedAt: now,
  }

  return {
    collections: [guestCollection],
    books: [guestBook1, guestBook2],
    quotes: [],
    notes: [],
    sessions: [],
  }
}
