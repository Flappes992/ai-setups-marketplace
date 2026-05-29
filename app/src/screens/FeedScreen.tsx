import { View, FlatList, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';
import { Setup } from '@/types/setup';
import { RootStackParamList } from '@/navigation/RootNavigator';

const { height } = Dimensions.get('window');

type FeedNav = NativeStackNavigationProp<RootStackParamList, 'Feed'>;

export function FeedScreen() {
  const navigation = useNavigation<FeedNav>();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <FlatList<Setup>
        data={mockSetups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SetupDetail', { setup: item })}
            accessibilityRole="button"
            accessibilityLabel={`Setup öffnen: ${item.title}`}
          >
            <SetupCard setup={item} />
          </TouchableOpacity>
        )}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
