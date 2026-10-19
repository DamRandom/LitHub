import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, quotes: [] }, { status: 401 })
    }

    const quotes = await prisma.quote.findMany({
      where: { usuario: user.usuario },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, quotes })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json({ success: false, quotes: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { bookId, text, page, favorite } = body

    if (!bookId || !text?.trim()) {
      return NextResponse.json({ success: false, message: 'Book and text are required.' }, { status: 400 })
    }

    const newQuote = await prisma.quote.create({
      data: {
        bookId,
        text: text.trim(),
        page: page ? Number(page) : null,
        favorite: Boolean(favorite),
        usuario: user.usuario,
      },
    })

    return NextResponse.json({ success: true, quote: newQuote })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
