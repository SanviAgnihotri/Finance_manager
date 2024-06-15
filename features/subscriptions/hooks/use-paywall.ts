import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { useSubscriptionModal } from "@/features/subscriptions/hooks/use-subscription-modal";

export const usePaywall = () => {
  const subscriptionModal =  useSubscriptionModal();
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
  } = useGetSubscription();

  // Dev-only escape hatch for running without an activated Lemon Squeezy
  // store (LS returns 403 "store has not been activated" until payouts are
  // approved). Never enable in production.
  // Set NEXT_PUBLIC_BYPASS_PAYWALL=true in .env.local to use it.
  if (process.env.NEXT_PUBLIC_BYPASS_PAYWALL === "true") {
    return {
      isLoading: false,
      shouldBlock: false,
      triggerPaywall: () => {},
    };
  }

  const shouldBlock = !subscription || subscription.status === "expired";

  return {
    isLoading: isLoadingSubscription,
    shouldBlock,
    triggerPaywall: () => {
      subscriptionModal.onOpen();
    },
  };
};
