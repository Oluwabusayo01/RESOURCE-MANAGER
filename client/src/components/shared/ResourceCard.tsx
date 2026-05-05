import type { Resource } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import StatusBadge from './StatusBadge'
import { 
  Monitor, 
  Users, 
  Building2, 
  Projector, 
  Users2 
} from 'lucide-react'

interface ResourceCardProps {
  resource: Resource
}

const typeIcons: Record<string, any> = {
  lab: Monitor,
  seminar: Users,
  hall: Building2,
  equipment: Projector,
  meeting: Users2,
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = typeIcons[resource.type] || Monitor

  return (
    <Card className="overflow-hidden border-l-4 border-l-gold shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-light-gray rounded-lg">
            <Icon className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-accent text-lg leading-none mb-1">
              {resource.name}
            </h3>
            <p className="text-sm text-dark-gray flex items-center gap-1">
              <span className="capitalize">{resource.type}</span>
              {resource.capacity && (
                <>
                  <span className="text-mid-gray">•</span>
                  <span>{resource.capacity} seats</span>
                </>
              )}
            </p>
          </div>
        </div>
        <StatusBadge status={resource.status} />
      </CardContent>
    </Card>
  )
}
