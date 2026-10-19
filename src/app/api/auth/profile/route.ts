import { NextResponse } from 'next/server'
import { getSessionUser, hashPassword } from '@/lib/auth-jwt'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 })
    }

    const body = await req.json()
    const { nombre, apellido, edad, sexo, bio, password } = body

    const dataToUpdate: Record<string, unknown> = {}

    if (nombre?.trim()) dataToUpdate.nombre = nombre.trim()
    if (apellido?.trim()) dataToUpdate.apellido = apellido.trim()
    if (edad) {
      const edadNum = parseInt(edad, 10)
      if (!isNaN(edadNum) && edadNum > 0) dataToUpdate.edad = edadNum
    }
    if (sexo) dataToUpdate.sexo = sexo
    if (bio !== undefined) dataToUpdate.bio = bio
    if (password && password.length >= 4) {
      dataToUpdate.passwordHash = await hashPassword(password)
    }

    const updated = await prisma.user.update({
      where: { usuario: user.usuario },
      data: dataToUpdate,
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

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, message: 'Error updating profile.' },
      { status: 500 }
    )
  }
}
