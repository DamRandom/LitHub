import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bookId = formData.get('bookId') as string | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'epub' && ext !== 'pdf') {
      return NextResponse.json(
        { success: false, message: 'Only PDF and EPUB files are supported' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'books')
    await mkdir(uploadsDir, { recursive: true })

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadsDir, fileName)

    await writeFile(filePath, buffer)
    const fileUrl = `/uploads/books/${fileName}`

    let updatedBook = null
    if (bookId) {
      updatedBook = await prisma.book.update({
        where: { id: bookId, usuario: user.usuario },
        data: {
          fileUrl,
          format: ext,
        },
      })
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      format: ext,
      book: updatedBook,
    })
  } catch (error) {
    console.error('Error handling file upload:', error)
    return NextResponse.json(
      { success: false, message: 'Error uploading file' },
      { status: 500 }
    )
  }
}
