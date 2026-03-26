import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { useAgent } from '../context/AgentContext';
import { C, ax } from '../theme/season';

export default function AgentFab() {
  const insets = useSafeAreaInsets();
  const { openAgent, persona } = useAgent();

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: 72 + insets.bottom }]}
      onPress={openAgent}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${persona.name} 열기`}
    >
      <View style={styles.inner}>
        <MessageCircle size={26} color={C.onAccent} strokeWidth={2} />
        <Text style={styles.label}>{persona.shortName}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: ax(0.35),
    backgroundColor: C.accent,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  label: {
    color: C.onAccent,
    fontSize: 14,
    fontWeight: '800',
  },
});
