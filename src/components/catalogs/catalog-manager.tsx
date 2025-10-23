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
    <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100">
      <div className="space-y-6">
        {/* Formulario para agregar nuevo */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Agregar {title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          <div className="flex gap-2">
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
              className="bg-orange hover:bg-orange/90"
            >
              <Loader loading={creating}>
                <Plus size={16} className="mr-2" />
                Agregar
              </Loader>
            </Button>
          </div>
        </div>

        {/* Lista de items */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {title} Creadas ({items.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Plus size={24} className="text-gray-400" />
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-2">
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
                  className={`p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition ${
                    editingId === item.id ? 'bg-blue-50' : ''
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
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.active
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
    </div>
  )
}

export default CatalogManager

