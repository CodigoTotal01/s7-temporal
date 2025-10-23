import { onChatBotImageUpdate, onCreateFilterQuestions, onUpdateFilterQuestion, onDeleteFilterQuestion, onCreateHelpDeskQuestion, onUpdateHelpDeskQuestion, onDeleteHelpDeskQuestion, onCreateNewDomainProduct, onDeleteDomainProduct, onUpdateDomainProduct, onToggleProductStatus, onDeleteUserDomain, onGetAllFilterQuestions, onGetAllHelpDeskQuestions, onUpdateDomain, onUpdatePassword, onUpdateWelcomeMessage, onGetCategories, onCreateCategory, onUpdateCategory, onDeleteCategory, onToggleCategory, onGetMaterials, onCreateMaterial, onUpdateMaterial, onDeleteMaterial, onToggleMaterial, onGetTextures, onCreateTexture, onUpdateTexture, onDeleteTexture, onToggleTexture, onGetSeasons, onCreateSeason, onUpdateSeason, onDeleteSeason, onToggleSeason, onGetUses, onCreateUse, onUpdateUse, onDeleteUse, onToggleUse, onGetFeatures, onCreateFeature, onUpdateFeature, onDeleteFeature, onToggleFeature } from '@/action/settings'
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
        if (values.image && values.image[0]) {
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

export const useHelpDesk = (id: string, initialData?: Array<{ id: string; question: string; answer: string }>) => {
    const {
        register,
        formState: { errors },
        handleSubmit,
        reset,
        setValue,
    } = useForm<HelpDeskQuestionsProps>({
        resolver: zodResolver(HelpDeskQuestionsSchema),
    })
    const { toast } = useToast()

    const [loading, setLoading] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [editingQuestion, setEditingQuestion] = useState<{ id: string; question: string; answer: string } | null>(null)
    const [isQuestions, setIsQuestions] = useState<
        { id: string; question: string; answer: string }[]
    >(initialData || [])

    const onSubmitQuestion = handleSubmit(async (values) => {
        setLoading(true)

        if (editingQuestion) {
            // Actualizar pregunta existente
            const result = await onUpdateHelpDeskQuestion(
                editingQuestion.id,
                values.question,
                values.answer
            )
            if (result) {
                toast({
                    title: result.status == 200 ? 'Éxito al actualizar pregunta' : 'Error al actualizar pregunta',
                    description: result.message,
                })
                if (result.status === 200) {
                    await onGetQuestions()
                    setEditingQuestion(null)
                    reset()
                }
                setLoading(false)
            }
        } else {
            // Crear nueva pregunta
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
        }
    })

    const onDeleteQuestion = async (questionId: string) => {
        setDeleting(questionId)
        const result = await onDeleteHelpDeskQuestion(questionId)
        if (result) {
            toast({
                title: result.status === 200 ? 'Éxito al eliminar pregunta' : 'Error al eliminar pregunta',
                description: result.message,
            })
            if (result.status === 200) {
                await onGetQuestions()
            }
            setDeleting(null)
        }
    }

    const startEditing = (question: { id: string; question: string; answer: string }) => {
        setEditingQuestion(question)
        setValue('question', question.question)
        setValue('answer', question.answer)
    }

    const cancelEditing = () => {
        setEditingQuestion(null)
        reset()
    }

    const onGetQuestions = async () => {
        setLoading(true)
        const questions = await onGetAllHelpDeskQuestions(id)
        if (questions) {
            setIsQuestions(questions.questions)
            setLoading(false)
        }
    }

    useEffect(() => {
        // ✅ OPTIMIZACIÓN: Solo cargar si no hay datos iniciales
        if (!initialData || initialData.length === 0) {
            let isMounted = true

            const loadQuestions = async () => {
                if (isMounted) {
                    await onGetQuestions()
                }
            }

            loadQuestions()

            return () => {
                isMounted = false
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    return {
        register,
        onSubmitQuestion,
        onDeleteQuestion,
        startEditing,
        cancelEditing,
        editingQuestion,
        errors,
        isQuestions,
        loading,
        deleting,
    }
}

export const useFilterQuestions = (id: string, initialData?: Array<{ id: string; question: string }>) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<FilterQuestionsProps>({
        resolver: zodResolver(FilterQuestionsSchema),
    })
    const { toast } = useToast()
    const [loading, setLoading] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [editingQuestion, setEditingQuestion] = useState<{ id: string; question: string } | null>(null)
    const [isQuestions, setIsQuestions] = useState<
        { id: string; question: string }[]
    >(initialData || [])

    const onAddFilterQuestions = handleSubmit(async (values) => {
        setLoading(true)

        if (editingQuestion) {
            // Actualizar pregunta existente
            const result = await onUpdateFilterQuestion(editingQuestion.id, values.question)
            if (result) {
                toast({
                    title: result.status == 200 ? 'Éxito al actualizar pregunta' : 'Error al actualizar pregunta',
                    description: result.message,
                })
                if (result.status === 200) {
                    await onGetQuestions()
                    setEditingQuestion(null)
                    reset()
                }
                setLoading(false)
            }
        } else {
            // Crear nueva pregunta
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
        }
    })

    const onDeleteQuestion = async (questionId: string) => {
        setDeleting(questionId)
        const result = await onDeleteFilterQuestion(questionId)
        if (result) {
            toast({
                title: result.status === 200 ? 'Éxito al eliminar pregunta' : 'Error al eliminar pregunta',
                description: result.message,
            })
            if (result.status === 200) {
                await onGetQuestions()
            }
            setDeleting(null)
        }
    }

    const startEditing = (question: { id: string; question: string }) => {
        setEditingQuestion(question)
        setValue('question', question.question)
    }

    const cancelEditing = () => {
        setEditingQuestion(null)
        reset()
    }

    const onGetQuestions = async () => {
        setLoading(true)
        const questions = await onGetAllFilterQuestions(id)
        if (questions) {
            setIsQuestions(questions.questions)
            setLoading(false)
        }
    }

    useEffect(() => {
        // ✅ OPTIMIZACIÓN: Solo cargar si no hay datos iniciales
        if (!initialData || initialData.length === 0) {
            let isMounted = true

            const loadQuestions = async () => {
                if (isMounted) {
                    await onGetQuestions()
                }
            }

            loadQuestions()

            return () => {
                isMounted = false
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    return {
        loading,
        deleting,
        onAddFilterQuestions,
        onDeleteQuestion,
        startEditing,
        cancelEditing,
        editingQuestion,
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

    // Estados para catálogos
    const [categories, setCategories] = useState<CatalogItem[]>([])
    const [materials, setMaterials] = useState<CatalogItem[]>([])
    const [textures, setTextures] = useState<CatalogItem[]>([])
    const [seasons, setSeasons] = useState<CatalogItem[]>([])
    const [uses, setUses] = useState<CatalogItem[]>([])
    const [features, setFeatures] = useState<CatalogItem[]>([])


    // Esquema condicional para edición
    const EditProductSchema = z.object({
        name: z
            .string()
            .min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
        image: z.any().optional(), // Opcional en edición
        price: z.string(),
        // Información técnica de la tela (IDs)
        materialId: z.string().optional(),
        width: z.string().optional(),
        weight: z.string().optional(),
        color: z.string().optional(),
        textureId: z.string().optional(),
        // Información de inventario
        stock: z.string().optional(),
        unit: z.string().optional(),
        minStock: z.string().optional(),
        sku: z.string().optional(),
        // Información de venta (IDs)
        salePrice: z.string().optional(),
        categoryId: z.string().optional(),
        featured: z.boolean().optional(),
        description: z.string().optional(),
        colors: z.string().optional(),
        // Temporada (ID)
        seasonId: z.string().optional(),
        care: z.string().optional(),
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

            // Preparar datos adicionales del producto (usando IDs, convertir 'none' a undefined)
            const productData = {
                materialId: values.materialId && values.materialId !== 'none' ? values.materialId : undefined,
                width: values.width,
                weight: values.weight,
                color: values.color,
                textureId: values.textureId && values.textureId !== 'none' ? values.textureId : undefined,
                stock: values.stock ? parseInt(values.stock) : undefined,
                unit: values.unit,
                minStock: values.minStock ? parseInt(values.minStock) : undefined,
                sku: values.sku,
                salePrice: values.salePrice ? parseInt(values.salePrice) : undefined,
                categoryId: values.categoryId && values.categoryId !== 'none' ? values.categoryId : undefined,
                featured: values.featured,
                description: values.description,
                colors: values.colors ? values.colors.split(',').map(c => c.trim()) : undefined,
                seasonId: values.seasonId && values.seasonId !== 'none' ? values.seasonId : undefined,
                care: values.care,
            }

            const product = await onCreateNewDomainProduct(
                domainId,
                values.name,
                uploaded.uuid,
                values.price,
                productData
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

            if (values.image && values.image[0]) {
                const uploaded = await upload.uploadFile(values.image[0])
                imageUuid = uploaded.uuid
            }

            // Preparar datos adicionales del producto (usando IDs, convertir 'none' a undefined)
            const productData = {
                materialId: values.materialId && values.materialId !== 'none' ? values.materialId : undefined,
                width: values.width,
                weight: values.weight,
                color: values.color,
                textureId: values.textureId && values.textureId !== 'none' ? values.textureId : undefined,
                stock: values.stock ? parseInt(values.stock) : undefined,
                unit: values.unit,
                minStock: values.minStock ? parseInt(values.minStock) : undefined,
                sku: values.sku,
                salePrice: values.salePrice ? parseInt(values.salePrice) : undefined,
                categoryId: values.categoryId && values.categoryId !== 'none' ? values.categoryId : undefined,
                featured: values.featured,
                description: values.description,
                colors: values.colors ? values.colors.split(',').map(c => c.trim()) : undefined,
                seasonId: values.seasonId && values.seasonId !== 'none' ? values.seasonId : undefined,
                care: values.care,
            }

            const result = await onUpdateDomainProduct(
                editingProduct.id,
                values.name,
                values.price,
                imageUuid,
                productData
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
        setValue('materialId', product.materialId || 'none')
        setValue('width', product.width || '')
        setValue('weight', product.weight || '')
        setValue('color', product.color || '')
        setValue('textureId', product.textureId || 'none')
        setValue('stock', product.stock?.toString() || '')
        setValue('unit', product.unit || 'metro')
        setValue('minStock', product.minStock?.toString() || '')
        setValue('sku', product.sku || '')
        setValue('salePrice', product.salePrice?.toString() || '')
        setValue('categoryId', product.categoryId || 'none')
        setValue('featured', product.featured || false)
        setValue('description', product.description || '')
        setValue('colors', product.colors?.join(', ') || '')
        setValue('seasonId', product.seasonId || 'none')
        setValue('care', product.care || '')
    }

    useEffect(() => {
        if (editingProduct) {
            setValue('name', editingProduct.name)
            setValue('price', editingProduct.price.toString())
            setValue('materialId', editingProduct.materialId || 'none')
            setValue('width', editingProduct.width || '')
            setValue('weight', editingProduct.weight || '')
            setValue('color', editingProduct.color || '')
            setValue('textureId', editingProduct.textureId || 'none')
            setValue('stock', editingProduct.stock?.toString() || '')
            setValue('unit', editingProduct.unit || 'metro')
            setValue('minStock', editingProduct.minStock?.toString() || '')
            setValue('sku', editingProduct.sku || '')
            setValue('salePrice', editingProduct.salePrice?.toString() || '')
            setValue('categoryId', editingProduct.categoryId || 'none')
            setValue('featured', editingProduct.featured || false)
            setValue('description', editingProduct.description || '')
            setValue('colors', editingProduct.colors?.join(', ') || '')
            setValue('seasonId', editingProduct.seasonId || 'none')
            setValue('care', editingProduct.care || '')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingProduct])

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

    // Cargar catálogos al montar el componente (OPTIMIZADO: solo una vez)
    useEffect(() => {
        let isMounted = true

        const loadCatalogs = async () => {
            try {
                const [cats, mats, texts, seas, us, feats] = await Promise.all([
                    onGetCategories(domainId),
                    onGetMaterials(domainId),
                    onGetTextures(domainId),
                    onGetSeasons(domainId),
                    onGetUses(domainId),
                    onGetFeatures(domainId),
                ])

                if (isMounted) {
                    setCategories(cats || [])
                    setMaterials(mats || [])
                    setTextures(texts || [])
                    setSeasons(seas || [])
                    setUses(us || [])
                    setFeatures(feats || [])
                }
            } catch (error) {
                console.error('Error cargando catálogos:', error)
            }
        }

        loadCatalogs()

        return () => {
            isMounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domainId])

    return {
        onCreateNewProduct,
        onUpdateProduct,
        onDeleteProduct,
        onToggleProduct,
        register,
        setValue,
        errors,
        loading,
        deleting,
        editingProduct,
        startEditing,
        cancelEditing,
        // Catálogos
        categories,
        materials,
        textures,
        seasons,
        uses,
        features,
    }
}

// ============================================
// HOOK PARA GESTIÓN DE CATÁLOGOS
// ============================================

type CatalogType = 'category' | 'material' | 'texture' | 'season' | 'use' | 'feature'

type CatalogItem = {
    id: string
    name: string
    active: boolean
}

const catalogActions = {
    category: {
        get: onGetCategories,
        create: onCreateCategory,
        update: onUpdateCategory,
        delete: onDeleteCategory,
        toggle: onToggleCategory,
    },
    material: {
        get: onGetMaterials,
        create: onCreateMaterial,
        update: onUpdateMaterial,
        delete: onDeleteMaterial,
        toggle: onToggleMaterial,
    },
    texture: {
        get: onGetTextures,
        create: onCreateTexture,
        update: onUpdateTexture,
        delete: onDeleteTexture,
        toggle: onToggleTexture,
    },
    season: {
        get: onGetSeasons,
        create: onCreateSeason,
        update: onUpdateSeason,
        delete: onDeleteSeason,
        toggle: onToggleSeason,
    },
    use: {
        get: onGetUses,
        create: onCreateUse,
        update: onUpdateUse,
        delete: onDeleteUse,
        toggle: onToggleUse,
    },
    feature: {
        get: onGetFeatures,
        create: onCreateFeature,
        update: onUpdateFeature,
        delete: onDeleteFeature,
        toggle: onToggleFeature,
    },
}

export const useCatalog = (domainId: string, type: CatalogType) => {
    const { toast } = useToast()
    const [items, setItems] = useState<CatalogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newItemName, setNewItemName] = useState('')
    const [editItemName, setEditItemName] = useState('')

    const actions = catalogActions[type]

    // Cargar items
    const loadItems = async () => {
        setLoading(true)
        const result = await actions.get(domainId)
        setItems(result || [])
        setLoading(false)
    }

    useEffect(() => {
        let isMounted = true

        const loadData = async () => {
            if (isMounted) {
                await loadItems()
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domainId, type])

    // Crear nuevo item
    const handleCreate = async () => {
        if (!newItemName.trim()) return

        setCreating(true)
        const result = await actions.create(domainId, newItemName.trim())

        if (result.status === 200) {
            toast({
                title: 'Éxito',
                description: result.message,
            })
            setNewItemName('')
            await loadItems()
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            })
        }
        setCreating(false)
    }

    // Actualizar item
    const handleUpdate = async () => {
        if (!editingId || !editItemName.trim()) return

        setUpdating(true)
        const result = await actions.update(editingId, editItemName.trim())

        if (result.status === 200) {
            toast({
                title: 'Éxito',
                description: result.message,
            })
            setEditingId(null)
            setEditItemName('')
            await loadItems()
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            })
        }
        setUpdating(false)
    }

    // Eliminar item
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este elemento?')) return

        setDeleting(id)
        const result = await actions.delete(id)

        if (result.status === 200) {
            toast({
                title: 'Éxito',
                description: result.message,
            })
            await loadItems()
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            })
        }
        setDeleting(null)
    }

    // Toggle activo/inactivo
    const handleToggle = async (id: string) => {
        const result = await actions.toggle(id)

        if (result.status === 200) {
            toast({
                title: 'Éxito',
                description: result.message,
            })
            await loadItems()
        } else {
            toast({
                title: 'Error',
                description: result.message,
                variant: 'destructive',
            })
        }
    }

    // Iniciar edición
    const startEditing = (id: string, name: string) => {
        setEditingId(id)
        setEditItemName(name)
    }

    // Cancelar edición
    const cancelEditing = () => {
        setEditingId(null)
        setEditItemName('')
    }

    return {
        items,
        loading,
        creating,
        updating,
        deleting,
        editingId,
        newItemName,
        editItemName,
        setNewItemName,
        setEditItemName,
        handleCreate,
        handleUpdate,
        handleDelete,
        handleToggle,
        startEditing,
        cancelEditing,
    }
}
