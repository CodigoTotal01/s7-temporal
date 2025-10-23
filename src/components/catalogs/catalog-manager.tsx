'use client'

import React, { useState } from 'react'
import { useCatalog } from '@/hooks/settings/use-settings'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { Loader } from '../loader'
import { Switch } from '../ui/switch'
import { Spinner } from '../spinner'

type CatalogType = 'category' | 'material' | 'texture' | 'season' | 'use' | 'feature'

type Props = {
  domainId: string
  type: CatalogType
  title: string
  description: string
}

const CatalogManager = ({ domainId, type, title, description }: Props) => {
  const {
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
  } = useCatalog(domainId, type)

  return (
    <div className="space-y-6">
      {/* Formulario para agregar nuevo */}
      <div className="bg-white rounded-xl p-6 border border-gray-200/50 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-orange" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Agregar {title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`Nombre de ${title.toLowerCase()}`}
            className="flex-1"
            disabled={creating}
          />
          <Button
            onClick={handleCreate}
            disabled={creating || !newItemName.trim()}
            className="bg-orange hover:bg-orange/90 px-6"
          >
            <Loader loading={creating}>
              <Plus size={16} className="mr-2" />
              Agregar
            </Loader>
          </Button>
        </div>
      </div>

      {/* Lista de items */}
      <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title} Creadas ({items.length})
              </h3>
              <p className="text-sm text-gray-600">Gestiona los elementos existentes</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-16 h-16 bg-orange/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-orange" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No hay {title.toLowerCase()} aún
            </h4>
            <p className="text-sm text-gray-600">
              Comienza agregando tu primer elemento usando el formulario de arriba
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition ${editingId === item.id ? 'bg-blue-50' : ''
                  } ${deleting === item.id ? 'opacity-50' : ''}`}
              >
                {editingId === item.id ? (
                  // Modo edición
                  <>
                    <Input
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        disabled={updating || !editItemName.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {updating ? (
                          <Spinner noPadding />
                        ) : (
                          <Check size={16} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={updating}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </>
                ) : (
                  // Modo vista
                  <>
                    <div className="flex-1 flex items-center gap-3">
                      <span className={`font-medium ${!item.active ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {item.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {item.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Toggle activo/inactivo */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.active}
                          onCheckedChange={() => handleToggle(item.id)}
                          disabled={deleting === item.id}
                        />
                      </div>

                      {/* Botón editar */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(item.id, item.name)}
                        disabled={deleting === item.id}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit size={16} />
                      </Button>

                      {/* Botón eliminar */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting === item.id ? (
                          <Spinner noPadding />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CatalogManager

