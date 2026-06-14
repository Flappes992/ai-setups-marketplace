import { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { BRAND } from '@/theme/ThemeProvider';
import { useMyTier } from '@/hooks/useMyTier';
import { useToast } from '@/components/Toast';
import { useProfileBadge } from '@/hooks/useProfileBadge';

type RootNav = NativeStackNavigationProp<MainStackParamList>;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<RootNav>();
  const { tier, refresh: refreshTier } = useMyTier();
  const toast = useToast();
  const { count: profileBadge } = useProfileBadge();

  const isFeedActive = state.index === 0;
  const canPost = tier === 'creator' || tier === 'creator_plus';

  // Bei jedem Tab-Wechsel Tier neu laden — fängt out-of-band DB-Updates ab
  useEffect(() => {
    refreshTier();
  }, [state.index, refreshTier]);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
        isFeedActive ? styles.containerOnFeed : styles.containerOnProfile,
      ]}
    >
      <TabIconButton
        focused={isFeedActive}
        glyph="⌂"
        onPress={() => {
          Haptics.selectionAsync();
          navigation.navigate('FeedTab');
        }}
        onFeed={isFeedActive}
        label="home"
        title="Home"
      />

      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => {
          if (!canPost) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.show(
              tier === 'hustler'
                ? 'Du musst Creator sein um zu posten — beantrage es in Einstellungen'
                : 'Werde erst Hustler, dann Creator — Status in Einstellungen',
              'info',
            );
            rootNav.navigate('Settings');
            return;
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          rootNav.navigate('SetupUpload');
        }}
        accessibilityLabel="tab-create"
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.plusBg,
            isFeedActive ? styles.plusBgFeed : styles.plusBgProfile,
            !canPost && styles.plusBgLocked,
          ]}
        >
          <Text style={[styles.plusText, { color: isFeedActive ? '#111' : '#fff' }]}>
            {canPost ? '+' : '🔒'}
          </Text>
        </View>
        <Text style={[styles.plusLabel, { color: isFeedActive ? '#fff' : '#111' }]}>Create</Text>
      </TouchableOpacity>

      <TabIconButton
        focused={state.index === 1}
        glyph="👤"
        onPress={() => {
          Haptics.selectionAsync();
          navigation.navigate('ProfileTab');
        }}
        onFeed={isFeedActive}
        label="profile"
        title="Profile"
        badge={profileBadge}
      />
    </View>
  );
}

function TabIconButton({
  focused,
  glyph,
  onPress,
  onFeed,
  label,
  title,
  badge = 0,
}: {
  focused: boolean;
  glyph: string;
  onPress: () => void;
  onFeed: boolean;
  label: string;
  title: string;
  badge?: number;
}) {
  const inactiveColor = onFeed ? '#fff' : '#111';
  const activeColor = BRAND.teal;
  const color = focused ? activeColor : inactiveColor;
  return (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={onPress}
      accessibilityLabel={`tab-${label}`}
      activeOpacity={0.7}
    >
      <View>
        <Text style={[styles.iconText, { color, opacity: focused ? 1 : 0.65 }]}>{glyph}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.iconLabel, { color, opacity: focused ? 1 : 0.65 }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingHorizontal: 16,
    borderTopWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
  },
  containerOnFeed: {
    backgroundColor: '#181B22',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  containerOnProfile: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopColor: '#eee',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '300',
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  plusButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  plusBg: {
    width: 50,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBgFeed: {
    backgroundColor: '#fff',
  },
  plusBgProfile: {
    backgroundColor: '#111',
  },
  plusBgLocked: {
    opacity: 0.55,
  },
  plusText: {
    color: '#111',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: -2,
  },
  plusLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
});
