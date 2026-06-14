import { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export function SetupCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.thumbnail, { opacity }]} />
      <View style={styles.overlay}>
        <View style={styles.creatorRow}>
          <Animated.View style={[styles.avatar, { opacity }]} />
          <Animated.View style={[styles.creatorName, { opacity }]} />
        </View>
        <Animated.View style={[styles.title, { opacity }]} />
        <Animated.View style={[styles.description, { opacity }]} />
        <Animated.View style={[styles.descriptionShort, { opacity }]} />
        <Animated.View style={[styles.price, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width, height, backgroundColor: '#000' },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
  },
  overlay: { position: 'absolute', bottom: 100, left: 16, right: 96 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: '#333' },
  creatorName: { width: 100, height: 14, borderRadius: 4, backgroundColor: '#333' },
  title: { width: '70%', height: 22, borderRadius: 4, backgroundColor: '#333', marginBottom: 10 },
  description: {
    width: '90%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#333',
    marginBottom: 6,
  },
  descriptionShort: {
    width: '60%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#333',
    marginBottom: 14,
  },
  price: { width: 70, height: 28, borderRadius: 14, backgroundColor: '#333' },
});
