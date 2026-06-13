import { useCallback, useEffect, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useShellChromeStore } from '@/src/store/shell-chrome-store';

const compactOffsetY = 24;
const expandedOffsetY = 6;

export function useBottomTabScrollChrome() {
  const setBottomTabCompact = useShellChromeStore((state) => state.setBottomTabCompact);
  const isCompactRef = useRef(false);

  useEffect(() => () => setBottomTabCompact(false), [setBottomTabCompact]);

  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const nextIsCompact = isCompactRef.current ? offsetY > expandedOffsetY : offsetY > compactOffsetY;

      if (nextIsCompact === isCompactRef.current) {
        return;
      }

      isCompactRef.current = nextIsCompact;
      setBottomTabCompact(nextIsCompact);
    },
    [setBottomTabCompact],
  );
}
