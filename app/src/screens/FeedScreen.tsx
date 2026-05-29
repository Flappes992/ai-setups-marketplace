import { View, FlatList, Dimensions, StatusBar } from 'react-native';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';
import { Setup } from '@/types/setup';

const { height } = Dimensions.get('window');

export function FeedScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" />
      <FlatList<Setup>
        data={mockSetups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SetupCard setup={item} />}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
