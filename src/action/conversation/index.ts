"use server";

import { client } from "@/lib/prisma";
import { pusherServer } from "@/lib/utils";
import { Role } from "@prisma/client";

export const onToggleRealtime = async (id: string, state: boolean) => {
  try {
    const chatRoom = await client.chatRoom.update({
      where: {
        id,
      },
      data: {
        live: state,
      },
      select: {
        id: true,
        live: true,
      },
    });

    if (chatRoom) {
      return {
        status: 200,
        message: chatRoom.live
          ? "Realtime mode enabled"
          : "Realtime mode disabled",
        chatRoom,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetConversationMode = async (id: string) => {
  try {
    const mode = await client.chatRoom.findUnique({
      where: {
        id,
      },
      select: {
        live: true,
      },
    });

    console.log(mode);
    return mode;
  } catch (error) {
    console.log(error);
  }
};

export const onGetDomainChatRooms = async (id: string) => {
  try {
    console.log(`🔍 Obteniendo chatRooms para dominio: ${id}`)
    
    const domains = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        // @ts-ignore
        customer: {
          select: {
            id: true,
            email: true,
            name: true,
            chatRoom: {
              select: {
                createdAt: true,
                id: true,
                live: true,
                updatedAt: true,
                // @ts-ignore
                isFavorite: true,
                // @ts-ignore
                conversationState: true,
                // @ts-ignore
                lastUserActivityAt: true,
                message: {
                  select: {
                    message: true,
                    createdAt: true,
                    seen: true,
                    role: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
              },
              orderBy: {
                updatedAt: 'desc',
              },
            },
          },
        },
      },
    })

    if (domains) {
      console.log(`📊 Encontrados ${(domains as any).customer.length} clientes con chats`)
      return domains
    }
  } catch (error) {
    console.log('❌ Error en onGetDomainChatRooms:', error)
  }
}

export const onGetChatMessages = async (id: string) => {
  try {
    const messages = await client.chatRoom.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        live: true,
        message: {
          select: {
            id: true,
            role: true,
            message: true,
            createdAt: true,
            seen: true,
            responseTime: true,
            respondedWithin2Hours: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (messages) {
      console.log(`📊 Obteniendo mensajes para chatRoom ${id}: ${messages.message.length} mensajes`)
      return messages
    }
  } catch (error) {
    console.log('❌ Error en onGetChatMessages:', error)
  }
}

export const onViewUnReadMessages = async (id: string) => {
  try {
    await client.chatMessage.updateMany({
      where: {
        chatRoomId: id,
      },
      data: {
        seen: true,
      },
    })
  } catch (error) {
    console.log(error)
  }
}

export const onRealTimeChat = async (
  chatroomId: string,
  message: string,
  id: string,
  role: 'user' | 'assistant'
) => {
  pusherServer.trigger(chatroomId, 'realtime-mode', {
    chat: {
      message,
      id,
      role,
    },
  })
}

export const onOwnerSendMessage = async (
  chatroom: string,
  message: string,
  role: 'user' | 'assistant'
) => {
  try {
    const chat = await client.chatRoom.update({
      where: {
        id: chatroom,
      },
      data: {
        message: {
          create: {
            message,
            role: role,
          },
        },
      },
      select: {
        message: {
          select: {
            id: true,
            role: true,
            message: true,
            createdAt: true,
            seen: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (chat) {
      return chat
    }
  } catch (error) {
    console.log(error)
  }
}

export const onToggleFavorite = async (chatRoomId: string, isFavorite: boolean) => {
  try {
    const chatRoom = await client.chatRoom.update({
      where: {
        id: chatRoomId,
      },
      data: {
        // @ts-ignore
        isFavorite,
      },
      select: {
        id: true,
        // @ts-ignore
        isFavorite: true,
      },
    })

    if (chatRoom) {
      return {
        status: 200,
        message: isFavorite ? "Agregado a favoritos" : "Removido de favoritos",
        chatRoom,
      }
    }
  } catch (error) {
    console.log('Error al actualizar favorito:', error)
    return {
      status: 500,
      message: "Error al actualizar favorito",
    }
  }
}

// ✅ NUEVA FUNCIÓN: Obtener todas las conversaciones agrupadas por cliente
export const onGetAllDomainChatRooms = async (id: string) => {
  try {
    console.log(`🔍 Obteniendo TODAS las conversaciones para dominio: ${id}`)
    
    // Obtener todas las conversaciones del dominio
    const allChatRooms = await client.chatRoom.findMany({
      where: {
        Customer: {
          domainId: id
        }
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        live: true,
        // @ts-ignore
        isFavorite: true,
        // @ts-ignore
        conversationState: true,
        // @ts-ignore
        lastUserActivityAt: true,
        Customer: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        message: {
          select: {
            message: true,
            createdAt: true,
            seen: true,
            role: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Agrupar por cliente (email) y tomar solo la conversación más reciente de cada cliente
    const groupedByCustomer = new Map()
    
    allChatRooms.forEach(chatRoom => {
      const customerEmail = (chatRoom as any).Customer?.email || 'unknown'
      
      if (!groupedByCustomer.has(customerEmail)) {
        groupedByCustomer.set(customerEmail, {
          id: (chatRoom as any).Customer?.id,
          email: (chatRoom as any).Customer?.email,
          name: (chatRoom as any).Customer?.name,
          chatRoom: [{
            id: chatRoom.id,
            createdAt: chatRoom.createdAt,
            updatedAt: chatRoom.updatedAt,
            live: chatRoom.live,
            isFavorite: (chatRoom as any).isFavorite,
            conversationState: (chatRoom as any).conversationState,
            lastUserActivityAt: (chatRoom as any).lastUserActivityAt,
            message: (chatRoom as any).message
          }]
        })
      }
    })

    const result = {
      customer: Array.from(groupedByCustomer.values())
    }

    console.log(`📊 Encontrados ${result.customer.length} clientes únicos con conversaciones`)
    return result
  } catch (error) {
    console.log('❌ Error en onGetAllDomainChatRooms:', error)
    return null
  }
}
