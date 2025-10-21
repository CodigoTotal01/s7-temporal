'use server'

import { clerkClient, currentUser } from "@clerk/nextjs";
import { client } from "@/lib/prisma";

export const onIntegrateDomain = async (domain: string, icon: string) => {
  const user = await currentUser();
  if (!user) return;
  try {
    const domainExists = await client.user.findFirst({
      where: {
        clerkId: user.id,
        domains: {
          some: {
            name: domain,
          },
        },
      },
    });

    if (!domainExists) {
      const newDomain = await client.user.update({
        where: {
          clerkId: user.id,
        },
        data: {
          domains: {
            create: {
              name: domain,
              icon,
              chatBot: {
                create: {
                  welcomeMessage: "Hola, ¿tienes alguna pregunta? Envíanos un mensaje aquí",
                }
              }
            }
          }
        },
        include: {
          domains: {
            where: {
              name: domain,
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (newDomain && newDomain.domains.length > 0) {
        return {
          status: 200,
          message: "Empresa agregada exitosamente",
          domainId: newDomain.domains[0].id
        };
      }
    }

    return {
      status: 400,
      message: "Una empresa con este nombre ya existe"
    };

  } catch (error) {
    console.log("Error in onIntegrateDomain: " + error)
  }
}

export const onGetAllAccountDomains = async () => {
  const user = await currentUser();
  if (!user) {
    return {
      id: '',
      domains: [],
    };
  }

  try {
    const domains = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        id: true,
        domains: {
          select: {
            id: true,
            name: true,
            icon: true,
            customer: {
              select: {
                chatRoom: {
                  select: {
                    id: true,
                    live: true,
                  },
                }
              },
            },
          },
        },
      },
    });

    if (domains) {
      return { ...domains }
    }

    return {
      id: '',
      domains: [],
    };
  } catch (error: any) {
    console.error("onGetAllAccountDomains - Error fetching account domains:", error);
    return {
      id: '',
      domains: [],
    };
  }
}

export const onUpdatePassword = async (password: string) => {
  try {
    const user = await currentUser()

    if (!user) return null
    const update = await clerkClient.users.updateUser(user.id, { password })
    if (update) {
      return { status: 200, message: 'Contraseña actualizada' }
    }
  } catch (error) {
    console.log(error)
  }
}

export const onGetCurrentDomainInfo = async (domain: string) => {
  const user = await currentUser()
  if (!user) return null
  try {
    const userDomain = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        domains: {
          where: {
            id: domain,
          },
          select: {
            id: true,
            name: true,
            icon: true,
            userId: true,
            products: true,
            chatBot: {
              select: {
                id: true,
                welcomeMessage: true,
                icon: true,
              },
            },
          },
        },
      },
    })

    if (userDomain) {
      return userDomain
    }

    return null
  } catch (error) {
    console.log("Error en onGetCurrentDomainInfo:", error)
    return null
  }
}

export const onUpdateDomain = async (id: string, name: string) => {
  try {
    const domainExists = await client.domain.findFirst({
      where: {
        name: {
          equals: name,
        },
        id: {
          not: id,
        },
      },
    })

    if (!domainExists) {
      const domain = await client.domain.update({
        where: {
          id,
        },
        data: {
          name,
        },
      })

      if (domain) {
        return {
          status: 200,
          message: 'Empresa actualizada',
        }
      }

      return {
        status: 400,
        message: 'Oops! algo salió mal',
      }
    }

    return {
      status: 400,
      message: 'Una empresa con este nombre ya existe',
    }
  } catch (error) {
    console.log(error)
  }
}

export const onChatBotImageUpdate = async (id: string, icon: string) => {
  const user = await currentUser()

  if (!user) return

  try {
    const domain = await client.domain.update({
      where: {
        id,
      },
      data: {
        chatBot: {
          update: {
            data: {
              icon,
            },
          },
        },
      },
    })

    if (domain) {
      return {
        status: 200,
        message: 'Empresa actualizada',
      }
    }

    return {
      status: 400,
      message: 'Oops! algo salió mal',
    }
  } catch (error) {
    console.log(error)
  }
}

export const onUpdateWelcomeMessage = async (
  message: string,
  domainId: string
) => {
  try {
    const update = await client.domain.update({
      where: {
        id: domainId,
      },
      data: {
        chatBot: {
          update: {
            data: {
              welcomeMessage: message,
            },
          },
        },
      },
    })

    if (update) {
      return { status: 200, message: 'Mensaje de bienvenida actualizado' }
    }
  } catch (error) {
    console.log(error)
  }
}

