import { onLoginUser } from '@/action/auth';
import { ChatProvider } from '@/context/user-chat-context';
import React from 'react'

type Props = {
  children: React.ReactNode;
}

const OwnerLayout = async(props: Props) => {
  const authenticated = await onLoginUser();

  if(!authenticated) return null;

    return (
    <ChatProvider>
      <div className='flex h-screen w-full'>
        <div className='flex-1 flex flex-col'>
          {props.children}
        </div>
      </div>
    </ChatProvider>
  )
}

export default OwnerLayout;