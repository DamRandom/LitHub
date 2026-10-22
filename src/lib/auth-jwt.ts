import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[auth] JWT_SECRET environment variable is not set. Refusing to start in production without a secure secret.')
    }
    // Development only: warn and use an insecure placeholder
    console.warn('[auth] WARNING: JWT_SECRET is not set. Using insecure dev placeholder. Set it in .env.local')
    return 'dev_insecure_placeholder_set_JWT_SECRET_in_env'
  }
  return secret
})()
export const AUTH_COOKIE_NAME = 'lithub_session_token'

export interface JWTPayload {
  usuario: string
  nombre: string
  rol: string
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(plainText, salt)
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded || !decoded.usuario) return null

  const user = await prisma.user.findUnique({
    where: { usuario: decoded.usuario },
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
      updatedAt: true,
    },
  })

  return user
}
