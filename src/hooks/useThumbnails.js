import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  generateThumbnail, 
  getThumbnailCacheKey, 
  cacheThumbnail, 
  getCachedThumbnail 
} from '../utils/thumbnailGenerator'

export const useThumbnails = (viewMode = 'grid') => {
  const [thumbnailCache, setThumbnailCache] = useState(new Map())
  const [loadingThumbnails, setLoadingThumbnails] = useState(new Set())

  const generateFileThumbnail = useCallback(async (file) => {
    const cacheKey = getThumbnailCacheKey(file)
    
    // Check memory cache first
    if (thumbnailCache.has(cacheKey)) {
      return thumbnailCache.get(cacheKey)
    }
    
    // Check localStorage cache
    const cachedThumbnail = getCachedThumbnail(cacheKey)
    if (cachedThumbnail) {
      setThumbnailCache(prev => new Map(prev.set(cacheKey, cachedThumbnail)))
      return cachedThumbnail
    }
    
    // Generate new thumbnail
    try {
      setLoadingThumbnails(prev => new Set(prev.add(cacheKey)))
      
      const thumbnail = await generateThumbnail(file, { 
        width: viewMode === 'grid' ? 200 : 150, 
        height: viewMode === 'grid' ? 150 : 64,
        quality: 0.8 
      })
      
      if (thumbnail) {
        // Cache in memory and localStorage
        setThumbnailCache(prev => new Map(prev.set(cacheKey, thumbnail)))
        cacheThumbnail(cacheKey, thumbnail)
        return thumbnail
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      toast.error(`Failed to generate thumbnail for ${file.name}`)
    } finally {
      setLoadingThumbnails(prev => {
        const newSet = new Set(prev)
        newSet.delete(cacheKey)
        return newSet
      })
    }
    
    return null
  }, [thumbnailCache, viewMode])

  return {
    thumbnailCache,
    loadingThumbnails,
    generateFileThumbnail
  }
}