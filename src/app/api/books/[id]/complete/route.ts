import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/books/[id]/complete
 *
 * Marks a book as finished and then removes it from the user's active reading list.
 * The book record itself is deleted (per-user ownership model), but this is safe because
 * in the current schema books are personal — each user owns their own Book row.
 * Quotes and Notes associated to the book are deleted by cascade (expected behaviour:
 * they belong to the reading experience, not to a shared catalog).
 *
 * If the project ever moves to a shared-catalog architecture, this endpoint must be
 * updated to only delete the ReadingProgress row, not the Book row.
 *
 * Idempotent: calling this on an already-deleted book returns 200 gracefully.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const { id } = await params

    if (!id?.trim()) {
      return NextResponse.json({ success: false, message: 'Book ID is required.' }, { status: 400 })
    }

    // Verify ownership
    const book = await prisma.book.findFirst({
      where: { id, usuario: user.usuario },
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        status: true,
        rating: true,
        pages: true,
        dateStarted: true,
        dateFinished: true,
      },
    })

    // Idempotency: if book doesn't exist, it was already completed/deleted
    if (!book) {
      return NextResponse.json({
        success: true,
        message: 'Book already completed or not found.',
        alreadyCompleted: true,
      })
    }

    const now = new Date().toISOString().slice(0, 10)
    const body = await req.json().catch(() => ({}))
    const rating = body.rating !== undefined ? Number(body.rating) : book.rating

    // Atomic transaction: mark as finished, then delete the reading record
    const completedSnapshot = await prisma.$transaction(async (tx) => {
      // 1. Update the book to finished state (captures the final rating/date)
      const updated = await tx.book.update({
        where: { id },
        data: {
          status: 'finished',
          dateFinished: book.dateFinished || now,
          rating: rating ?? null,
          progress: 100,
        },
        select: {
          id: true,
          title: true,
          author: true,
          coverImage: true,
          dateStarted: true,
          dateFinished: true,
          rating: true,
          pages: true,
        },
      })

      // 2. Delete the book record (removes it from the user's active library)
      // This does NOT delete a shared catalog — in this per-user model each user
      // owns their own row. Quotes and Notes cascade from Book.
      await tx.book.delete({ where: { id } })

      return updated
    })

    return NextResponse.json({
      success: true,
      message: `"${completedSnapshot.title}" marked as completed and removed from your library.`,
      completedBook: completedSnapshot,
    })
  } catch (error) {
    console.error('Error completing book:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while completing the book.' },
      { status: 500 }
    )
  }
}
