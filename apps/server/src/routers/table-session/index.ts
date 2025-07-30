import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";

export const tableSessionRouter = router({
  // Get all sessions
  getAll: publicProcedure
    .input(
      z
        .object({
          tableId: z.number().optional(),
          active: z.boolean().optional(), // Filter for active sessions
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where: any = {};

      if (input?.tableId) {
        where.tableId = input.tableId;
      }

      if (input?.active === true) {
        where.endTime = null;
      } else if (input?.active === false) {
        where.endTime = { not: null };
      }

      return await prisma.tableSession.findMany({
        where,
        include: {
          table: true,
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
        orderBy: {
          startTime: "desc",
        },
      });
    }),

  // Get session by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.tableSession.findUnique({
        where: { id: input.id },
        include: {
          table: true,
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
      });
    }),

  // Start session
  start: protectedProcedure
    .input(
      z.object({
        tableId: z.number(),
        customerName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.tableSession.create({
        data: {
          tableId: input.tableId,
          customerName: input.customerName,
        },
        include: {
          table: true,
        },
      });
    }),

  // End session
  end: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.tableSession.update({
        where: { id: input.id },
        data: {
          endTime: new Date(),
        },
        include: {
          table: true,
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
      });
    }),

  // Update session
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        customerName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.tableSession.update({
        where: { id },
        data,
        include: {
          table: true,
        },
      });
    }),
});
