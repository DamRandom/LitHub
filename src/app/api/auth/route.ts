import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/users";
import { verifyPassword, generateToken } from "@/utils/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  // Verify the password using the new verifyPassword function
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  // Generate JWT token (expires in 1 hour)
  const token = generateToken({ id: user.id, email: user.email });

  // Response with success message
  const response = NextResponse.json({ success: true, message: "Login successful" });
  response.cookies.set("token", token, {
    httpOnly: true, // Cookie cannot be accessed via JavaScript
    secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
    maxAge: 60 * 60, // 1 hour: Token expiration time (remember to handle refresh logic)
    path: "/", // Cookie is accessible for all requests to the domain
  });

  return response;
}
