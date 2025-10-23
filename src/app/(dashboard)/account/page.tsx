import ChangePassword from '@/components/settings/change-password';
import React from 'react'
import { Shield, User } from 'lucide-react'

type Props = {}

const AccountPage = (props: Props) => {
    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="w-full space-y-8 p-4 md:p-6">
                {/* Header con icono y título */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-orange/10 rounded-xl flex items-center justify-center">
                            <User className="w-6 h-6 text-orange" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl md:text-2xl text-gray-900">Configuración de Cuenta</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Gestiona la seguridad y configuración de tu cuenta personal
                            </p>
                        </div>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-orange/20 via-orange/40 to-orange/20"></div>
                </div>

                <div className="space-y-8">
                    {/* Sección de cambio de contraseña */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-orange" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Seguridad de la Cuenta</h3>
                                <p className="text-sm text-gray-600">Actualiza tu contraseña para mantener tu cuenta segura</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <ChangePassword />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AccountPage;
