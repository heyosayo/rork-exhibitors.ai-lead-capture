import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import {
  getUserByEmail,
  getUserById,
  saveUser,
  getAllUsers,
  getSession,
  saveSession,
  deleteSession,
  StoredUser,
} from "@/backend/db";

const generateToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 40; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    }))
    .mutation(async ({ input }) => {
      const { firstName, lastName, email, password } = input;
      
      console.log("Checking for existing user with email:", email);
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new Error("An account with this email already exists");
      }
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const user: StoredUser = {
        id: userId,
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        password,
        createdAt: new Date().toISOString(),
      };
      
      console.log("Saving new user to database:", userId);
      const saved = await saveUser(user);
      if (!saved) {
        throw new Error("Failed to save user to database");
      }
      
      const token = generateToken();
      const sessionSaved = await saveSession(token, { userId, createdAt: new Date().toISOString() });
      console.log("Session saved for registration:", sessionSaved);
      
      console.log("User registered successfully:", { id: userId, email, firstName, lastName });
      
      return {
        success: true,
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input;
      
      const normalizedEmail = email.toLowerCase().trim();
      console.log("Looking up user by email:", normalizedEmail);
      const user = await getUserByEmail(normalizedEmail);
      
      if (!user) {
        console.log("User not found for email:", normalizedEmail);
        throw new Error("Invalid email or password");
      }
      
      if (user.password !== password) {
        console.log("Invalid password for user:", user.id);
        throw new Error("Invalid email or password");
      }
      
      const token = generateToken();
      const sessionSaved = await saveSession(token, { userId: user.id, createdAt: new Date().toISOString() });
      console.log("Session saved for login:", sessionSaved);
      
      console.log("User logged in successfully:", { id: user.id, email: user.email });
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      };
    }),

  getMe: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.token) {
        return { user: null };
      }
      
      const session = await getSession(ctx.token);
      if (!session) {
        return { user: null };
      }
      
      const user = await getUserById(session.userId);
      if (!user) {
        return { user: null };
      }
      
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.token) {
        await deleteSession(ctx.token);
      }
      return { success: true };
    }),

  getAllUsers: publicProcedure
    .query(async () => {
      console.log("Fetching all users from database");
      const users = await getAllUsers();
      
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: new Date(user.createdAt),
      }));
      
      console.log("Fetched users count:", sanitizedUsers.length);
      
      return {
        users: sanitizedUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        total: sanitizedUsers.length,
      };
    }),
});
