import React from 'react'
import BreadCrumb from './bread-crumb';
import { Card } from '../ui/card';
import { Headphones, Star, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type Props = {}

const InfoBar = (props: Props) => {
  return (
    <div className='flex w-full justify-between items-center py-1 mb-8'>
      <BreadCrumb />
      <div className='flex items-center gap-3'>
        <Card className='rounded-xl flex gap-3 py-3 px-4 text-ghost'>
          <Trash />
          <Star />
        </Card>

        {/* Avatar con ícono de Headphones */}
        <Avatar>
          <AvatarFallback className='bg-orange text-white'>
            <Headphones />
          </AvatarFallback>
        </Avatar>

        {/* Avatar con imagen y fallback de texto */}
        <Avatar>
          <AvatarImage src='https://github.com/shadcn.png' alt='@shadcn' />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default InfoBar;