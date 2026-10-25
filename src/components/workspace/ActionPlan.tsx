import { useState } from 'react';
import { Circle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ActionTask, TaskStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';

interface ActionPlanProps {
  tasks: ActionTask[];
  onUpdated: () => void;
}

const statusConfig: Record<TaskStatus, { icon: typeof Circle; label: string; color: string }> = {
  Open: { icon: Circle, label: 'Open', color: 'text-slate-400' },
  'In Progress': { icon: Clock, label: 'In Progress', color: 'text-electric-400' },
  Complete: { icon: CheckCircle2, label: 'Complete', color: 'text-success-400' },
};

const priorityVariant: Record<string, string> = {
  High: 'severity-high',
  Medium: 'severity-medium',
  Low: 'severity-low',
};

const nextStatus: Record<TaskStatus, TaskStatus> = {
  Open: 'In Progress',
  'In Progress': 'Complete',
  Complete: 'Open',
};

export function ActionPlan({ tasks, onUpdated }: ActionPlanProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCycle = async (taskId: string, currentStatus: TaskStatus) => {
    setUpdatingId(taskId);
    try {
      await api.updateTaskStatus(taskId, nextStatus[currentStatus]);
      onUpdated();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Circle className="h-6 w-6 text-slate-600" />}
        title="No action items"
        message="Action items guide the investigation toward verifiable resolution steps."
      />
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    const order: Record<TaskStatus, number> = { Open: 0, 'In Progress': 1, Complete: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="space-y-2">
      {sorted.map((task) => {
        const config = statusConfig[task.status];
        const Icon = config.icon;
        const isUpdating = updatingId === task.id;
        return (
          <div
            key={task.id}
            className="rounded-lg border border-slate-700/40 bg-base-800/40 p-3.5 transition-base hover:border-slate-600/40"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleCycle(task.id, task.status)}
                disabled={isUpdating}
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-base-700/60 border border-slate-600/40 hover:border-accent-500/40 transition-base cursor-pointer disabled:opacity-50"
                title={`Click to mark as ${nextStatus[task.status]}`}
                aria-label={`Change task status from ${task.status} to ${nextStatus[task.status]}`}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-sm font-medium text-slate-200">{task.title}</h5>
                  {task.is_demo && <Badge variant="demo">Demo</Badge>}
                  {task.is_ai && <Badge variant="severity-low">AI</Badge>}
                </div>
                {task.rationale && (
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{task.rationale}</p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Badge variant={priorityVariant[task.priority] as 'severity-high' || 'default'}>
                    {task.priority} priority
                  </Badge>
                  <Badge variant="outline">{config.label}</Badge>
                </div>
                {task.verification_steps && (
                  <div className="mt-2.5 rounded-md bg-base-900/60 border border-slate-700/30 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                      Verification
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">{task.verification_steps}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
