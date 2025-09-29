
'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface GoalsClientProps {
  children: React.ReactNode;
}

export function GoalsClient({ children }: GoalsClientProps) {
  return (
    <div>
      {children}
    </div>
  )
}

interface GoalActionButtonsProps {
  goalTitle: string;
}

export function GoalActionButtons({ goalTitle }: GoalActionButtonsProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <Button 
        variant="outline"
        onClick={() => {
          toast.info(`Editing goal: ${goalTitle}`)
          // In a real app, this would navigate to edit page
        }}
      >
        Edit Goal
      </Button>
      <div className="space-x-2">
        <Button 
          variant="outline"
          onClick={() => {
            toast.success(`Progress updated for goal: ${goalTitle}`)
            // In a real app, this would open a modal to update progress
          }}
        >
          Update Progress
        </Button>
        <Button
          onClick={() => {
            toast.info(`Viewing details for goal: ${goalTitle}`)
            // In a real app, this would navigate to goal detail page
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  )
}
