import { z } from "zod";
import { protectedProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";

export const orderItemRouter = router({
  // Add item to order
  add: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        itemId: z.number(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.orderItem.create({
        data: {
          orderId: input.orderId,
          itemId: input.itemId,
          quantity: input.quantity,
        },
        include: {
          order: {
            include: {
              session: {
                include: {
                  table: true,
                },
              },
            },
          },
          item: {
            include: {
              category: true,
            },
          },
        },
      });
    }),

  // Update order item quantity
  updateQuantity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        quantity: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      return await prisma.orderItem.update({
        where: { id: input.id },
        data: {
          quantity: input.quantity,
        },
        include: {
          order: true,
          item: true,
        },
      });
    }),

  // Remove item from order
  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await prisma.orderItem.delete({
        where: { id: input.id },
      });
    }),
});
