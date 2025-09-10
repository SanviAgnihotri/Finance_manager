import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

import { db } from "@/db/drizzle";
import { getDodo } from "@/lib/dodo";
import { subscriptions } from "@/db/schema";

const getUserIdFromMetadata = (metadata: unknown): string | undefined => {
  if (metadata && typeof metadata === "object") {
    const m = metadata as Record<string, unknown>;
    if (typeof m.userId === "string") return m.userId;
    if (typeof m.user_id === "string") return m.user_id;
  }
  return undefined;
};

const app = new Hono()
  .get(
    "/current",
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, auth.userId));

      return c.json({ data: subscription || null });
    },
  )
  .post(
    "/checkout",
    clerkMiddleware(),
    async (c) => {
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [existing] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, auth.userId));

      if (existing?.subscriptionId) {
        if (!existing.dodoCustomerId) {
          return c.json({ error: "No billing customer found for this subscription. Please contact support." }, 502);
        }

        let portalUrl: string | undefined;

        try {
          const session = await getDodo().customers.customerPortal.create(
            existing.dodoCustomerId,
            {
              return_url: `${process.env.NEXT_PUBLIC_APP_URL!}/settings`,
            },
          );
          portalUrl = session.link;
        } catch (error) {
          console.error("Dodo customer portal failed:", error);
        }

        if (!portalUrl) {
          return c.json({ error: "Could not load the billing portal. Please try again later." }, 502);
        }

        return c.json({ data: portalUrl });
      }

      let checkoutUrl: string | undefined | null;

      try {
        const session = await getDodo().checkoutSessions.create({
          product_cart: [
            { product_id: process.env.DODO_PRODUCT_ID!, quantity: 1 },
          ],
          metadata: { userId: auth.userId },
          return_url: `${process.env.NEXT_PUBLIC_APP_URL!}/settings`,
        });

        checkoutUrl = session.checkout_url;
      } catch (error) {
        console.error("Dodo createCheckout failed:", error);
      }

      if (!checkoutUrl) {
        return c.json({ error: "Could not create a checkout. Please try again later." }, 502);
      }

      return c.json({ data: checkoutUrl });
    },
  )
  .post(
    "/webhook",
    async (c) => {
      const rawBody = await c.req.text();

      let event;
      try {
        event = getDodo().webhooks.unwrap(rawBody, {
          headers: {
            "webhook-id": c.req.header("webhook-id") ?? "",
            "webhook-signature": c.req.header("webhook-signature") ?? "",
            "webhook-timestamp": c.req.header("webhook-timestamp") ?? "",
          },
        });
      } catch {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!event || typeof event.type !== "string") {
        return c.json({ error: "Invalid webhook payload" }, 400);
      }

      switch (event.type) {
        case "subscription.active":
        case "subscription.renewed":
        case "subscription.updated":
        case "subscription.cancelled":
        case "subscription.expired": {
          const subscriptionId = event.data.subscription_id;
          const status = event.data.status;
          const customerId = event.data.customer?.customer_id;
          const userId = getUserIdFromMetadata(event.data.metadata);

          const [existingRow] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.subscriptionId, subscriptionId));

          if (existingRow) {
            await db
              .update(subscriptions)
              .set({
                status,
                ...(customerId ? { dodoCustomerId: customerId } : {}),
              })
              .where(eq(subscriptions.subscriptionId, subscriptionId));
          } else if (userId) {
            await db
              .insert(subscriptions)
              .values({
                id: createId(),
                subscriptionId,
                userId,
                dodoCustomerId: customerId ?? null,
                status,
              });
          }
          break;
        }
        case "payment.succeeded": {
          const customerId = event.data.customer?.customer_id;
          const userId = getUserIdFromMetadata(event.data.metadata);

          for (const subscriptionId of event.data.subscription_ids ?? []) {
            const [existingRow] = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.subscriptionId, subscriptionId));

            if (existingRow) {
              await db
                .update(subscriptions)
                .set({
                  status: "active",
                  ...(customerId ? { dodoCustomerId: customerId } : {}),
                })
                .where(eq(subscriptions.subscriptionId, subscriptionId));
            } else if (userId) {
              await db
                .insert(subscriptions)
                .values({
                  id: createId(),
                  subscriptionId,
                  userId,
                  dodoCustomerId: customerId ?? null,
                  status: "active",
                });
            }
          }
          break;
        }
        default:
          break;
      }

      return c.json({}, 200);
    },
  );

export default app;
