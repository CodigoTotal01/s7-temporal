import { onChatBotImageUpdate, onCreateFilterQuestions, onCreateHelpDeskQuestion, onCreateNewDomainProduct, onDeleteDomainProduct, onUpdateDomainProduct, onToggleProductStatus, onDeleteUserDomain, onGetAllFilterQuestions, onGetAllHelpDeskQuestions, onUpdateDomain, onUpdatePassword, onUpdateWelcomeMessage } from '@/action/settings'
import { useToast } from '@/components/ui/use-toast'
import {
    ChangePasswordProps,
    ChangePasswordSchema,
} from '@/schemas/auth.schema'
import { AddProductProps, AddProductSchema, DomainSettingsProps, DomainSettingsSchema, FilterQuestionsProps, FilterQuestionsSchema, HelpDeskQuestionsProps, HelpDeskQuestionsSchema } from '@/schemas/settings.schema'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { UploadClient } from '@uploadcare/upload-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const upload = new UploadClient({
    publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
})

export const useThemeMode = () => {
    return {
        setTheme: () => {},
        theme: 'light',
    }
}

export const useChangePassword = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ChangePasswordProps>({
        resolver: zodResolver(ChangePasswordSchema),
        mode: 'onChange',
    })
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)

    const onChangePassword = handleSubmit(async (values) => {
        try {
            setLoading(true)
            const updated = await onUpdatePassword(values.password)
            if (updated) {
                reset()
                setLoading(false)
                toast({ title: 'Éxito al actualizar contraseña', description: updated.message })
            }
        } catch (error) {
            console.log(error)
        }
    })
    return {
        register,
        errors,
        onChangePassword,
        loading,
    }
}

export const useSettings = (id: string) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<DomainSettingsProps>({
        resolver: zodResolver(DomainSettingsSchema),
    })
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<boolean>(false)

    const onUpdateSettings = handleSubmit(async (values) => {
        setLoading(true)
        if (values.domain) {
            const domain = await onUpdateDomain(id, values.domain)
            if (domain) {
                toast({
                    title: 'Éxito al actualizar dominio',
                    description: domain.message,
                })
            }
        }
        if (values.image[0]) {
            const uploaded = await upload.uploadFile(values.image[0])
            const image = await onChatBotImageUpdate(id, uploaded.uuid)
            if (image) {
                toast({
                    title: image.status == 200 ? 'Éxito al actualizar imagen' : 'Error al actualizar imagen',
                    description: image.message,
                })
                setLoading(false)
            }
        }
        if (values.welcomeMessage) {
            const message = await onUpdateWelcomeMessage(values.welcomeMessage, id)
            if (message) {
                toast({
                    title: 'Éxito al actualizar mensaje de bienvenida',
                    description: message.message,
                })
            }
        }
        reset()
        router.refresh()
        setLoading(false)
    })

    const onDeleteDomain = async () => {
        setDeleting(true)
        const deleted = await onDeleteUserDomain(id)
        if (deleted) {
            toast({
                title: 'Éxito al eliminar dominio',
                description: deleted.message,
            })
            setDeleting(false)
            router.refresh()
        }
    }
    return {
        register,
        onUpdateSettings,
        errors,
        loading,
        onDeleteDomain,
        deleting,
    }
}

export const useHelpDesk = (id: string) => {
    const {
        register,
        formState: { errors },
        handleSubmit,
        reset,
    } = useForm<HelpDeskQuestionsProps>({
        resolver: zodResolver(HelpDeskQuestionsSchema),
    })
    const { toast } = useToast()

    const [loading, setLoading] = useState<boolean>(false)
    const [isQuestions, setIsQuestions] = useState<
        { id: string; question: string; answer: string }[]
    >([])
    const onSubmitQuestion = handleSubmit(async (values) => {
        setLoading(true)
        const question = await onCreateHelpDeskQuestion(
            id,
            values.question,
            values.answer
        )
        if (question) {
            setIsQuestions(question.questions!)
            toast({
                title: question.status == 200 ? 'Éxito al crear pregunta' : 'Error al crear pregunta',
                description: question.message,
            })
            setLoading(false)
            reset()
        }
    })

    const onGetQuestions = async () => {
        setLoading(true)
        const questions = await onGetAllHelpDeskQuestions(id)
        if (questions) {
            setIsQuestions(questions.questions)
            setLoading(false)
        }
    }

    useEffect(() => {
        onGetQuestions()
    }, [])

    return {
        register,
        onSubmitQuestion,
        errors,
        isQuestions,
        loading,
    }
}

