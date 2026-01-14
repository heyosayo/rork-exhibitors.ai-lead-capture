import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const users: Map<string, { id: string; email: string; firstName: string; lastName: string; password: string; createdAt: Date }> = new Map();

const generateToken = (userId: string): string => {
  return `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

const sessions: Map<string, string> = new Map();

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
      
      const existingUser = Array.from(users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        throw new Error("An account with this email already exists");
      }
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const user = {
        id: userId,
        email: email.toLowerCase(),
        firstName,
        lastName,
        password,
        createdAt: new Date(),
      };
      
      users.set(userId, user);
      
      const token = generateToken(userId);
      sessions.set(token, userId);
      
      console.log("User registered:", { id: userId, email, firstName, lastName });
      
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
      
      const user = Array.from(users.values()).find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!user) {
        throw new Error("Invalid email or password");
      }
      
      if (user.password !== password) {
        throw new Error("Invalid email or password");
      }
      
      const token = generateToken(user.id);
      sessions.set(token, user.id);
      
      console.log("User logged in:", { id: user.id, email: user.email });
      
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
      
      const userId = sessions.get(ctx.token);
      if (!userId) {
        return { user: null };
      }
      
      const user = users.get(userId);
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
        sessions.delete(ctx.token);
      }
      return { success: true };
    }),
});
