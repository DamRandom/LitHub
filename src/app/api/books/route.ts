import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, books: [] }, { status: 401 })
    }

    const books = await prisma.book.findMany({
      where: { usuario: user.usuario },
      orderBy: { createdAt: 'desc' },
    })

    const formattedBooks = books.map((b) => ({
      ...b,
      tags: typeof b.tags === 'string' ? JSON.parse(b.tags || '[]') : b.tags,
    }))

    return NextResponse.json({ success: true, books: formattedBooks })
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json({ success: false, books: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      author,
      sagaId,
      pages,
      format,
      description,
      status,
      coverImage,
      fileUrl,
      language,
      tags,
      isbn,
      publisher,
      progress,
      rating,
      dateStarted,
      dateFinished,
    } = body

    if (!title?.trim() || !author?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Title and author are required.' },
        { status: 400 }
      )
    }

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        sagaId: sagaId || null,
        pages: Number(pages) || 0,
        format: format || 'physical',
        description: description || '',
        status: status || 'unread',
        coverImage: coverImage || '',
        fileUrl: fileUrl || '',
        language: language || 'en',
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        isbn: isbn || '',
        publisher: publisher || '',
        progress: Number(progress) || 0,
        rating: Number(rating) || 0,
        dateStarted: dateStarted || null,
        dateFinished: dateFinished || null,
        usuario: user.usuario,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Book added successfully.',
      book: {
        ...newBook,
        tags: JSON.parse(newBook.tags || '[]'),
      },
    })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json(
      { success: false, message: 'Internal error saving book to database.' },
      { status: 500 }
    )
  }
}
