import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useMessages, Message } from '@/hooks/useMessages';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/components/Toast';
import { BRAND } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Conversation'>;
type RouteProps = NativeStackScreenProps<MainStackParamList, 'Conversation'>['route'];

export function ConversationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { session } = useAuth();
  const myId = session?.user?.id;
  const toast = useToast();
  const params = route.params;
  const { messages, loading, send, markAllRead } = useMessages(params.conversationId);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    markAllRead();
  }, [markAllRead, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!input.trim()) return;
    setSubmitting(true);
    const result = await send(input);
    setSubmitting(false);
    if (!result.ok) {
      toast.show(result.error ?? 'Senden fehlgeschlagen', 'error');
      return;
    }
    setInput('');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreatorProfile', { creatorId: params.otherUserId })}
          style={styles.topInfo}
          accessibilityLabel="open-other-profile"
        >
          {params.otherAvatarUrl ? (
            <Image source={{ uri: params.otherAvatarUrl }} style={styles.topAvatar} />
          ) : (
            <View style={[styles.topAvatar, styles.avatarFallback]}>
              <Text style={styles.topAvatarLetter}>
                {params.otherDisplayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.topName}>{params.otherDisplayName}</Text>
            <Text style={styles.topHandle}>@{params.otherUsername}</Text>
          </View>
        </TouchableOpacity>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BRAND.teal} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => <Bubble msg={item} isMine={item.senderId === myId} />}
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={styles.emptyText}>Sag Hi.</Text>
              </View>
            )}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nachricht schreiben…"
            style={styles.input}
            selectionColor={BRAND.teal}
            maxLength={2000}
            multiline
            accessibilityLabel="message-input"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || submitting}
            style={[styles.sendBtn, (!input.trim() || submitting) && styles.sendBtnDisabled]}
            accessibilityLabel="send-message"
          >
            {submitting ? (
              <ActivityIndicator color="#0b3b35" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{msg.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 4,
  },
  backIcon: { fontSize: 30, color: '#111', width: 30, lineHeight: 32 },
  topInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  topAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#eee' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  topAvatarLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },
  topName: { fontSize: 14, fontWeight: '800', color: '#111' },
  topHandle: { fontSize: 11, color: '#888' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyText: { color: '#888', fontSize: 14 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: { backgroundColor: BRAND.teal, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: '#111', lineHeight: 20 },
  bubbleTextMine: { color: '#0b3b35' },
  composer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    color: '#111',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#e5e5e5' },
  sendIcon: { color: '#0b3b35', fontSize: 22, fontWeight: '900' },
});
