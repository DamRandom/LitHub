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

    const existing = await prisma.collection.findFirst({
      where: { id, usuario: user.usuario },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Collection not found.' }, { status: 404 })
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : existing.name,
        description: body.description !== undefined ? body.description : existing.description,
      },
    })

    return NextResponse.json({ success: true, collection: updated })
  } catch (error) {
    console.error('Error updating collection:', error)
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
    const existing = await prisma.collection.findFirst({
      where: { id, usuario: user.usuario },
    })

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Collection not found.' }, { status: 404 })
    }

    await prisma.collection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Collection deleted successfully.' })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
