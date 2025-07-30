import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";

export const tableRouter = router({
  // Get all tables
  getAll: publicProcedure.query(async () => {
    return await prisma.table.findMany({
      include: {
        sessions: {
          where: {
            endTime: null, // Only active sessions
          },
          include: {
            orders: {
              include: {
                orderItems: {
                  include: {
                    item: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        tableNumber: "asc",
      },
    });
  }),

  // Get table by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.table.findUnique({
        where: { id: input.id },
        include: {
          sessions: {
            include: {
              orders: {
                include: {
                  orderItems: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }),

  // Create table
  create: protectedProcedure
    .input(z.object({ tableNumber: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.table.create({
        data: {
          tableNumber: input.tableNumber,
        },
      });
    }),

  // Update table
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        tableNumber: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.table.update({
        where: { id: input.id },
        data: {
          tableNumber: input.tableNumber,
        },
      });
    }),

  // Delete table
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.table.delete({
        where: { id: input.id },
      });
    }),
});
