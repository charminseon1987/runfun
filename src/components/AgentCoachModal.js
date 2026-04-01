import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAgent } from '../context/AgentContext';
import { C, ax } from '../theme/season';

// 에이전트 이름 → 이모지 매핑
const AGENT_EMOJI = {
  루카: '🏃',
  마르코: '🗓️',
  글로리아: '🌍',
  테라: '🗺️',
  비비: '📸',
  소셜: '👥',
  스탬피: '🎖️',
  기어로: '👟',
  헬리아: '🩺',
  트래비: '✈️',
};

function TypingDots() {
  return (
    <View style={styles.typingRow}>
      <View style={[styles.dot, styles.dot1]} />
      <View style={[styles.dot, styles.dot2]} />
      <View style={[styles.dot, styles.dot3]} />
    </View>
  );
}

export default function AgentCoachModal() {
  const insets = useSafeAreaInsets();
  const { open, closeAgent, messages, loading, send, QUICK_ACTIONS, persona } = useAgent();
  const [input, setInput] = React.useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [open, messages.length]);

  const onSend = () => {
    if (!input.trim()) return;
    send(input, 'free');
    setInput('');
  };

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={closeAgent}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={closeAgent} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {persona.emoji} {persona.name}
              </Text>
              <Text style={styles.sub}>{persona.tagline}</Text>
            </View>
            <TouchableOpacity onPress={closeAgent} hitSlop={12} accessibilityLabel="닫기">
              <X size={24} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.msgList}
            contentContainerStyle={styles.msgContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.bubbleUser : styles.bubbleAgent,
                ]}
              >
                {m.typing ? (
                  <TypingDots />
                ) : (
                  <>
                    {m.role === 'agent' && m.agentName ? (
                      <Text style={styles.agentBadge}>
                        {AGENT_EMOJI[m.agentName] || '🤖'} {m.agentName}
                      </Text>
                    ) : null}
                    <Text style={m.role === 'user' ? styles.textUser : styles.textAgent}>
                      {m.text}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            {QUICK_ACTIONS.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={styles.quickChip}
                onPress={() => send('', q.id)}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.quickChipTxt}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="코치에게 질문하기…"
              placeholderTextColor={C.textSub}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={onSend}
              returnKeyType="send"
              multiline
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={onSend}
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.onAccent} />
              ) : (
                <Send size={20} color={input.trim() ? C.onAccent : C.textSub} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: ax(0.25),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { color: C.text, fontSize: 17, fontWeight: '800' },
  sub: { color: C.textSub, fontSize: 12, marginTop: 4, maxWidth: 260 },
  msgList: { maxHeight: 320, paddingHorizontal: 12 },
  msgContent: { paddingVertical: 12, gap: 10 },
  bubble: {
    maxWidth: '92%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: C.accent,
  },
  bubbleAgent: {
    alignSelf: 'flex-start',
    backgroundColor: C.surfaceL2,
    borderWidth: 1,
    borderColor: C.border,
  },
  agentBadge: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  textUser: { color: C.onAccent, fontSize: 15, lineHeight: 22 },
  textAgent: { color: C.text, fontSize: 15, lineHeight: 22 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.textSub,
  },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.3 },
  quickRow: { paddingHorizontal: 10, paddingVertical: 8, maxHeight: 48 },
  quickChip: {
    backgroundColor: C.surfaceL2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: ax(0.25),
  },
  quickChipTxt: { color: C.accent, fontSize: 12, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: C.surfaceL2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
});
