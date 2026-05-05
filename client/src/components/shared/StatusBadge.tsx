import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusType = 'confirmed' | 'pending' | 'cancelled' | 'rejected' | 'active' | 'inactive'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  confirmed: 'badge-confirmed',
  pending: 'badge-pending',
  cancelled: 'badge-cancelled',
  rejected: 'badge-rejected',
  active: 'badge-active',
  inactive: 'badge-inactive',
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium capitalize border-none py-1 px-3',
        statusStyles[status],
        className
      )}
    >
      {status}
    </Badge>
  )
}
