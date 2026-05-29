import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '@/screens/FeedScreen';
import { SetupDetailScreen } from '@/screens/SetupDetailScreen';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { Setup } from '@/types/setup';
import { useAuth } from '@/auth/useAuth';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainStackParamList = {
  Feed: undefined;
  SetupDetail: { setup: Setup };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

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
      <MainStack.Screen name="Feed" component={FeedScreen} />
      <MainStack.Screen name="SetupDetail" component={SetupDetailScreenWrapper} />
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
