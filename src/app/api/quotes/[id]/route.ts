import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

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

    const existing = await prisma.quote.findFirst({
      where: { id, usuario: user.usuario },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Quote not found.' }, { status: 404 })
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        text: body.text !== undefined ? body.text.trim() : existing.text,
        page: body.page !== undefined ? (body.page ? Number(body.page) : null) : existing.page,
        favorite: body.favorite !== undefined ? Boolean(body.favorite) : existing.favorite,
      },
    })

    return NextResponse.json({ success: true, quote: updated })
  } catch (error) {
    console.error('Error updating quote:', error)
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
    const existing = await prisma.quote.findFirst({
      where: { id, usuario: user.usuario },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Quote not found.' }, { status: 404 })
    }

    await prisma.quote.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Quote deleted successfully.' })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
