'use client'

import { type ReactNode } from 'react'
import { clsx } from 'clsx'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type StepStatus = 'completed' | 'current' | 'upcoming' | 'warning'

export interface WorkflowStep {
  key: string
  label: string
  icon: ReactNode
  status: StepStatus
  count?: number
  href?: string
}

interface GlassWorkflowStepperProps {
  steps: WorkflowStep[]
  variant?: 'default' | 'compact'
  className?: string
}

const stepStatusClasses: Record<StepStatus, string> = {
  completed: 'bg-success/15 text-success border-success/30',
  current: 'bg-primary-500/15 text-primary-600 border-primary-500/40 ring-2 ring-primary-500/20 animate-pulse-soft',
  upcoming: 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600',
  warning: 'bg-warning/15 text-warning border-warning/30',
}

const connectorClasses: Record<StepStatus, string> = {
  completed: 'bg-success/40',
  current: 'bg-primary-500/30',
  upcoming: 'bg-gray-200 dark:bg-gray-600',
  warning: 'bg-warning/30',
}

const labelClasses: Record<StepStatus, string> = {
  completed: 'text-success font-medium',
  current: 'text-primary-600 dark:text-primary-400 font-semibold',
  upcoming: 'text-gray-400 dark:text-gray-500',
  warning: 'text-warning font-medium',
}

const countClasses: Record<StepStatus, string> = {
  completed: 'bg-success/20 text-success',
  current: 'bg-primary-500/20 text-primary-600',
  upcoming: 'bg-gray-100 text-gray-400 dark:bg-gray-700',
  warning: 'bg-warning/20 text-warning',
}

export function GlassWorkflowStepper({
  steps,
  variant = 'default',
  className,
}: GlassWorkflowStepperProps) {
  if (variant === 'compact') {
    return (
      <div className={clsx('flex items-center gap-1.5 overflow-x-auto', className)}>
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-1.5">
            <StepCircle step={step} compact />
            {index < steps.length - 1 && (
              <div className={clsx('w-4 h-0.5 flex-shrink-0', connectorClasses[step.status])} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={clsx('neu rounded-neu-sm p-3 sm:p-4', className)}>
      <div className="flex items-center justify-between overflow-x-auto gap-1">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
            <StepItem step={step} />
            {index < steps.length - 1 && (
              <div className={clsx(
                'h-0.5 flex-1 mx-2 sm:mx-3 min-w-[16px]',
                connectorClasses[step.status]
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepItem({ step }: { step: WorkflowStep }) {
  const content = (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div
        className={clsx(
          'w-10 h-10 sm:w-11 sm:h-11 rounded-neu-sm flex items-center justify-center border transition-all flex-shrink-0',
          stepStatusClasses[step.status],
          step.href && 'cursor-pointer hover:scale-105'
        )}
      >
        {step.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <span className="[&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
            {step.icon}
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className={clsx(
          'text-[10px] sm:text-xs whitespace-nowrap',
          labelClasses[step.status]
        )}>
          {step.label}
        </span>
        {step.count !== undefined && step.count > 0 && (
          <span className={clsx(
            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
            countClasses[step.status]
          )}>
            {step.count}
          </span>
        )}
      </div>
    </div>
  )

  if (step.href) {
    return <Link href={step.href}>{content}</Link>
  }

  return content
}

function StepCircle({ step, compact }: { step: WorkflowStep; compact?: boolean }) {
  return (
    <div
      className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0',
        stepStatusClasses[step.status]
      )}
      title={step.label}
    >
      {step.status === 'completed' ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{step.icon}</span>
      )}
    </div>
  )
}

export default GlassWorkflowStepper
