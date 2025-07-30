import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { analyticsRouter } from "./analytics";
import { categoryRouter } from "./category";
import { itemRouter } from "./item";
import { orderRouter } from "./order";
import { orderItemRouter } from "./order-item";
import { tableRouter } from "./table";
import { tableSessionRouter } from "./table-session";

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

  category: categoryRouter,
  item: itemRouter,
  table: tableRouter,
  tableSession: tableSessionRouter,
  order: orderRouter,
  orderItem: orderItemRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
