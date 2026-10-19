export type Sexo = 'Male' | 'Female' | 'Other' | 'Prefer not to say' | 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir'
export type UserRole = 'admin' | 'user' | 'usuario'

export interface User {
  usuario: string // Primary unique key
  nombre: string
  apellido: string
  password: string
  edad: number
  sexo: Sexo
  rol?: UserRole
  fechaRegistro: string
  avatar?: string
  bio?: string
}

export type CreateUserInput = Omit<User, 'fechaRegistro'>
export type UpdateUserInput = Partial<Omit<User, 'usuario' | 'fechaRegistro'>> & {
  nuevoUsuario?: string
}
