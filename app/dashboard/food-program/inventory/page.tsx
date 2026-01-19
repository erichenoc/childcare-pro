'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Plus,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Calendar,
  DollarSign,
  Warehouse,
} from 'lucide-react'
import { foodProgramService } from '@/features/food-program/services/food-program.service'
import type { FoodInventoryItem, FoodInventoryFormData, FoodCategory, StorageLocation } from '@/shared/types/food-program'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassBadge,
} from '@/shared/components/ui'

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'grain', label: 'Granos/Pan' },
  { value: 'meat_alternate', label: 'Carne/Alternativa' },
  { value: 'vegetable', label: 'Vegetales' },
  { value: 'fruit', label: 'Frutas' },
  { value: 'milk', label: 'Leche' },
  { value: 'supplies', label: 'Suministros' },
  { value: 'other', label: 'Otro' },
]

const STORAGE_LOCATIONS: { value: StorageLocation; label: string }[] = [
  { value: 'refrigerator', label: 'Refrigerador' },
  { value: 'freezer', label: 'Congelador' },
  { value: 'pantry', label: 'Despensa' },
]

const UNITS = [
  { value: 'oz', label: 'Onzas (oz)' },
  { value: 'lb', label: 'Libras (lb)' },
  { value: 'gallon', label: 'Galones' },
  { value: 'count', label: 'Unidades' },
  { value: 'box', label: 'Cajas' },
  { value: 'bag', label: 'Bolsas' },
]

