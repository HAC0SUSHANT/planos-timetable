import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTimer } from '../context/TimerContext';
import type { AIMessage, AIActionCard } from '../types';
import {
  Send,
  Mic,
  MicOff,
  ShieldAlert,
  Check,
  X,
  Play,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AIAssistantView: React.FC = () => {
  const {
    processAIQuery,
    createTask,
    rescheduleTask,
    refreshData,
    services,
  } = useApp();

  const { startTimer } = useTimer();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-intro',
      role: 'assistant',
      content:
        "Hello Sushant. I'm your PlanOS execution copilot. I can inspect your goals, evaluate current commitments, build realistic schedules, detect overloads, and break down milestones. What would you like to do?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const response = await processAIQuery(query);
      setMessages(prev => [...prev, response]);

      // If speech synthesis enabled, speak response
      if (services.voiceService.isSpeechSupported()) {
        services.voiceService.speak(response.content.replace(/[*#_]/g, ''));
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: `Error processing request: ${err.message || 'Execution error.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice Interaction
  const handleToggleVoice = () => {
    if (isListening) {
      services.voiceService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      services.voiceService.startListening(
        recognizedText => {
          setIsListening(false);
          if (recognizedText.trim()) {
            handleSendMessage(recognizedText);
          }
        },
        err => {
          console.warn('Voice error:', err);
          setIsListening(false);
        },
        () => setIsListening(false)
      );
    }
  };

  // Action Card execution
  const handleExecuteAction = async (card: AIActionCard) => {
    if (card.type === 'schedule_task') {
      if (card.payload?.taskId) {
        startTimer({
          mode: 'countdown',
          durationMinutes: card.duration || 45,
          taskId: String(card.payload.taskId),
          taskTitle: card.title,
        });
      } else {
        await createTask({
          title: card.title,
          duration: card.duration || 45,
          priority: 'high',
          startTime: card.time,
          date: card.date || new Date().toISOString().split('T')[0],
        });
      }
    }
    await refreshData();
  };

  // High-Impact Write Action Confirmation Handler
  const handleConfirmAction = async (msgId: string, confirmation: AIMessage['confirmationRequired']) => {
    if (!confirmation) return;

    if (confirmation.actionType === 'create_task') {
      await createTask(confirmation.payload as any);
    } else if (confirmation.actionType === 'reschedule_batch') {
      const { taskIds, targetDate } = confirmation.payload as { taskIds: string[]; targetDate: string };
      for (const id of taskIds) {
        await rescheduleTask(id, targetDate);
      }
    }

    await refreshData();

    // Mark as confirmed in message
    setMessages(prev =>
      prev.map(m =>
        m.id === msgId
          ? {
              ...m,
              confirmationRequired: undefined,
              content: `${m.content}\n\n✓ **Action confirmed and applied to schedule.**`,
            }
          : m
      )
    );
  };

  const handleRejectAction = (msgId: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === msgId
          ? {
              ...m,
              confirmationRequired: undefined,
              content: `${m.content}\n\n✗ **Action was cancelled by user.**`,
            }
          : m
      )
    );
  };

  const promptSuggestions = [
    'What should I do right now?',
    'I have 4 hours today. What should I study?',
    'Move my unfinished tasks to tomorrow',
    'Break down goal Learn Python',
    'Analyze my recent study performance',
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              AI Execution Copilot
            </h2>
            <Badge variant="emerald">Tool-Gated Safety Active</Badge>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Answers "What should I do now?", plans realistic workloads, and schedules tasks safely.
          </p>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowToolsDrawer(!showToolsDrawer)}
        >
          <Terminal size={14} /> Registered Tools ({services.aiAgentService.getCapabilities().length})
        </button>
      </div>

      {/* Tools Inspector Drawer */}
      {showToolsDrawer && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            fontSize: '0.8rem',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--accent-text)' }}>
            Controlled Tool Layer (Explicitly bounded application API):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px' }}>
            {services.aiAgentService.getCapabilities().map((c: { name: string }) => (
              <div key={c.name} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                • {c.name}()
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Stream Container */}
      <div
        className="card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    backgroundColor: isUser ? 'var(--accent-primary)' : 'var(--bg-input)',
                    color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                  {/* Action Cards (e.g. Suggested Study Blocks) */}
                  {msg.actionCards && msg.actionCards.length > 0 && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.actionCards.map(card => (
                        <div
                          key={card.id}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{card.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {card.duration ? `${card.duration}m` : ''} {card.subtitle ? `• ${card.subtitle}` : ''}
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                            onClick={() => handleExecuteAction(card)}
                          >
                            <Play size={11} style={{ marginRight: '3px' }} /> Schedule / Start
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* High-Impact Write Action Confirmation Card (Old -> New Diff) */}
                  {msg.confirmationRequired && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--warning)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <ShieldAlert size={16} color="var(--warning-text)" />
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--warning-text)' }}>
                          Confirmation Required ({msg.confirmationRequired.impactLevel.toUpperCase()} IMPACT)
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                        {msg.confirmationRequired.description}
                      </div>

                      {/* Diff Table */}
                      <table style={{ width: '100%', fontSize: '0.78rem', marginBottom: '10px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                            <th style={{ textAlign: 'left', padding: '3px 0' }}>Item</th>
                            <th style={{ textAlign: 'left', padding: '3px 0' }}>Current (Old)</th>
                            <th style={{ textAlign: 'left', padding: '3px 0' }}>Proposed (New)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.confirmationRequired.diff.map((d, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '4px 0', fontWeight: 600 }}>{d.label}</td>
                              <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}>{d.oldVal}</td>
                              <td style={{ padding: '4px 0', color: 'var(--success-text)', fontWeight: 600 }}>{d.newVal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConfirmAction(msg.id, msg.confirmationRequired)}
                        >
                          <Check size={13} style={{ marginRight: '3px' }} /> Confirm & Apply Changes
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleRejectAction(msg.id)}
                        >
                          <X size={13} style={{ marginRight: '3px' }} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RefreshCw size={15} className="spin" />
              <span>Analyzing schedule and executing application tools...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions Bar */}
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--bg-input)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
          }}
        >
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
              }}
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            className="form-input"
            style={{ flex: 1 }}
            placeholder={isListening ? 'Listening via microphone...' : "Ask copilot: 'What should I do now?' or 'Plan 4 hours today'..."}
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSendMessage();
            }}
          />

          {/* Voice Input Button */}
          <button
            className={`btn-icon ${isListening ? 'btn-danger' : ''}`}
            style={{
              padding: '8px',
              backgroundColor: isListening ? 'var(--danger-subtle)' : 'var(--bg-input)',
              color: isListening ? 'var(--danger-text)' : 'var(--text-secondary)',
            }}
            onClick={handleToggleVoice}
            title={isListening ? 'Stop listening' : 'Start voice input (Speech to Text)'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            className="btn btn-primary"
            onClick={() => handleSendMessage()}
            disabled={isProcessing || !inputQuery.trim()}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
