import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getSessionUser } from '@/lib/auth-jwt'

function cleanStr(s: unknown): string {
  if (typeof s !== 'string') return ''
  return s.replace(/\0/g, '').trim()
}

async function extractEpubMeta(buffer: Buffer, filePath: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const EPub = require('epub2').EPub
    const epub = new EPub(filePath)
    await new Promise<void>((resolve, reject) => {
      epub.on('end', resolve)
      epub.on('error', reject)
      epub.parse()
    })
    const meta = epub.metadata || {}

    let coverUrl: string | null = null
    try {
      // Find cover ID: check metadata.cover, epub.cover, or manifest items
      let coverId: string | null = meta.cover || (epub as unknown as { cover?: string }).cover || null
      if (!coverId && epub.manifest) {
        const manifestItems = Object.values(epub.manifest) as Array<{
          id?: string
          href?: string
          'media-type'?: string
          properties?: string
        }>
        const coverItem = manifestItems.find((item) => {
          const isImg = item['media-type']?.startsWith('image/')
          const hasCoverInId = item.id?.toLowerCase().includes('cover')
          const hasCoverInHref = item.href?.toLowerCase().includes('cover')
          const isCoverProp = item.properties === 'cover-image'
          return isImg && (hasCoverInId || hasCoverInHref || isCoverProp)
        })
        if (coverItem && coverItem.id) {
          coverId = coverItem.id
        }
      }

      if (coverId) {
        const coverData = await new Promise<{ data: Buffer; mimeType: string }>((resolve, reject) => {
          epub.getImage(coverId as string, (err: Error, data: Buffer, mimeType: string) => {
            if (err || !data) reject(err)
            else resolve({ data, mimeType })
          })
        })

        if (coverData && coverData.data) {
          try {
            const coversDir = path.join(process.cwd(), 'public', 'uploads', 'covers')
            await mkdir(coversDir, { recursive: true })
            const ext = coverData.mimeType.split('/')[1] || 'jpg'
            const coverFileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`
            const coverFilePath = path.join(coversDir, coverFileName)
            await writeFile(coverFilePath, coverData.data)
            coverUrl = `/uploads/covers/${coverFileName}`
          } catch {
            // Fallback to base64 if disk write fails
            coverUrl = `data:${coverData.mimeType};base64,${coverData.data.toString('base64')}`
          }
        }
      }
    } catch {
      /* No cover found or failed to load */
    }

    // Estimate pages if not provided (EPUB spine elements often represent chapters/sections)
    let estimatedPages: number | null = meta.pages ? parseInt(meta.pages) : null
    if (!estimatedPages && epub.flow && Array.isArray(epub.flow) && epub.flow.length > 0) {
      estimatedPages = Math.max(1, epub.flow.length * 12)
    }

    return {
      title: cleanStr(meta.title),
      author: cleanStr(meta.creator || meta.author),
      description: cleanStr(meta.description),
      isbn: cleanStr(meta.ISBN || meta.isbn || meta.identifier),
      language: cleanStr(meta.language),
      publisher: cleanStr(meta.publisher),
      pages: estimatedPages,
      coverImage: coverUrl,
    }
  } catch (err) {
    console.warn('epub2 extraction failed:', err)
    return null
  }
}

async function extractPdfMeta(buffer: Buffer) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    const info = data.info || {}
    return {
      title: cleanStr(info.Title),
      author: cleanStr(info.Author),
      description: cleanStr(info.Subject),
      isbn: '',
      language: '',
      publisher: cleanStr(info.Creator || info.Producer),
      pages: data.numpages || null,
      coverImage: null as string | null,
    }
  } catch (err) {
    console.warn('pdf-parse extraction failed:', err)
    return null
  }
}

function fallbackFromFilename(filename: string) {
  let clean = filename.replace(/\.(pdf|epub)$/i, '')
  clean = clean.replace(/^\d+[-_]/, '')
  clean = clean.replace(/(_z_library|_1lib|_z_lib|zlibrary).*$/i, '')
  clean = clean.replace(/_/g, ' ').trim()

  let title = clean
  let author = ''
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ')
    author = parts[0].trim()
    title = parts.slice(1).join(' - ').trim()
  } else if (/ by /i.test(clean)) {
    const parts = clean.split(/ by /i)
    title = parts[0].trim()
    author = parts[1].trim()
  }
  return { title, author }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'epub' && ext !== 'pdf') {
      return NextResponse.json({ success: false, message: 'Only PDF and EPUB files are supported' }, { status: 400 })
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

    let meta = ext === 'epub'
      ? await extractEpubMeta(buffer, filePath)
      : await extractPdfMeta(buffer)

    const fallback = fallbackFromFilename(file.name)
    if (!meta) {
      meta = { title: fallback.title, author: fallback.author, description: '', isbn: '', language: '', publisher: '', pages: null, coverImage: null }
    } else {
      if (!meta.title) meta.title = fallback.title
      if (!meta.author) meta.author = fallback.author
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      format: ext,
      meta: {
        title: meta.title,
        author: meta.author,
        description: meta.description || '',
        isbn: meta.isbn || '',
        language: meta.language || '',
        publisher: meta.publisher || '',
        pages: meta.pages,
        coverImage: meta.coverImage || null,
      },
    })
  } catch (error) {
    console.error('Error in extract route:', error)
    return NextResponse.json({ success: false, message: 'Error processing file' }, { status: 500 })
  }
}
