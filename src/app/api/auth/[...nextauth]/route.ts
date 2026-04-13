import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { generateDeviceSecret } from "@/lib/auth-utils";
import { cookies } from "next/headers";

// ⭐ EXPORT THIS
export const authOptions:NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const client = await clientPromise;

                const user = await client
                    .db("WebCrawlerPortal")
                    .collection("users")
                    .findOne({ email: credentials.email });

                if (!user) {
                    console.log("❌ User not found in DB");
                    return null;
                }

                // console.log("Input Password:", credentials.password);
                // console.log("DB Hashed Password:", user.password);

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    console.log("❌ Password Mismatch");
                    return null;
                }

                console.log("Password Matched");

                let currentSecret = user.login_secret || "";

                // First login device lock
                if (user.role === "user" && (!currentSecret || currentSecret === "")) {

                    currentSecret = generateDeviceSecret();

                    await client
                        .db("WebCrawlerPortal")
                        .collection("users")
                        .updateOne(
                            { _id: user._id },
                            { $set: { login_secret: currentSecret } }
                        );

                    const cookieStore = await cookies();

                    cookieStore.set("device_login_secret", currentSecret, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        maxAge: 60 * 60 * 24 * 365,
                        path: "/"
                    });

                    console.log("Created a new cookie secret.");
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions,
                    dbSecret: currentSecret,
                    workFromHome: user.work_from_home
                };
            }
        })
    ],

    callbacks: {

        async jwt({ token, user }) {

            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.permissions = user.permissions;
                token.dbSecret = user.dbSecret;
                token.workFromHome = user.workFromHome;
            }

            return token;
        },

        async session({ session, token }) {

            if (session.user) {
                session.user.role = token.role as string;
                session.user.permissions = token.permissions as string[];
                session.user.dbSecret = token.dbSecret as string;
                session.user.workFromHome = token.workFromHome as boolean;
            }

            return session;
        }

    },

    pages: {
        signIn: "/login"
    },

    session: {
        strategy: "jwt",
        maxAge: 60 * 5, // 5 minutes for testing
        updateAge: 0
    },

    jwt: {
        maxAge: 60 * 5
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
