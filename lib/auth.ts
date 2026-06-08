import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "./db";
import { User, Publisher, Role } from "@/models";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await dbConnect();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        let publisherId: string | null = null;
        if (user.role === Role.PUBLISHER) {
          const pub = await Publisher.findOne({ userId: user._id }).lean();
          publisherId = pub ? String(pub._id) : null;
        }

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          publisherId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.publisherId = (user as { publisherId: string | null }).publisherId;
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.publisherId = (token.publisherId as string | null) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