export const useFilterQuestions = (id: string) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FilterQuestionsProps>({
        resolver: zodResolver(FilterQuestionsSchema),
    })
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [isQuestions, setIsQuestions] = useState<
        { id: string; question: string }[]
    >([])

    const onAddFilterQuestions = handleSubmit(async (values) => {
        setLoading(true)
        const questions = await onCreateFilterQuestions(id, values.question)
        if (questions) {
            setIsQuestions(questions.questions!)
            toast({
                title: questions.status == 200 ? 'Éxito al crear pregunta' : 'Error al crear pregunta',
                description: questions.message,
            })
            reset()
            setLoading(false)
        }
    })

    const onGetQuestions = async () => {
        setLoading(true)
        const questions = await onGetAllFilterQuestions(id)
        if (questions) {
            setIsQuestions(questions.questions)
            setLoading(false)
        }
    }

    useEffect(() => {
        onGetQuestions()
    }, [])

    return {
        loading,
        onAddFilterQuestions,
        register,
        errors,
        isQuestions,
    }
}


export const useProducts = (domainId: string) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [editingProduct, setEditingProduct] = useState<any>(null)

    
    // Esquema condicional para edición
    const EditProductSchema = z.object({
        name: z
            .string()
            .min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
        image: z.any().optional(), // Opcional en edición
        price: z.string(),
    })

    const {
        register,
        reset,
        setValue,
        formState: { errors },
        handleSubmit,
    } = useForm<AddProductProps>({
        resolver: zodResolver(editingProduct ? EditProductSchema : AddProductSchema),
        defaultValues: {
            name: '',
            price: '',
        }
    })

    const onCreateNewProduct = handleSubmit(async (values) => {
        try {
            setLoading(true)
            const uploaded = await upload.uploadFile(values.image[0])
            const product = await onCreateNewDomainProduct(
                domainId,
                values.name,
                uploaded.uuid,
                values.price
            )
            if (product) {
                reset()
                toast({
                    title: 'Éxito al crear producto',
                    description: product.message,
                })
                setLoading(false)
                window.location.reload()
            }
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    })

    const onUpdateProduct = handleSubmit(async (values) => {
        try {
            setLoading(true)
            let imageUuid = editingProduct?.image
            
            if (values.image[0]) {
                const uploaded = await upload.uploadFile(values.image[0])
                imageUuid = uploaded.uuid
            }

            const result = await onUpdateDomainProduct(
                editingProduct.id,
                values.name,
                values.price,
                imageUuid
            )
            
            if (result) {
                reset()
                setEditingProduct(null)
                toast({
                    title: result.status === 200 ? 'Éxito al actualizar producto' : 'Error al actualizar producto',
                    description: result.message,
                })
                setLoading(false)
                if (result.status === 200) {
                    window.location.reload()
                }
            }
        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    })

    const onDeleteProduct = async (productId: string) => {
        try {
            setDeleting(productId)
            const result = await onDeleteDomainProduct(productId)
            if (result) {
                toast({
                    title: result.status === 200 ? 'Éxito al eliminar producto' : 'Error al eliminar producto',
                    description: result.message,
                })
                setDeleting(null)
                if (result.status === 200) {
                    window.location.reload()
                }
            }
        } catch (error) {
            console.log(error)
            setDeleting(null)
        }
    }

    const startEditing = (product: any) => {
        setEditingProduct(product)
        setValue('name', product.name)
        setValue('price', product.price.toString())
    }

    useEffect(() => {
        if (editingProduct) {
            setValue('name', editingProduct.name)
            setValue('price', editingProduct.price.toString())
        }
    }, [editingProduct, setValue])

    const onToggleProduct = async (productId: string) => {
        try {
            const result = await onToggleProductStatus(productId)
            if (result) {
                toast({
                    title: result.status === 200 ? 'Estado actualizado' : 'Error al actualizar estado',
                    description: result.message,
                })
                if (result.status === 200) {
                    window.location.reload()
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const cancelEditing = () => {
        setEditingProduct(null)
        reset()
    }

    return { 
        onCreateNewProduct, 
        onUpdateProduct,
        onDeleteProduct,
        onToggleProduct, 
        register, 
        errors, 
        loading, 
        deleting,
        editingProduct,
        startEditing,
        cancelEditing
    }
}
