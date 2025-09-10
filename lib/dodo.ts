import { DodoPayments } from "dodopayments";

let dodo: DodoPayments | null = null;

export const getDodo = () => {
  if (!dodo) {
    dodo = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
      environment:
        process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
          ? "live_mode"
          : "test_mode",
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
    });
  }

  return dodo;
};
