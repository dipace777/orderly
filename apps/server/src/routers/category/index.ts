import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";

export const categoryRouter = router({
  // Get all categories
  getAll: publicProcedure.query(async () => {
    return await prisma.category.findMany({
      include: {
        items: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Get category by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.category.findUnique({
        where: { id: input.id },
        include: {
          items: true,
        },
      });
    }),

  // Create category
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return await prisma.category.create({
        data: {
          name: input.name,
        },
      });
    }),

  // Update category
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),

  // Delete category
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.category.delete({
        where: { id: input.id },
      });
    }),
});
