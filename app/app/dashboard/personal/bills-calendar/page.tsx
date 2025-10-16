
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { DraggableBillCalendar } from '@/components/calendar/draggable-bill-calendar'

export default async function BillsCalendarPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bills Calendar</h1>
        <p className="text-muted-foreground">Drag and drop bills to reschedule, or click on any date to add a new bill</p>
      </div>
      <DraggableBillCalendar />
    </div>
  )
}
