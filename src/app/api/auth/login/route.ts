import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken, AUTH_COOKIE_NAME } from '@/lib/auth-jwt'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { usuario, password } = body

    const cleanUsername = (usuario || '').trim()
    if (!cleanUsername || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { usuario: cleanUsername },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    const validPassword = await comparePassword(password, user.passwordHash)
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    const token = signToken({
      usuario: user.usuario,
      nombre: user.nombre,
      rol: user.rol,
    })

    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    const safeUser = {
      usuario: user.usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      edad: user.edad,
      sexo: user.sexo,
      rol: user.rol,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
    }

    return NextResponse.json({
      success: true,
      message: 'Sign in successful.',
      user: safeUser,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while signing in.' },
      { status: 500 }
    )
  }
}
