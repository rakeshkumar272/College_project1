import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "./lib/db"
import bcrypt from "bcryptjs"
import Google from "next-auth/providers/google"


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {

        const email = credentials.email as string
        const password = credentials.password as string
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          throw new Error("user does not exist")
        }
        if (!user.password) {
          throw new Error("incorrect password") // Handled if user logged in via Google previously
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          throw new Error("incorrect password")
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }

      }

    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  callbacks: {
    // token ke ander user ka data dalta hai
    async signIn({ user, account }) {
      console.log(user)
      if (account?.provider == "google" && user.email) {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              name: user.name || "Default Name",
              email: user.email,
              image: user.image
            }
          })
        }

        user.id = dbUser.id
        user.role = dbUser.role
      }
      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id,
          token.name = user.name,
          token.email = user.email,
          token.role = user.role
      }
      if (trigger == "update") {
        token.role = session.role
      }


      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string,
          session.user.name = token.name as string,
          session.user.email = token.email as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 10 * 24 * 60 * 60 * 1000
  },
  secret: process.env.AUTH_SECRET
})


// connect db
//email check
//password match
