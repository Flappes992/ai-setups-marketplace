import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Variant = 'info' | 'success' | 'error';

interface ToastMessage {
  id: number;
  text: string;
  variant: Variant;
}

interface ToastContextValue {
  show: (text: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  function show(text: string, variant: Variant = 'info') {
    setToast({ id: Date.now(), text, variant });
  }

  useEffect(() => {
    if (!toast) return;
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [toast, opacity]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.container,
            { top: insets.top + 12, opacity },
            toast.variant === 'success' && styles.success,
            toast.variant === 'error' && styles.error,
          ]}
        >
          <Text style={styles.text}>{toast.text}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(17,17,17,0.93)',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  success: { backgroundColor: 'rgba(22,163,74,0.95)' },
  error: { backgroundColor: 'rgba(204,0,0,0.95)' },
  text: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
