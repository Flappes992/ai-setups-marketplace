import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FeedScreen } from '@/screens/FeedScreen';
import { SetupDetailScreen } from '@/screens/SetupDetailScreen';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SetupUploadScreen } from '@/screens/SetupUploadScreen';
import { MySetupsScreen } from '@/screens/MySetupsScreen';
import { MyPurchasesScreen } from '@/screens/MyPurchasesScreen';
import { SavedSetupsScreen } from '@/screens/SavedSetupsScreen';
import { LikedSetupsScreen } from '@/screens/LikedSetupsScreen';
import { Setup } from '@/types/setup';
import { useAuth } from '@/auth/useAuth';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  FeedTab: undefined;
  ProfileTab: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  SetupDetail: { setup: Setup };
  SetupUpload: undefined;
  MySetups: undefined;
  MyPurchases: undefined;
  Saved: undefined;
  Liked: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

function SetupDetailScreenWrapper({ route }: { route: { params: { setup: Setup } } }) {
  return <SetupDetailScreen setup={route.params.setup} />;
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function TabIcon({ focused, emoji }: { focused: boolean; emoji: string }) {
  return <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          height: 72,
          paddingTop: 10,
          paddingBottom: 18,
        },
      }}
    >
      <Tabs.Screen
        name="FeedTab"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="🏠" />,
          tabBarAccessibilityLabel: 'tab-feed',
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} emoji="👤" />,
          tabBarAccessibilityLabel: 'tab-profile',
        }}
      />
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
    >
      <MainStack.Screen name="Tabs" component={MainTabs} />
      <MainStack.Screen name="SetupDetail" component={SetupDetailScreenWrapper} />
      <MainStack.Screen
        name="SetupUpload"
        component={SetupUploadScreen}
        options={{ presentation: 'modal' }}
      />
      <MainStack.Screen name="MySetups" component={MySetupsScreen} />
      <MainStack.Screen name="MyPurchases" component={MyPurchasesScreen} />
      <MainStack.Screen name="Saved" component={SavedSetupsScreen} />
      <MainStack.Screen name="Liked" component={LikedSetupsScreen} />
    </MainStack.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#111" />
    </View>
  );
}

export function RootNavigator() {
  const { session, loading } = useAuth();
  if (loading) return <SplashScreen />;
  return session ? <MainNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
