
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, Clock, AlertCircle, Circle } from 'lucide-react'
import { formatDistanceToNow, isBefore } from 'date-fns'
import Link from 'next/link'

interface UpcomingTasksProps {
  tasks: any[]
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive'
      case 'HIGH':
        return 'default'
      case 'MEDIUM':
        return 'secondary'
      case 'LOW':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <Circle className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'REVIEW':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <CheckSquare className="h-5 w-5 mr-2" />
            UPCOMING TASKS
          </span>
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No upcoming tasks</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="mt-0.5">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      {task.project && (
                        <p className="text-xs text-gray-500">
                          {task.project.name}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className={`text-xs ${
                          isBefore(new Date(task.dueDate), new Date()) 
                            ? 'text-red-500' 
                            : 'text-gray-500'
                        }`}>
                          Due {formatDistanceToNow(new Date(task.dueDate))} 
                          {isBefore(new Date(task.dueDate), new Date()) ? ' ago' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge 
                        variant={getPriorityColor(task.priority) as any} 
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {tasks.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <Link href="/dashboard/tasks/new">
              <Button className="w-full" size="sm">
                <CheckSquare className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
