import bcrypt from 'bcrypt';

const users = [
  {
    id: 1,
    email: "test@lithub.com",
    password: "$2b$10$GdFu47YX5TYGr4/wphdQJepKhuzaaMUwKMM7r0o10mJapDtaSWdlK"
  }
];

export async function findUserByEmail(email: string) {
  return users.find((user) => user.email === email);
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword); 
}
