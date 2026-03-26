import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { COACH_PERSONA, getCoachReply, QUICK_ACTIONS } from '../agent/persona';
import { SEASON } from '../theme/season';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'agent',
      text: `안녕하세요! ${COACH_PERSONA.emoji} 저는 ${COACH_PERSONA.name}예요.\n${COACH_PERSONA.tagline}\n아래를 누르거나 메시지를 보내 보세요.`,
    },
  ]);

  const openAgent = useCallback(() => setOpen(true), []);
  const closeAgent = useCallback(() => setOpen(false), []);

  const send = useCallback((text, intent = 'free') => {
    const trimmed = (text || '').trim();
    const fromQuick = QUICK_ACTIONS.find((q) => q.id === intent);
    const display = trimmed || fromQuick?.label || '…';

    const uid = `u-${Date.now()}`;
    setMessages((m) => [...m, { id: uid, role: 'user', text: display }]);

    const reply = getCoachReply({
      intent: fromQuick ? intent : 'free',
      userText: trimmed,
      season: SEASON,
    });

    setTimeout(() => {
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'agent', text: reply }]);
    }, 420);
  }, []);

  const value = useMemo(
    () => ({
      open,
      openAgent,
      closeAgent,
      messages,
      send,
      QUICK_ACTIONS,
      persona: COACH_PERSONA,
    }),
    [open, openAgent, closeAgent, messages, send]
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent는 AgentProvider 안에서만 사용하세요.');
  return ctx;
}
