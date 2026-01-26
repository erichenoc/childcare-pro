'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Camera, Calendar, Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/shared/lib/supabase/client'
import { guardianAuthService } from '@/features/family-portal/services/guardian-auth.service'

type Photo = {
  id: string
  photo_url: string
  caption: string | null
  taken_at: string
  child_id: string
  child?: {
    first_name: string
    last_name: string
  }
}

export default function FamilyPortalPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | string>('all')
  const [children, setChildren] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    async function loadPhotos() {
      try {
        const guardian = await guardianAuthService.getCurrentGuardian()
        if (!guardian) return

        const childIds = guardian.children.map(c => c.id)
        setChildren(guardian.children.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
        })))

        if (childIds.length === 0) {
          setIsLoading(false)
          return
        }

        const supabase = createClient()

        const { data, error } = await supabase
          .from('daily_photos')
          .select(`
            id,
            photo_url,
            caption,
            taken_at,
            child_id,
            child:children(first_name, last_name)
          `)
          .in('child_id', childIds)
          .order('taken_at', { ascending: false })

        if (error) throw error
        setPhotos(data || [])
      } catch (error) {
        console.error('Error loading photos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPhotos()
  }, [])

  const filteredPhotos = filter === 'all'
    ? photos
    : photos.filter(p => p.child_id === filter)

  const groupedPhotos = filteredPhotos.reduce((acc, photo) => {
    const date = new Date(photo.taken_at).toLocaleDateString('es', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id)
    const newIndex = direction === 'prev'
      ? (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length
      : (currentIndex + 1) % filteredPhotos.length
    setSelectedPhoto(filteredPhotos[newIndex])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Cargando fotos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="w-7 h-7 text-pink-600" />
            Galeria de Fotos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Fotos de las actividades diarias de tus hijos
          </p>
        </div>

        {/* Filter */}
        {children.length > 1 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los hijos</option>
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Photos Grid */}
      {Object.entries(groupedPhotos).length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Aun no hay fotos disponibles
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2 capitalize">
                <Calendar className="w-4 h-4" />
                {date}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {datePhotos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 group relative"
                  >
                    <Image
                      src={photo.photo_url}
                      alt={photo.caption || 'Foto'}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">
                        {photo.child?.first_name || 'Foto'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => navigatePhoto('prev')}
            className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={() => navigatePhoto('next')}
            className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="max-w-4xl max-h-[90vh] flex flex-col">
            <Image
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || 'Foto'}
              width={800}
              height={600}
              className="max-h-[70vh] w-auto object-contain rounded-lg"
            />
            <div className="mt-4 text-center text-white">
              {selectedPhoto.caption && (
                <p className="text-lg mb-1">{selectedPhoto.caption}</p>
              )}
              <p className="text-sm text-white/70">
                {selectedPhoto.child?.first_name} {selectedPhoto.child?.last_name} - {new Date(selectedPhoto.taken_at).toLocaleDateString('es', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <a
                href={selectedPhoto.photo_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
