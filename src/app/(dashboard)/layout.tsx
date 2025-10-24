import { onLoginUser } from '@/action/auth';
import SideBar from '@/components/sidebar';
import { ChatProvider } from '@/context/user-chat-context';
import DomainRequiredGuard from '@/components/domain-required-guard';
import React from 'react';

type Props = {
  children: React.ReactNode;
}

const OwnerLayout = async ({ children }: Props) => {
  const authenticated = await onLoginUser();

  if (!authenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error de autenticación</h2>
          <p className="text-gray-600">No se pudo verificar tu sesión.</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider>
      <DomainRequiredGuard domains={authenticated.domains}>
        <div className='flex h-screen w-full'>
          <SideBar domains={authenticated.domains} />
          <div className='w-full h-screen flex flex-col pl-20 md:pl-4'>
            {children}
          </div>
        </div>
      </DomainRequiredGuard>
    </ChatProvider>
  )
}

export default OwnerLayout;