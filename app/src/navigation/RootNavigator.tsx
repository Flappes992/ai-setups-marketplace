import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '@/navigation/CustomTabBar';
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
import { SettingsScreen } from '@/screens/SettingsScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { TagFeedScreen } from '@/screens/TagFeedScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { TrendingScreen } from '@/screens/TrendingScreen';
import { UserListScreen } from '@/screens/UserListScreen';
import { CreatorProfileScreen } from '@/screens/CreatorProfileScreen';
import { BlockedListScreen } from '@/screens/BlockedListScreen';
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
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  SetupDetail: { setup: Setup; focusComment?: boolean };
  SetupUpload: undefined;
  MySetups: undefined;
  MyPurchases: undefined;
  Saved: undefined;
  Liked: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Search: undefined;
  TagFeed: { tag: string };
  Notifications: undefined;
  Trending: undefined;
  UserList: { userId: string; mode: 'followers' | 'following' };
  CreatorProfile: { creatorId: string };
  BlockedList: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

function SetupDetailScreenWrapper({
  route,
}: {
  route: { params: { setup: Setup; focusComment?: boolean } };
}) {
  return <SetupDetailScreen setup={route.params.setup} focusComment={route.params.focusComment} />;
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

function MainTabs() {
  return (
    <Tabs.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="FeedTab" component={FeedScreen} />
      <Tabs.Screen name="ProfileTab" component={ProfileScreen} />
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
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="Search" component={SearchScreen} />
      <MainStack.Screen name="TagFeed" component={TagFeedScreen} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="Trending" component={TrendingScreen} />
      <MainStack.Screen name="UserList" component={UserListScreen} />
      <MainStack.Screen name="CreatorProfile" component={CreatorProfileScreen} />
      <MainStack.Screen name="BlockedList" component={BlockedListScreen} />
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
