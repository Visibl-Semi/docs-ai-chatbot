import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/',
    newUser: '/',
  },
  providers: [],
  callbacks: {
    authorized({ request: { nextUrl } }) {
      return true; // Always allow access to all pages
    },
  },
} satisfies NextAuthConfig;
