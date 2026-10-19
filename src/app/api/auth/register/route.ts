import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth-jwt'
import { cookies } from 'next/headers'
import { seedUserSampleBooks } from '@/lib/sample-books'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { usuario, nombre, apellido, password, edad, sexo } = body

    const cleanUsername = (usuario || '').trim()
    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Username must be at least 3 characters.' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, message: 'Username can only contain letters, numbers, hyphens, and dots.' },
        { status: 400 }
      )
    }

    if (!nombre?.trim() || !apellido?.trim()) {
      return NextResponse.json(
        { success: false, message: 'First name and last name are required.' },
        { status: 400 }
      )
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 4 characters.' },
        { status: 400 }
      )
    }

    const edadNum = parseInt(edad, 10)
    if (isNaN(edadNum) || edadNum <= 0 || edadNum > 120) {
      return NextResponse.json(
        { success: false, message: 'Age must be a valid positive number (1-120).' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { usuario: cleanUsername },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: `The username "${cleanUsername}" already exists.` },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        usuario: cleanUsername,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        passwordHash,
        edad: edadNum,
        sexo: sexo || 'Male',
        rol: 'user',
      },
      select: {
        usuario: true,
        nombre: true,
        apellido: true,
        edad: true,
        sexo: true,
        rol: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    })

    // Seed sample books so new user starts with Blood and Moonlight books
    await seedUserSampleBooks(prisma, newUser.usuario)

    const token = signToken({
      usuario: newUser.usuario,
      nombre: newUser.nombre,
      rol: newUser.rol,
    })

    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return NextResponse.json({
      success: true,
      message: 'Account created and registered successfully.',
      user: newUser,
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while registering user.' },
      { status: 500 }
    )
  }
}
