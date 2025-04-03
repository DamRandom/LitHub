import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/users";
import { comparePasswords, generateToken } from "@/utils/auth";


export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const isValid = await comparePasswords(password, user.password);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = generateToken({ id: user.id, email: user.email });

  const response = NextResponse.json({ success: true });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });

  return response;
}
