import React from 'react'
import { FieldErrors, FieldValues, UseFormRegister } from 'react-hook-form'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Edit } from 'lucide-react'
import { ErrorMessage } from '@hookform/error-message'

type Props = {
    register: UseFormRegister<any>
    errors: FieldErrors<FieldValues>
    label: string
}

const UploadButton = ({ errors, label, register }: Props) => {
    return (
        <>
            <div className='flex gap-2 items-center flex-col w-full'>
                <Label
                    htmlFor='upload-button'
                    className='flex gap-2 p-3 rounded-lg bg-cream text-gray-500 cursor-pointer font-semibold text-sm items-center'>
                    <Input
                        {...register('image')}
                        className='hidden'
                        type='file'
                        id='upload-button' />
                    <Edit />
                    {label}
                </Label>
                <p className='text-sm text-gray-400 ml-6'>
                    El tamaño recomendado es 300px * 300px, tamaño <br />menor a 2MB
                </p>
            </div >
            <ErrorMessage
                errors={errors}
                name='image'
                render={({ message }) => (
                    <p className='text-red-400 mt-2'>
                        {message === 'Required' ? '' : message}
                    </p>
                )} />
        </>
    )
}

export default UploadButton