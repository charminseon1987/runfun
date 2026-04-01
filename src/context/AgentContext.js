import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { COACH_PERSONA, getCoachReply, QUICK_ACTIONS } from '../agent/persona';
import { SEASON } from '../theme/season';
import { api } from '../api/client';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'agent',
      text: `안녕하세요! ${COACH_PERSONA.emoji} 저는 ${COACH_PERSONA.name}예요.\n${COACH_PERSONA.tagline}\n아래를 누르거나 메시지를 보내 보세요.`,
    },
  ]);

  // RunScreen에서 업데이트되는 최근 위치
  const locationRef = useRef({ lat: null, lng: null });

  const openAgent = useCallback(() => setOpen(true), []);
  const closeAgent = useCallback(() => setOpen(false), []);

  const updateLocation = useCallback((lat, lng) => {
    locationRef.current = { lat, lng };
  }, []);

  const send = useCallback(async (text, intent = 'free') => {
    const trimmed = (text || '').trim();
    const fromQuick = QUICK_ACTIONS.find((q) => q.id === intent);
    const display = trimmed || fromQuick?.label || '…';

    const uid = `u-${Date.now()}`;
    setMessages((m) => [...m, { id: uid, role: 'user', text: display }]);

    const typingId = `typing-${Date.now()}`;
    setMessages((m) => [...m, { id: typingId, role: 'agent', typing: true, text: '…' }]);
    setLoading(true);

    const userMessage = trimmed || fromQuick?.label || '';

    try {
      const { lat, lng } = locationRef.current;
      const body = { message: userMessage };
      if (lat != null) body.lat = lat;
      if (lng != null) body.lng = lng;

      const result = await api.post('/agent/chat', body);
      const agentName = result.agent || '';
      const replyText = result.reply || '';
      const prefix = agentName ? `[${agentName}] ` : '';

      setMessages((m) =>
        m
          .filter((msg) => msg.id !== typingId)
          .concat({ id: `a-${Date.now()}`, role: 'agent', agentName, text: `${prefix}${replyText}` })
      );
    } catch {
      // 백엔드 오프라인 → 규칙 기반 폴백
      const fallback = getCoachReply({
        intent: fromQuick ? intent : 'free',
        userText: trimmed,
        season: SEASON,
      });
      setMessages((m) =>
        m
          .filter((msg) => msg.id !== typingId)
          .concat({ id: `a-${Date.now()}`, role: 'agent', text: fallback })
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      open,
      loading,
      openAgent,
      closeAgent,
      messages,
      send,
      QUICK_ACTIONS,
      persona: COACH_PERSONA,
      updateLocation,
    }),
    [open, loading, openAgent, closeAgent, messages, send, updateLocation]
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent는 AgentProvider 안에서만 사용하세요.');
  return ctx;
}
