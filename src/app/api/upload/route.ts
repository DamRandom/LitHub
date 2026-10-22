import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSessionUser } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

/**
 * ⚠️  PRODUCTION LIMITATION
 * Vercel's filesystem is read-only except for /tmp (and /tmp is ephemeral between invocations).
 * File uploads to disk DO NOT persist on Vercel.
 *
 * To support file uploads in production you need an external storage service such as:
 *   - Vercel Blob (https://vercel.com/docs/storage/vercel-blob)
 *   - Cloudinary (free tier available)
 *   - AWS S3 / Cloudflare R2
 *
 * Until then, the upload endpoint works locally but is disabled in production.
 */
export async function POST(req: Request) {
  // Block file uploads in production (Vercel read-only filesystem)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        message:
          'File upload to local disk is not supported in production. Configure an external storage provider (e.g., Vercel Blob, Cloudinary) first.',
      },
      { status: 501 }
    )
  }

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

