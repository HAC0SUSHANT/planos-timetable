import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import type { Goal, GoalDecompositionPlan } from '../../types';
import { Sparkles, Trash2 } from 'lucide-react';

interface GoalDecompositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export const GoalDecompositionModal: React.FC<GoalDecompositionModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { generateGoalDecomposition, updateGoal, createTask } = useApp();
  const [plan, setPlan] = useState<GoalDecompositionPlan | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (goal && isOpen) {
      const generated = generateGoalDecomposition(goal.name, goal.category);
      setPlan(generated);
    }
  }, [goal, isOpen, generateGoalDecomposition]);

  if (!isOpen || !goal || !plan) return null;

  const handleApplyPlan = async () => {
    try {
      setIsApplying(true);
      const newMilestones = plan.suggestedMilestones.map((m, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        goalId: goal.id,
        title: m.title,
        description: m.description,
        completed: false,
        order: (goal.milestones?.length || 0) + idx + 1,
        totalTasks: m.suggestedTasks.length,
        completedTasks: 0,
      }));

      // Update goal with milestones
      const mergedMilestones = [...(goal.milestones || []), ...newMilestones];
      await updateGoal(goal.id, { milestones: mergedMilestones });

      // Automatically create the suggested tasks linked to milestones
      const today = new Date().toISOString().split('T')[0];
      for (let i = 0; i < newMilestones.length; i++) {
        const ms = newMilestones[i];
        const tasks = plan.suggestedMilestones[i].suggestedTasks;

        for (const t of tasks) {
          await createTask({
            title: t.title,
            duration: t.estimatedMinutes,
            priority: t.priority,
            goalId: goal.id,
            milestoneId: ms.id,
            subjectId: goal.subjectId,
            category: goal.category,
            date: today,
          });
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to apply decomposition:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveMilestone = (idx: number) => {
    setPlan({
      ...plan,
      suggestedMilestones: plan.suggestedMilestones.filter((_, i) => i !== idx),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`AI Goal Decomposition: ${goal.name}`}
      maxWidth="680px"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={isApplying}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApplyPlan} disabled={isApplying}>
            {isApplying ? 'Applying Plan...' : 'Apply Milestones & Tasks to Goal'}
          </button>
        </>
      }
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-md)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Sparkles size={16} color="var(--accent-text)" />
          <span>
            The system structured your objective into {plan.suggestedMilestones.length} sequential milestones and achievable execution tasks. You can edit, remove, or confirm below.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {plan.suggestedMilestones.map((m, mIdx) => (
            <div
              key={mIdx}
              className="card"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                padding: 'var(--space-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {m.description}
                  </p>
                </div>

                <button
                  className="btn-icon"
                  onClick={() => handleRemoveMilestone(mIdx)}
                  style={{ color: 'var(--danger-text)' }}
                  title="Remove this milestone"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Tasks under this milestone */}
              <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Execution Tasks ({m.suggestedTasks.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {m.suggestedTasks.map((t, tIdx) => (
                    <div
                      key={tIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--accent-text)' }}>•</span>
                        <span>{t.title}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.estimatedMinutes}m • {t.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
