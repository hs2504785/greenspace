import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession();
    return session?.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function isAdmin(user) {
  return user?.role === "admin";
}