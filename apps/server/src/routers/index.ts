import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { PrismaClient } from "prisma/generated/client";

const prisma = new PrismaClient();

// Enums
const OrderStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  // Category routes
  category: router({
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
  }),

  // Item routes
  item: router({
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
  }),

  // Table routes
  table: router({
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
  }),

  // Table Session routes
  tableSession: router({
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
  }),

  // Order routes
  order: router({
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
  }),

  // Order Item routes
  orderItem: router({
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
  }),

  // Analytics/Dashboard routes
  analytics: router({
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
  }),
});

export type AppRouter = typeof appRouter;
