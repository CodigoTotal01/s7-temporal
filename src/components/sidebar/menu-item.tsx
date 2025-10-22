import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'

type Props = {
    size: 'max' | 'min'
    label: string
    icon: JSX.Element
    path?: string
    current?: string
    onSignOut?(): void
}

const MenuItem = ({ icon, label, size, current, onSignOut, path }: Props) => {
    const pathname = usePathname()
    
    // Extraer domainId de la URL actual (ej: /settings/abc-123 -> abc-123)
    const getDomainFromPath = () => {
        const segments = pathname.split('/')
        if (segments.length >= 3 && (segments[1] === 'settings' || segments[1] === 'catalogs')) {
            return segments[2]
        }
        return null
    }
    
    // Construir ruta dinámica si es necesario (para catalogs)
    const getHref = () => {
        if (!path) return '#'
        
        if (path === 'catalogs') {
            const domainId = getDomainFromPath()
            return domainId ? `/catalogs/${domainId}` : '/catalogs'
        }
        
        return `/${path}`
    }
    
    switch (size) {
        case 'max':
            return (
                <Link
                    onClick={onSignOut}
                    className={cn(
                        'flex items-center gap-2 py-2 rounded-lg my-1',
                        !current
                            ? 'text-gray-500'
                            : current == path
                                ? 'bg-white font-bold text-black'
                                : 'text-gray-500'
                    )}
                    href={getHref()}>
                    {icon} {label}
                </Link>
            )
        case 'min':
            return (
                <Link
                    onClick={onSignOut}
                    className={cn(
                        'flex items-center gap-2 py-2 rounded-lg my-1',
                        !current
                            ? 'text-gray-500'
                            : current == path
                                ? 'bg-white font-bold text-black'
                                : 'text-gray-500',
                        'rounded-lg p-2 my-1'
                    )}
                    href={getHref()}>
                    {icon}
                </Link>
            )

        default:
            return null
    }

}

export default MenuItem