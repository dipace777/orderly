import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";
import { OrderStatusEnum } from "@/lib/schema";

export const orderRouter = router({
  // Get all orders
  getAll: publicProcedure
    .input(
      z
        .object({
          sessionId: z.number().optional(),
          status: OrderStatusEnum.optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where: any = {};

      if (input?.sessionId) {
        where.sessionId = input.sessionId;
      }

      if (input?.status) {
        where.status = input.status;
      }

      return await prisma.order.findMany({
        where,
        include: {
          session: {
            include: {
              table: true,
            },
          },
          orderItems: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Get order by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await prisma.order.findUnique({
        where: { id: input.id },
        include: {
          session: {
            include: {
              table: true,
            },
          },
          orderItems: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }),

  // Create order
  create: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        items: z.array(
          z.object({
            itemId: z.number(),
            quantity: z.number().positive(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.order.create({
        data: {
          sessionId: input.sessionId,
          orderItems: {
            create: input.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          session: {
            include: {
              table: true,
            },
          },
          orderItems: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }),

  // Update order status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: OrderStatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.order.update({
        where: { id: input.id },
        data: {
          status: input.status,
        },
        include: {
          session: {
            include: {
              table: true,
            },
          },
          orderItems: {
            include: {
              item: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    }),

  // Delete order
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.order.delete({
        where: { id: input.id },
      });
    }),
});
