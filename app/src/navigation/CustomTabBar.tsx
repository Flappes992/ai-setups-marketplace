import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type RootNav = NativeStackNavigationProp<MainStackParamList>;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<RootNav>();

  const isFeedActive = state.index === 0;

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
        onPress={() => navigation.navigate('FeedTab')}
        onFeed={isFeedActive}
        label="home"
      />

      <TouchableOpacity
        style={styles.plusButton}
        onPress={() => rootNav.navigate('SetupUpload')}
        accessibilityLabel="tab-create"
        activeOpacity={0.85}
      >
        <View style={styles.plusBg}>
          <Text style={styles.plusText}>+</Text>
        </View>
      </TouchableOpacity>

      <TabIconButton
        focused={state.index === 1}
        glyph="◌"
        onPress={() => navigation.navigate('ProfileTab')}
        onFeed={isFeedActive}
        label="profile"
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
}: {
  focused: boolean;
  glyph: string;
  onPress: () => void;
  onFeed: boolean;
  label: string;
}) {
  const color = onFeed ? '#fff' : '#111';
  return (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={onPress}
      accessibilityLabel={`tab-${label}`}
      activeOpacity={0.7}
    >
      <Text style={[styles.iconText, { color, opacity: focused ? 1 : 0.55 }]}>{glyph}</Text>
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderTopColor: 'transparent',
  },
  containerOnProfile: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopColor: '#eee',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 44,
  },
  iconText: {
    fontSize: 30,
    fontWeight: '300',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
  plusButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  plusBg: {
    width: 56,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#facc15',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  plusText: {
    color: '#111',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
    marginTop: -2,
  },
});
