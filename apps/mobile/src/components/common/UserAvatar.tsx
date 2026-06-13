import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';
import { resolveAssetUrl } from '@/src/utils/assets';

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  cacheKey?: string | number | null;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function UserAvatar({
  firstName,
  lastName,
  imageUrl,
  cacheKey,
  size = 42,
  borderColor = theme.colors.surface,
  borderWidth = 0,
  backgroundColor = theme.colors.primary,
  style,
}: UserAvatarProps) {
  const resolvedImageUrl = resolveAssetUrl(imageUrl, cacheKey);
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(resolvedImageUrl && !hasImageError);

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedImageUrl]);

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor,
          borderColor,
          borderRadius: size / 2,
          borderWidth,
          height: size,
          width: size,
        },
        style,
      ]}
    >
      {shouldShowImage ? (
        <Image
          source={{ uri: resolvedImageUrl ?? '' }}
          style={styles.image}
          contentFit="cover"
          transition={120}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <AppText variant={size <= 34 ? 'caption' : 'label'} color={theme.colors.white} weight="800">
          {getProfileInitials(firstName, lastName)}
        </AppText>
      )}
    </View>
  );
}

function getProfileInitials(firstName?: string | null, lastName?: string | null): string {
  const initials = `${firstName?.trim().charAt(0) ?? ''}${lastName?.trim().charAt(0) ?? ''}`.trim();
  return initials.length > 0 ? initials.toUpperCase() : 'IM';
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
