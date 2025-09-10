import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { useSubscriptionModal } from "@/features/subscriptions/hooks/use-subscription-modal";

export const usePaywall = () => {
  const subscriptionModal =  useSubscriptionModal();
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
  } = useGetSubscription();

  // Dev-only escape hatch for running without a configured Dodo Payments
  // account. Never enable in production.
  // Set NEXT_PUBLIC_BYPASS_PAYWALL=true in .env.local to use it.
  if (process.env.NEXT_PUBLIC_BYPASS_PAYWALL === "true") {
    return {
      isLoading: false,
      shouldBlock: false,
      triggerPaywall: () => {},
    };
  }

  // Dodo subscription statuses: pending | active | on_hold | paused |
  // cancelled | failed | expired | past_due. Only active (and trialing, kept
  // for forward-compat) grants access; everything else blocks.
  const shouldBlock = !subscription || !["active", "trialing"].includes(subscription.status);

  return {
    isLoading: isLoadingSubscription,
    shouldBlock,
    triggerPaywall: () => {
      subscriptionModal.onOpen();
    },
  };
};
