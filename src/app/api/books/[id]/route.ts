import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params
    const book = await prisma.book.findFirst({
      where: { id, usuario: user.usuario },
      include: {
        quotes: true,
        notes: true,
        sessions: true,
      },
    })

    if (!book) {
      return NextResponse.json({ success: false, message: 'Book not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      book: {
        ...book,
        tags: typeof book.tags === 'string' ? JSON.parse(book.tags || '[]') : book.tags,
      },
    })
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Verify ownership
    const existing = await prisma.book.findFirst({
      where: { id, usuario: user.usuario },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Book not found.' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.author !== undefined) updateData.author = body.author.trim()
    if (body.sagaId !== undefined) updateData.sagaId = body.sagaId || null
    if (body.pages !== undefined) updateData.pages = Number(body.pages)
    if (body.format !== undefined) updateData.format = body.format
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl
    if (body.rating !== undefined) updateData.rating = Number(body.rating)
    if (body.progress !== undefined) updateData.progress = Number(body.progress)
    if (body.dateStarted !== undefined) updateData.dateStarted = body.dateStarted
    if (body.dateFinished !== undefined) updateData.dateFinished = body.dateFinished
    if (body.favorite !== undefined) updateData.favorite = Boolean(body.favorite)
    if (body.tags !== undefined) {
      updateData.tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : [])
    }

    const updated = await prisma.book.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully.',
      book: {
        ...updated,
        tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : updated.tags,
      },
    })
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.book.findFirst({
      where: { id, usuario: user.usuario },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Book not found.' }, { status: 404 })
    }

    await prisma.book.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Book deleted successfully.' })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