export const onDeleteUserDomain = async (id: string) => {
  const user = await currentUser()

  if (!user) return

  try {
    const validUser = await client.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        id: true,
      },
    })

    if (validUser) {
      const deletedDomain = await client.domain.delete({
        where: {
          userId: validUser.id,
          id,
        },
        select: {
          name: true,
        },
      })

      if (deletedDomain) {
        return {
          status: 200,
          message: `${deletedDomain.name} fue eliminada exitosamente`,
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}

export const onCreateHelpDeskQuestion = async (
  id: string,
  question: string,
  answer: string
) => {
  try {
    const helpDeskQuestion = await client.domain.update({
      where: {
        id,
      },
      data: {
        helpdesk: {
          create: {
            question,
            answer,
          },
        },
      },
      include: {
        helpdesk: {
          select: {
            id: true,
            question: true,
            answer: true,
          },
        },
      },
    })

    if (helpDeskQuestion) {
      return {
        status: 200,
        message: 'Nueva pregunta agregada',
        questions: helpDeskQuestion.helpdesk,
      }
    }

    return {
      status: 400,
      message: 'Oops! algo salió mal',
    }
  } catch (error) {
    console.log(error)
  }
}

export const onGetAllHelpDeskQuestions = async (id: string) => {
  try {
    const questions = await client.helpDesk.findMany({
      where: {
        domainId: id,
      },
      select: {
        question: true,
        answer: true,
        id: true,
      },
    })

    return {
      status: 200,
      message: 'Nueva pregunta agregada',
      questions: questions,
    }
  } catch (error) {
    console.log(error)
  }
}

export const onUpdateHelpDeskQuestion = async (
  questionId: string,
  question: string,
  answer: string
) => {
  try {
    const updatedQuestion = await client.helpDesk.update({
      where: {
        id: questionId,
      },
      data: {
        question,
        answer,
      },
    })

    if (updatedQuestion) {
      return {
        status: 200,
        message: 'Pregunta actualizada exitosamente',
      }
    }

    return {
      status: 400,
      message: 'Error al actualizar la pregunta',
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al actualizar la pregunta',
    }
  }
}

export const onDeleteHelpDeskQuestion = async (questionId: string) => {
  try {
    const deletedQuestion = await client.helpDesk.delete({
      where: {
        id: questionId,
      },
    })

    if (deletedQuestion) {
      return {
        status: 200,
        message: 'Pregunta eliminada exitosamente',
      }
    }

    return {
      status: 400,
      message: 'Error al eliminar la pregunta',
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al eliminar la pregunta',
    }
  }
}

export const onCreateFilterQuestions = async (id: string, question: string) => {
  try {
    const filterQuestion = await client.domain.update({
      where: {
        id,
      },
      data: {
        filterQuestions: {
          create: {
            question,
          },
        },
      },
      include: {
        filterQuestions: {
          select: {
            id: true,
            question: true,
          },
        },
      },
    })

    if (filterQuestion) {
      return {
        status: 200,
        message: 'Pregunta de filtro agregada',
        questions: filterQuestion.filterQuestions,
      }
    }
    return {
      status: 400,
      message: 'Oops! algo salió mal',
    }
  } catch (error) {
    console.log(error)
  }
}

export const onGetAllFilterQuestions = async (id: string) => {
  try {
    const questions = await client.filterQuestions.findMany({
      where: {
        domainId: id,
      },
      select: {
        question: true,
        id: true,
      },
      orderBy: {
        question: 'asc',
      },
    })

    return {
      status: 200,
      message: '',
      questions: questions,
    }
  } catch (error) {
    console.log(error)
  }
}

export const onUpdateFilterQuestion = async (questionId: string, question: string) => {
  try {
    const updatedQuestion = await client.filterQuestions.update({
      where: {
        id: questionId,
      },
      data: {
        question,
      },
    })

    if (updatedQuestion) {
      return {
        status: 200,
        message: 'Pregunta actualizada exitosamente',
      }
    }

    return {
      status: 400,
      message: 'Error al actualizar la pregunta',
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al actualizar la pregunta',
    }
  }
}

export const onDeleteFilterQuestion = async (questionId: string) => {
  try {
    const deletedQuestion = await client.filterQuestions.delete({
      where: {
        id: questionId,
      },
    })

    if (deletedQuestion) {
      return {
        status: 200,
        message: 'Pregunta eliminada exitosamente',
      }
    }

    return {
      status: 400,
      message: 'Error al eliminar la pregunta',
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al eliminar la pregunta',
    }
  }
}

export const onGetPaymentConnected = async () => {
  try {
    const user = await currentUser()
    if (user) {
      const connected = await client.user.findUnique({
        where: {
          clerkId: user.id,
        },
        select: {
          stripeId: true,
        },
      })
      if (connected) {
        return connected.stripeId
      }
    }
  } catch (error) {
    console.log(error)
  }
}

export const onCreateNewDomainProduct = async (
  id: string,
  name: string,
  image: string,
  price: string
) => {
  try {
    const product = await client.domain.update({
      where: {
        id,
      },
      data: {
        products: {
          create: {
            name,
            image,
            price: parseInt(price),
          },
        },
      },
    })

    if (product) {
      return {
        status: 200,
        message: 'Producto creado exitosamente',
      }
    }
  } catch (error) {
    console.log(error)
  }
}

export const onDeleteDomainProduct = async (productId: string) => {
  try {
    const product = await client.product.delete({
      where: {
        id: productId,
      },
    })

    if (product) {
      return {
        status: 200,
        message: 'Producto eliminado exitosamente',
      }
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al eliminar el producto',
    }
  }
}

export const onUpdateDomainProduct = async (
  productId: string,
  name: string,
  price: string,
  image?: string
) => {
  try {
    const updateData: any = {
      name,
      price: parseInt(price),
    }

    if (image) {
      updateData.image = image
    }

    const product = await client.product.update({
      where: {
        id: productId,
      },
      data: updateData,
    })

    if (product) {
      return {
        status: 200,
        message: 'Producto actualizado exitosamente',
      }
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al actualizar el producto',
    }
  }
}

export const onToggleProductStatus = async (productId: string) => {
  try {
    const currentProduct = await client.product.findUnique({
      where: { id: productId },
      select: {
        active: true
      }
    })

    if (!currentProduct) {
      return {
        status: 404,
        message: 'Producto no encontrado',
      }
    }

    const product = await client.product.update({
      where: {
        id: productId,
      },
      data: {
        active: !currentProduct.active,
      },
    })

    if (product) {
      return {
        status: 200,
        message: `Producto ${product.active ? 'activado' : 'desactivado'} exitosamente`,
        active: product.active,
      }
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al cambiar el estado del producto',
    }
  }
}

// ===== GESTIÓN DE HORARIOS DISPONIBLES =====

export const onGetAvailabilitySchedule = async (domainId: string) => {
  try {
    const schedule = await client.availabilitySchedule.findMany({
      where: {
        domainId,
      },
      select: {
        id: true,
        dayOfWeek: true,
        timeSlots: true,
        isActive: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    })

    return {
      status: 200,
      schedule,
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al obtener horarios',
      schedule: [],
    }
  }
}

export const onUpdateAvailabilitySchedule = async (
  domainId: string,
  dayOfWeek: string,
  timeSlots: string[],
  isActive: boolean
) => {
  try {
    // Buscar si ya existe un registro para este día
    const existing = await client.availabilitySchedule.findUnique({
      where: {
        domainId_dayOfWeek: {
          domainId,
          dayOfWeek: dayOfWeek as any,
        },
      },
    })

    if (existing) {
      // Actualizar
      const updated = await client.availabilitySchedule.update({
        where: {
          id: existing.id,
        },
        data: {
          timeSlots,
          isActive,
        },
      })

      if (updated) {
        return {
          status: 200,
          message: 'Horario actualizado exitosamente',
        }
      }
    } else {
      // Crear
      const created = await client.availabilitySchedule.create({
        data: {
          domainId,
          dayOfWeek: dayOfWeek as any,
          timeSlots,
          isActive,
        },
      })

      if (created) {
        return {
          status: 200,
          message: 'Horario creado exitosamente',
        }
      }
    }

    return {
      status: 400,
      message: 'Error al guardar horario',
    }
  } catch (error) {
    console.log(error)
    return {
      status: 400,
      message: 'Error al guardar horario',
    }
  }
}
