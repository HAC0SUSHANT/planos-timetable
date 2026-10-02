import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Goal, CreateGoalDTO, UpdateGoalDTO } from '../types';
import { GoalCard } from '../components/goals/GoalCard';
import { GoalModal } from '../components/goals/GoalModal';
import { GoalDecompositionModal } from '../components/goals/GoalDecompositionModal';
import { EmptyState } from '../components/common/EmptyState';
import { Target, Plus } from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, subjects, createGoal, updateGoal, deleteGoal, toggleMilestone } = useApp();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [decomposingGoal, setDecomposingGoal] = useState<Goal | null>(null);

  const filteredGoals = goals.filter(g => {
    if (filter === 'all') return true;
    if (filter === 'active') return g.status === 'active';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleOpenDecompose = (goal: Goal) => {
    setDecomposingGoal(goal);
  };

  const handleSubmitModal = async (dto: CreateGoalDTO | UpdateGoalDTO, goalId?: string) => {
    if (goalId) {
      await updateGoal(goalId, dto as UpdateGoalDTO);
    } else {
      await createGoal(dto as CreateGoalDTO);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header and Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>Long-Term Goals</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            High-level targets broken down into milestones, habits, and daily execution tasks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
              style={filter === 'all' ? { borderColor: 'var(--border-focus)' } : {}}
            >
              All ({goals.length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'active' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilter('active')}
              style={filter === 'active' ? { borderColor: 'var(--border-focus)' } : {}}
            >
              Active ({goals.filter(g => g.status === 'active').length})
            </button>
            <button
              className={`btn btn-sm ${filter === 'completed' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilter('completed')}
              style={filter === 'completed' ? { borderColor: 'var(--border-focus)' } : {}}
            >
              Completed ({goals.filter(g => g.status === 'completed').length})
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> New Goal
          </button>
        </div>
      </div>

      {/* Goals Grid or Empty State */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target size={28} />}
          title="No goals yet"
          description="Create your first goal to establish the top of your execution loop: Goal → Milestone → Task."
          actionText="Create your first goal"
          onAction={handleOpenCreate}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-lg)',
          }}
        >
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleOpenEdit}
              onDelete={deleteGoal}
              onToggleMilestone={toggleMilestone}
              onDecompose={handleOpenDecompose}
            />
          ))}
        </div>
      )}

      {/* Goal Creation / Edit Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        goalToEdit={editingGoal}
        subjects={subjects}
      />

      {/* Goal Decomposition Modal */}
      <GoalDecompositionModal
        isOpen={Boolean(decomposingGoal)}
        onClose={() => setDecomposingGoal(null)}
        goal={decomposingGoal}
      />
    </div>
  );
};
