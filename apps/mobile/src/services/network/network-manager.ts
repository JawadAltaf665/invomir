import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

export function configureNetworkManager(): () => void {
  let cleanup: () => void = () => undefined;

  onlineManager.setEventListener((setOnline) => {
    cleanup = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return cleanup;
  });

  return () => cleanup();
}
