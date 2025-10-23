import { cn } from '@/lib/utils'
import Link from 'next/link'
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'

type Props = {
    size: 'max' | 'min'
    label: string
    icon: JSX.Element
    path?: string
    current?: string
    onSignOut?(): void
    isSubmenu?: boolean
    parentPath?: string
    children?: React.ReactNode
    hasCompany?: boolean
}

const MenuItem = ({ icon, label, size, current, onSignOut, path, isSubmenu, parentPath, children, hasCompany }: Props) => {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(true) // Por defecto expandido para Inventario

    // Extraer domainId de la URL actual (ej: /settings/abc-123 -> abc-123)
    const getDomainFromPath = () => {
        if (!pathname) return null
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

    // Lógica de visibilidad para configuración e inventario
    const shouldShow = () => {
        if (path === 'settings' || parentPath === 'settings') {
            return hasCompany // Solo mostrar si HAY empresa creada
        }
        if (path === 'inventory' || parentPath === 'inventory') {
            return hasCompany // Solo mostrar si HAY empresa creada
        }
        return true
    }

    if (!shouldShow()) return null

    switch (size) {
        case 'max':
            if (isSubmenu) {
                return (
                    <div className="my-1">
                        <div
                            className={cn(
                                'flex items-center gap-2 py-2 rounded-lg cursor-pointer',
                                'text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors'
                            )}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {icon} {label}
                        </div>
                        {isExpanded && children && (
                            <div className="ml-6 mt-1 space-y-1">
                                {children}
                            </div>
                        )}
                    </div>
                )
            }

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