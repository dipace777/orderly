import { z } from "zod";
import { protectedProcedure, router } from "../../lib/trpc";
import { prisma } from "@/lib/prisma";

export const analyticsRouter = router({
  // Get daily summary
  dailySummary: protectedProcedure
    .input(
      z
        .object({
          date: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const date = input?.date || new Date();
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [orders, sessions, revenue] = await Promise.all([
        // Total orders
        prisma.order.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        // Active sessions
        prisma.tableSession.count({
          where: {
            startTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        // Revenue calculation
        prisma.orderItem.findMany({
          where: {
            order: {
              createdAt: {
                gte: startOfDay,
                lte: endOfDay,
              },
              status: {
                in: ["COMPLETED"],
              },
            },
          },
          include: {
            item: true,
          },
        }),
      ]);

      const totalRevenue = revenue.reduce((sum: any, orderItem: any) => {
        return sum + orderItem.item.price * orderItem.quantity;
      }, 0);

      return {
        date,
        totalOrders: orders,
        totalSessions: sessions,
        totalRevenue,
      };
    }),

  // Get popular items
  popularItems: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().default(10),
          days: z.number().default(7),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit || 10;
      const days = input?.days || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const popularItems = await prisma.orderItem.groupBy({
        by: ["itemId"],
        where: {
          order: {
            createdAt: {
              gte: startDate,
            },
          },
        },
        _sum: {
          quantity: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: limit,
      });

      // Get item details
      const itemIds = popularItems.map((item: any) => item.itemId);
      const items = await prisma.item.findMany({
        where: {
          id: {
            in: itemIds,
          },
        },
        include: {
          category: true,
        },
      });

      return popularItems.map((popularItem: any) => {
        const item = items.find((i: any) => i.id === popularItem.itemId);
        return {
          item,
          totalQuantity: popularItem._sum.quantity || 0,
          orderCount: popularItem._count.id,
        };
      });
    }),
});
