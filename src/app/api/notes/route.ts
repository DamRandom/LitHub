import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, notes: [] }, { status: 401 })
    }

    const notes = await prisma.note.findMany({
      where: { usuario: user.usuario },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = notes.map((n) => ({
      id: n.id,
      bookId: n.bookId,
      text: n.content,
      page: n.page,
      chapter: n.chapter,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.createdAt.toISOString(),
    }))

    return NextResponse.json({ success: true, notes: formatted })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ success: false, notes: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { bookId, text, page, chapter } = body

    if (!bookId || !text?.trim()) {
      return NextResponse.json({ success: false, message: 'Book and text are required.' }, { status: 400 })
    }

    const newNote = await prisma.note.create({
      data: {
        bookId,
        content: text.trim(),
        page: page ? Number(page) : null,
        chapter: chapter ? String(chapter) : null,
        usuario: user.usuario,
      },
    })

    return NextResponse.json({
      success: true,
      note: {
        id: newNote.id,
        bookId: newNote.bookId,
        text: newNote.content,
        page: newNote.page,
        chapter: newNote.chapter,
        createdAt: newNote.createdAt.toISOString(),
        updatedAt: newNote.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
