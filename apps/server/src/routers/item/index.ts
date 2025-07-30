import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";

export const itemRouter = router({
  // Get all items
  getAll: publicProcedure
    .input(
      z
        .object({
          categoryId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await prisma.item.findMany({
        where: input?.categoryId ? { categoryId: input.categoryId } : {},
        include: {
          category: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    }),

  // Get item by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.item.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          orderItems: {
            include: {
              order: true,
            },
          },
        },
      });
    }),

  // Create item
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        categoryId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.item.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          categoryId: input.categoryId,
        },
        include: {
          category: true,
        },
      });
    }),

  // Update item
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        categoryId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.item.update({
        where: { id },
        data,
        include: {
          category: true,
        },
      });
    }),

  // Delete item
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.item.delete({
        where: { id: input.id },
      });
    }),
});
