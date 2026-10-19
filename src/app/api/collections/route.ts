import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, collections: [] }, { status: 401 })
    }

    const collections = await prisma.collection.findMany({
      where: { usuario: user.usuario },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, collections })
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json({ success: false, collections: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required.' }, { status: 400 })
    }

    const newCol = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description || '',
        usuario: user.usuario,
      },
    })

    return NextResponse.json({ success: true, collection: newCol })
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