export default function InventoryPage() {
  const [items, setItems] = useState<FoodInventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<FoodInventoryItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<FoodInventoryItem[]>([])
  const [expiringItems, setExpiringItems] = useState<FoodInventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<FoodInventoryItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<FoodInventoryFormData>({
    item_name: '',
    category: 'other',
    unit: 'count',
    quantity_on_hand: 0,
    minimum_quantity: 0,
    reorder_point: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, categoryFilter])

  async function loadData() {
    try {
      setIsLoading(true)
      setError(null)

      const [itemsData, lowStock, expiring] = await Promise.all([
        foodProgramService.getInventoryItems(),
        foodProgramService.getLowStockItems(),
        foodProgramService.getExpiringItems(7),
      ])

      setItems(itemsData)
      setLowStockItems(lowStock)
      setExpiringItems(expiring)
    } catch (err) {
      console.error('Error loading inventory:', err)
      setError('Error al cargar inventario')
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      item_name: '',
      category: 'other',
      unit: 'count',
      quantity_on_hand: 0,
      minimum_quantity: 0,
      reorder_point: 0,
    })
    setEditingItem(null)
    setShowForm(false)
  }

  function handleEdit(item: FoodInventoryItem) {
    setFormData({
      item_name: item.item_name,
      category: item.category as FoodCategory,
      unit: item.unit,
      quantity_on_hand: item.quantity_on_hand,
      minimum_quantity: item.minimum_quantity,
      reorder_point: item.reorder_point,
      unit_cost: item.unit_cost || undefined,
      supplier: item.supplier || undefined,
      expiration_date: item.expiration_date || undefined,
      storage_location: item.storage_location as StorageLocation || undefined,
      notes: item.notes || undefined,
    })
    setEditingItem(item)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (editingItem) {
        await foodProgramService.updateInventoryItem(editingItem.id, formData)
        setSuccess('Item actualizado exitosamente')
      } else {
        await foodProgramService.createInventoryItem(formData)
        setSuccess('Item agregado exitosamente')
      }

      resetForm()
      await loadData()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving item:', err)
      setError('Error al guardar item')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este item?')) return

    try {
      await foodProgramService.deleteInventoryItem(id)
      setSuccess('Item eliminado')
      await loadData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Error al eliminar item')
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category
  }

  const getStorageLabel = (location: string | null) => {
    if (!location) return '-'
    return STORAGE_LOCATIONS.find(l => l.value === location)?.label || location
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/food-program">
            <GlassButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </GlassButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-7 h-7 text-primary-600" />
              Control de Inventario
            </h1>
            <p className="text-gray-500">Gestiona el inventario de alimentos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton variant="secondary" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </GlassButton>
          <GlassButton variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Item
          </GlassButton>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <GlassCard className="border-l-4 border-l-amber-500">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                  Stock Bajo ({lowStockItems.length})
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ul className="space-y-2">
                  {lowStockItems.slice(0, 5).map(item => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.item_name}</span>
                      <span className="text-amber-600 font-medium">
                        {item.quantity_on_hand} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCardContent>
            </GlassCard>
          )}

          {expiringItems.length > 0 && (
            <GlassCard className="border-l-4 border-l-red-500">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2 text-red-700">
                  <Calendar className="w-5 h-5" />
                  Por Vencer ({expiringItems.length})
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ul className="space-y-2">
                  {expiringItems.slice(0, 5).map(item => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.item_name}</span>
                      <span className="text-red-600 font-medium">
                        {item.expiration_date}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>
              {editingItem ? 'Editar Item' : 'Agregar Nuevo Item'}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <GlassInput
                  label="Nombre del Item *"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  required
                />

                <GlassSelect
                  label="Categoría *"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as FoodCategory })}
                  options={CATEGORIES}
                />

                <GlassSelect
                  label="Unidad *"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  options={UNITS}
                />

                <GlassInput
                  label="Cantidad en Stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity_on_hand || 0}
                  onChange={(e) => setFormData({ ...formData, quantity_on_hand: parseFloat(e.target.value) })}
                />

                <GlassInput
                  label="Cantidad Mínima"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_quantity || 0}
                  onChange={(e) => setFormData({ ...formData, minimum_quantity: parseFloat(e.target.value) })}
                />

                <GlassInput
                  label="Punto de Reorden"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.reorder_point || 0}
                  onChange={(e) => setFormData({ ...formData, reorder_point: parseFloat(e.target.value) })}
                />

                <GlassInput
                  label="Costo Unitario"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost || ''}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || undefined })}
                />

                <GlassInput
                  label="Proveedor"
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value || undefined })}
                />

                <GlassInput
                  label="Fecha de Vencimiento"
                  type="date"
                  value={formData.expiration_date || ''}
                  onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value || undefined })}
                />

                <GlassSelect
                  label="Ubicación"
                  value={formData.storage_location || ''}
                  onChange={(e) => setFormData({ ...formData, storage_location: (e.target.value || undefined) as StorageLocation | undefined })}
                  options={[{ value: '', label: 'Seleccionar...' }, ...STORAGE_LOCATIONS]}
                />
              </div>

              <div className="flex justify-end gap-3">
                <GlassButton type="button" variant="ghost" onClick={resetForm}>
                  Cancelar
                </GlassButton>
                <GlassButton type="submit" variant="primary" isLoading={isSaving}>
                  {editingItem ? 'Actualizar' : 'Agregar'}
                </GlassButton>
              </div>
            </form>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <GlassInput
                placeholder="Buscar por nombre o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-48">
              <GlassSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[{ value: 'all', label: 'Todas las categorías' }, ...CATEGORIES]}
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              <p className="text-sm text-gray-500">Items Totales</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
              <p className="text-sm text-gray-500">Stock Bajo</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expiringItems.length}</p>
              <p className="text-sm text-gray-500">Por Vencer</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="clear" className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(items.reduce((sum, item) => sum + (item.quantity_on_hand * (item.unit_cost || 0)), 0))}
              </p>
              <p className="text-sm text-gray-500">Valor Total</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Inventory Table */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            Inventario ({filteredItems.length})
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Reorden</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Costo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vence</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No hay items en el inventario
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.quantity_on_hand <= item.reorder_point
                    const isExpiring = item.expiration_date && new Date(item.expiration_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.item_name}</p>
                            {item.supplier && (
                              <p className="text-xs text-gray-500">{item.supplier}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <GlassBadge variant="secondary">
                            {getCategoryLabel(item.category)}
                          </GlassBadge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                            {item.quantity_on_hand} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {item.reorder_point} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {getStorageLabel(item.storage_location)}
                        </td>
                        <td className="px-4 py-3">
                          {item.expiration_date ? (
                            <span className={isExpiring ? 'text-red-600 font-medium' : 'text-gray-500'}>
                              {item.expiration_date}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-gray-400 hover:text-primary-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  )
}
