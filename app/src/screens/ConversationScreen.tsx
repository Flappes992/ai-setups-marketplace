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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { useMessages, Message, SendAttachment } from '@/hooks/useMessages';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/components/Toast';
import { MediaPickerButton } from '@/components/MediaPicker';
import { BRAND, useTheme } from '@/theme/ThemeProvider';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Conversation'>;
type RouteProps = NativeStackScreenProps<MainStackParamList, 'Conversation'>['route'];

export function ConversationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { palette } = useTheme();
  const { session } = useAuth();
  const myId = session?.user?.id;
  const toast = useToast();
  const params = route.params;
  const { messages, loading, send, markAllRead, refresh } = useMessages(params.conversationId);
  const [input, setInput] = useState(params.initialText ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<SendAttachment | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  useEffect(() => {
    markAllRead();
  }, [markAllRead, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!input.trim() && !pendingAttachment) return;
    setSubmitting(true);
    const result = await send(input, pendingAttachment ?? undefined);
    setSubmitting(false);
    if (!result.ok) {
      toast.show(result.error ?? 'Senden fehlgeschlagen', 'error');
      return;
    }
    setInput('');
    setPendingAttachment(null);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backIcon, { color: palette.text }]}>‹</Text>
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
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.topName, { color: palette.text }]} numberOfLines={1}>{params.otherDisplayName}</Text>
            <Text style={[styles.topHandle, { color: palette.textSecondary }]} numberOfLines={1}>@{params.otherUsername}</Text>
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
            contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
            renderItem={({ item }) => <Bubble msg={item} isMine={item.senderId === myId} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={BRAND.teal}
                colors={[BRAND.teal]}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>👋</Text>
                <Text style={[styles.emptyText, { color: palette.textSecondary }]}>Sag Hi.</Text>
              </View>
            )}
          />
        )}

        {pendingAttachment && (
          <View style={[styles.pendingAttachmentBar, { backgroundColor: palette.surface }]}>
            {pendingAttachment.type !== 'file' ? (
              <Image source={{ uri: pendingAttachment.url }} style={styles.pendingThumb} />
            ) : (
              <View style={styles.pendingFileIcon}>
                <Text style={{ fontSize: 18 }}>📎</Text>
              </View>
            )}
            <Text style={[styles.pendingName, { color: palette.text }]} numberOfLines={1}>
              {pendingAttachment.name}
            </Text>
            <TouchableOpacity onPress={() => setPendingAttachment(null)}>
              <Text style={[styles.pendingClear, { color: palette.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.composer, { borderTopColor: palette.border }]}>
          <MediaPickerButton allowFiles onPicked={setPendingAttachment} size={38} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nachricht schreiben…"
            style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
            selectionColor={BRAND.teal}
            maxLength={2000}
            multiline
            accessibilityLabel="message-input"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={(!input.trim() && !pendingAttachment) || submitting}
            style={[
              styles.sendBtn,
              (!input.trim() && !pendingAttachment) || submitting ? styles.sendBtnDisabled : null,
            ]}
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
  const { palette } = useTheme();
  const hasImage = msg.attachmentUrl && (msg.attachmentType === 'image' || msg.attachmentType === 'gif');
  const hasFile = msg.attachmentUrl && msg.attachmentType === 'file';
  const showBody = msg.body && msg.body !== '📎';

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : [styles.bubbleOther, { backgroundColor: palette.surface }],
          hasImage && styles.bubbleNoBg,
        ]}
      >
        {hasImage && msg.attachmentUrl ? (
          <Image
            source={{ uri: msg.attachmentUrl }}
            style={styles.bubbleImage}
            resizeMode="cover"
          />
        ) : null}
        {hasFile && msg.attachmentUrl ? (
          <View style={styles.fileRow}>
            <Text style={{ fontSize: 22 }}>📎</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, { color: palette.text }, isMine && styles.bubbleTextMine]} numberOfLines={1}>
                {msg.attachmentName ?? 'Datei'}
              </Text>
              {msg.attachmentSizeBytes ? (
                <Text style={[styles.fileSize, { color: palette.textSecondary }]}>
                  {(msg.attachmentSizeBytes / 1024).toFixed(0)} KB
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
        {showBody ? (
          <Text style={[styles.bubbleText, { color: palette.text }, isMine && styles.bubbleTextMine, hasImage && styles.bubbleTextOverlay]}>
            {msg.body}
          </Text>
        ) : null}
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
  pendingAttachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    gap: 10,
  },
  pendingThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#ddd' },
  pendingFileIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingName: { flex: 1, fontSize: 13, color: '#333' },
  pendingClear: { fontSize: 18, color: '#888', paddingHorizontal: 6 },
  bubbleNoBg: { backgroundColor: 'transparent', padding: 0, overflow: 'hidden' },
  bubbleImage: { width: 240, height: 240, borderRadius: 14, backgroundColor: '#ddd' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 200 },
  fileName: { fontSize: 14, color: '#111', fontWeight: '600' },
  fileSize: { fontSize: 11, color: '#888' },
  bubbleTextOverlay: { marginTop: 4 },
});
