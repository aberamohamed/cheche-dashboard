import { router } from 'expo-router';
import { InteractionManager } from 'react-native';

/** Open checkout as a root stack screen (never as a modal sheet). */
export function navigateToCheckout(fromModal = false) {
  if (fromModal) {
    router.back();
    InteractionManager.runAfterInteractions(() => {
      router.navigate('/checkout');
    });
    return;
  }

  router.navigate('/checkout');
}
