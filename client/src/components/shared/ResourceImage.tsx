import { useState } from 'react'
import { Monitor, Users, Building2, Projector, Users2, Server } from 'lucide-react'

const typeIcons: Record<string, any> = {
  lab: Monitor,
  seminar: Users,
  hall: Building2,
  equipment: Projector,
  meeting: Users2,
}

interface ResourceImageProps {
  src?: string | null
  name: string
  type: string
  className?: string
  iconClassName?: string
}

export default function ResourceImage({
  src,
  name,
  type,
  className = "w-10 h-10 rounded-md object-cover border border-mid-gray/20 shrink-0",
  iconClassName = "w-5 h-5 text-dark-gray opacity-45"
}: ResourceImageProps) {
  const [error, setError] = useState(false)
  const Icon = typeIcons[type?.toLowerCase()] || Server

  if (!src || error) {
    // Strip layout class like object-cover since it is not needed for fallback container
    const bgContainerClass = className
      .replace('object-cover', '')
      .trim()

    return (
      <div className={`${bgContainerClass} bg-light-gray flex items-center justify-center`}>
        <Icon className={iconClassName} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={className}
    />
  )
}
