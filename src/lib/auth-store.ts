import { User, CreateUserInput, UpdateUserInput } from '@/types/user'

const USERS_STORAGE_KEY = 'lithub_users'
const SESSION_STORAGE_KEY = 'lithub_current_session'

// Clean initial database with NO demo users
const DEFAULT_USERS: User[] = []

export function loadUsers(): User[] {
  if (typeof window === 'undefined') return DEFAULT_USERS
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS))
      return DEFAULT_USERS
    }
    return parsed as User[]
  } catch {
    return DEFAULT_USERS
  }
}

export function saveUsers(users: User[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function clearAllUsers(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USERS_STORAGE_KEY)
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function findUserByUsername(usuario: string): User | undefined {
  const users = loadUsers()
  const cleanUsername = usuario.trim().toLowerCase()
  return users.find((u) => u.usuario.toLowerCase() === cleanUsername)
}

export function createNewUser(input: CreateUserInput): { success: boolean; message: string; user?: User } {
  const cleanUsername = input.usuario.trim()
  if (!cleanUsername) {
    return { success: false, message: 'Username is required.' }
  }

  if (cleanUsername.length < 3) {
    return { success: false, message: 'Username must be at least 3 characters.' }
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
    return {
      success: false,
      message: 'Username can only contain letters, numbers, hyphens, and dots.',
    }
  }

  if (!input.nombre.trim() || !input.apellido.trim()) {
    return { success: false, message: 'First name and last name are required.' }
  }

  if (!input.password || input.password.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters.' }
  }

  if (input.edad <= 0 || isNaN(Number(input.edad))) {
    return { success: false, message: 'Age must be a valid positive number.' }
  }

  const users = loadUsers()
  const exists = users.some((u) => u.usuario.toLowerCase() === cleanUsername.toLowerCase())
  if (exists) {
    return {
      success: false,
      message: `The username "${cleanUsername}" already exists (duplicate primary key).`,
    }
  }

  // Assign admin role if it's the first registered user
  const isFirstUser = users.length === 0
  const finalRole = isFirstUser ? 'admin' : (input.rol || 'user')

  const newUser: User = {
    ...input,
    usuario: cleanUsername,
    nombre: input.nombre.trim(),
    apellido: input.apellido.trim(),
    edad: Number(input.edad),
    rol: finalRole,
    fechaRegistro: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)
  return { success: true, message: 'User created successfully.', user: newUser }
}

export function updateExistingUser(
  usuarioActual: string,
  updates: UpdateUserInput
): { success: boolean; message: string; user?: User } {
  const users = loadUsers()
  const index = users.findIndex((u) => u.usuario.toLowerCase() === usuarioActual.trim().toLowerCase())

  if (index === -1) {
    return { success: false, message: `User "${usuarioActual}" not found.` }
  }

  const target = users[index]

  // Modify primary key (username) if requested
  let finalUsername = target.usuario
  if (updates.nuevoUsuario && updates.nuevoUsuario.trim().toLowerCase() !== usuarioActual.trim().toLowerCase()) {
    const cleanNew = updates.nuevoUsuario.trim()
    if (cleanNew.length < 3) {
      return { success: false, message: 'New username must be at least 3 characters.' }
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanNew)) {
      return { success: false, message: 'New username can only contain letters, numbers, hyphens, and dots.' }
    }
    const alreadyTaken = users.some(
      (u, idx) => idx !== index && u.usuario.toLowerCase() === cleanNew.toLowerCase()
    )
    if (alreadyTaken) {
      return { success: false, message: `The username "${cleanNew}" is already taken.` }
    }
    finalUsername = cleanNew
  }

  if (updates.edad !== undefined && (updates.edad <= 0 || isNaN(Number(updates.edad)))) {
    return { success: false, message: 'Age must be a positive number.' }
  }

  const updatedUser: User = {
    ...target,
    usuario: finalUsername,
    nombre: updates.nombre !== undefined ? updates.nombre.trim() : target.nombre,
    apellido: updates.apellido !== undefined ? updates.apellido.trim() : target.apellido,
    password: updates.password !== undefined && updates.password.trim() ? updates.password : target.password,
    edad: updates.edad !== undefined ? Number(updates.edad) : target.edad,
    sexo: updates.sexo || target.sexo,
    rol: updates.rol || target.rol,
    bio: updates.bio !== undefined ? updates.bio : target.bio,
    avatar: updates.avatar !== undefined ? updates.avatar : target.avatar,
  }

  users[index] = updatedUser
  saveUsers(users)

  // If updated user was current session and changed username, update session
  const currentSession = getCurrentSessionUsername()
  if (currentSession && currentSession.toLowerCase() === usuarioActual.toLowerCase()) {
    setCurrentSessionUsername(finalUsername)
  }

  return { success: true, message: 'User updated successfully.', user: updatedUser }
}

export function deleteExistingUser(usuario: string): { success: boolean; message: string } {
  const users = loadUsers()
  const cleanUsername = usuario.trim().toLowerCase()
  const filtered = users.filter((u) => u.usuario.toLowerCase() !== cleanUsername)

  if (filtered.length === users.length) {
    return { success: false, message: `User "${usuario}" not found.` }
  }

  saveUsers(filtered)

  // If deleted user was current session, clear session
  const currentSession = getCurrentSessionUsername()
  if (currentSession && currentSession.toLowerCase() === cleanUsername) {
    clearCurrentSession()
  }

  return { success: true, message: `User "${usuario}" deleted successfully.` }
}

export function getCurrentSessionUsername(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_STORAGE_KEY)
}

export function setCurrentSessionUsername(usuario: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_STORAGE_KEY, usuario)
}

export function clearCurrentSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
