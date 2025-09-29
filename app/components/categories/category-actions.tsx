
'use client'

import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface CategoryActionsProps {
  categoryName: string;
}

export function CategoryActions({ categoryName }: CategoryActionsProps) {
  const handleEdit = () => {
    toast.info(`Editing category: ${categoryName}`)
    // In a real app, this would navigate to edit page
  }

  const handleDelete = () => {
    toast.error(`Deleting category: ${categoryName}`)
    // In a real app, this would show confirmation dialog
  }

  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleEdit}
      >
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-red-600 hover:text-red-700"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Delete
      </Button>
    </div>
  )
}
