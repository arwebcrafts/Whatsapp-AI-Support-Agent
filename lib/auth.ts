import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        verifiedToken: { label: "Verified Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Invalid credentials")
        }

        // Check if this is an admin with a verified token (after code verification)
        if (credentials.verifiedToken) {
          const { consumeVerifiedAdminToken } = await import('./admin-verification');
          const verifiedEmail = consumeVerifiedAdminToken(credentials.verifiedToken);

          if (!verifiedEmail || verifiedEmail !== credentials.email.toLowerCase()) {
            throw new Error("Invalid or expired verification token");
          }

          // Token is valid - fetch user and allow login
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          if (!user || user.role !== 'admin') {
            throw new Error("Invalid admin account");
          }

          console.log(`✅ Admin ${user.email} logged in successfully with verified token`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // Regular login flow (requires password)
        if (!credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials")
        }

        // SECURITY FIX: Enforce email verification for regular users
        // Admin users get verification code on every login
        if (!user.emailVerified && user.role !== 'admin') {
          throw new Error("Please verify your email before logging in. Check your inbox.")
        }

        // ADMIN SECURITY: Send verification code on every admin login
        if (user.role === 'admin') {
          const {
            generateVerificationCode,
            storeAdminVerificationCode
          } = await import('./admin-verification');
          const { sendAdminVerificationCode } = await import('./email-service');

          const code = generateVerificationCode();
          storeAdminVerificationCode(user.email, code);

          // Send verification code via email
          await sendAdminVerificationCode(user.email, user.name || 'Admin', code);

          throw new Error("ADMIN_VERIFICATION_REQUIRED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.role = token.role
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || "user"
      }

      return token
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (in seconds)
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days (in seconds)
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
}
