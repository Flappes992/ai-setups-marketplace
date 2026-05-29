import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '@/screens/FeedScreen';
import { SetupDetailScreen } from '@/screens/SetupDetailScreen';
import { Setup } from '@/types/setup';

export type RootStackParamList = {
  Feed: undefined;
  SetupDetail: { setup: Setup };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function SetupDetailScreenWrapper({ route }: { route: { params: { setup: Setup } } }) {
  return <SetupDetailScreen setup={route.params.setup} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="SetupDetail" component={SetupDetailScreenWrapper} />
    </Stack.Navigator>
  );
}
