import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

/**
 * Generate thumbnail for different file types
 * @param {File} file - The file to generate thumbnail for
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export const generateThumbnail = async (file, options = {}) => {
  const { width = 150, height = 150, quality = 0.8 } = options

  try {
    const fileType = file.type.toLowerCase()
    
    if (fileType.startsWith('image/')) {
      return await generateImageThumbnail(file, { width, height, quality })
    } else if (fileType.startsWith('video/')) {
      return await generateVideoThumbnail(file, { width, height, quality })
    } else if (fileType === 'application/pdf') {
      return await generatePDFThumbnail(file, { width, height, quality })
    } else if (isDocumentType(fileType)) {
      return generateDocumentThumbnail(fileType, { width, height })
    } else if (isArchiveType(fileType)) {
      return generateArchiveThumbnail(fileType, { width, height })
    } else if (fileType.startsWith('audio/')) {
      return generateAudioThumbnail(fileType, { width, height })
    }
    
    // Fallback for unsupported types
    return null
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return null
  }
}

/**
 * Generate thumbnail for image files
 */
const generateImageThumbnail = (file, { width, height, quality }) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = img.width / img.height
      let newWidth = width
      let newHeight = height
      
      if (aspectRatio > 1) {
        newHeight = width / aspectRatio
      } else {
        newWidth = height * aspectRatio
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // Draw image with smooth scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      // Convert to data URL
      const thumbnail = canvas.toDataURL('image/jpeg', quality)
      resolve(thumbnail)
    }
    
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate thumbnail for video files
 */
const generateVideoThumbnail = (file, { width, height, quality }) => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    video.addEventListener('loadedmetadata', () => {
      // Set video to 10% of duration for a better frame
      video.currentTime = video.duration * 0.1
    })
    
    video.addEventListener('seeked', () => {
      // Calculate aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight
      let newWidth = width
      let newHeight = height
      
      if (aspectRatio > 1) {
        newHeight = width / aspectRatio
      } else {
        newWidth = height * aspectRatio
      }
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, newWidth, newHeight)
      
      // Add play button overlay
      drawPlayButton(ctx, newWidth, newHeight)
      
      const thumbnail = canvas.toDataURL('image/jpeg', quality)
      URL.revokeObjectURL(video.src)
      resolve(thumbnail)
    })
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src)
      resolve(null)
    })
    
    video.src = URL.createObjectURL(file)
    video.load()
  })
}

/**
 * Generate thumbnail for PDF files
 */
const generatePDFThumbnail = async (file, { width, height, quality }) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const page = await pdf.getPage(1)
    
    const viewport = page.getViewport({ scale: 1 })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Calculate scale to fit within thumbnail dimensions
    const scale = Math.min(width / viewport.width, height / viewport.height)
    const scaledViewport = page.getViewport({ scale })
    
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height
    
    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport
    }).promise
    
    return canvas.toDataURL('image/jpeg', quality)
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error)
    return null
  }
}

/**
 * Generate SVG-based thumbnail for document types
 */
const generateDocumentThumbnail = (fileType, { width, height }) => {
  const iconColor = getDocumentColor(fileType)
  const iconName = getDocumentIcon(fileType)
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${iconColor};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${iconColor};stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" rx="8"/>
      <rect x="20" y="20" width="${width-40}" height="${height-60}" fill="white" rx="4" stroke="${iconColor}" stroke-width="2"/>
      <rect x="30" y="35" width="${width-80}" height="8" fill="${iconColor}" opacity="0.3" rx="2"/>
      <rect x="30" y="50" width="${width-100}" height="6" fill="${iconColor}" opacity="0.2" rx="2"/>
      <rect x="30" y="62" width="${width-90}" height="6" fill="${iconColor}" opacity="0.2" rx="2"/>
      <text x="${width/2}" y="${height-15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${iconColor}">
        ${iconName}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate SVG-based thumbnail for archive types
 */
const generateArchiveThumbnail = (fileType, { width, height }) => {
  const extension = getArchiveExtension(fileType)
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="archiveBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#archiveBg)" rx="8"/>
      <rect x="25" y="20" width="${width-50}" height="${height-50}" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="5,5" rx="4"/>
      <rect x="35" y="30" width="${width-80}" height="15" fill="#8B5CF6" opacity="0.3" rx="2"/>
      <rect x="35" y="50" width="${width-90}" height="12" fill="#8B5CF6" opacity="0.2" rx="2"/>
      <rect x="35" y="67" width="${width-70}" height="12" fill="#8B5CF6" opacity="0.2" rx="2"/>
      <text x="${width/2}" y="${height-15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#8B5CF6">
        ${extension}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate SVG-based thumbnail for audio files
 */
const generateAudioThumbnail = (fileType, { width, height }) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="audioBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#10B981;stop-opacity:0.3" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#audioBg)" rx="8"/>
      <circle cx="${width/2}" cy="${height/2-10}" r="25" fill="none" stroke="#10B981" stroke-width="3"/>
      <path d="M ${width/2-8} ${height/2-18} L ${width/2-8} ${height/2-2} L ${width/2+8} ${height/2-10} Z" fill="#10B981"/>
      <rect x="20" y="${height-35}" width="8" height="15" fill="#10B981" opacity="0.6" rx="2"/>
      <rect x="32" y="${height-40}" width="8" height="20" fill="#10B981" opacity="0.8" rx="2"/>
      <rect x="44" y="${height-30}" width="8" height="10" fill="#10B981" opacity="0.4" rx="2"/>
      <rect x="56" y="${height-45}" width="8" height="25" fill="#10B981" opacity="0.9" rx="2"/>
      <rect x="68" y="${height-35}" width="8" height="15" fill="#10B981" opacity="0.5" rx="2"/>
      <rect x="80" y="${height-42}" width="8" height="22" fill="#10B981" opacity="0.7" rx="2"/>
      <rect x="92" y="${height-28}" width="8" height="8" fill="#10B981" opacity="0.3" rx="2"/>
      <rect x="104" y="${height-38}" width="8" height="18" fill="#10B981" opacity="0.6" rx="2"/>
      <text x="${width/2}" y="${height-8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#10B981">
        AUDIO
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Draw play button overlay on video thumbnails
 */
const drawPlayButton = (ctx, width, height) => {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 8
  
  // Draw semi-transparent circle
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.fill()
  
  // Draw play triangle
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.moveTo(centerX - radius/3, centerY - radius/2)
  ctx.lineTo(centerX - radius/3, centerY + radius/2)
  ctx.lineTo(centerX + radius/2, centerY)
  ctx.closePath()
  ctx.fill()
}

/**
 * Helper functions
 */
const isDocumentType = (fileType) => {
  return fileType.includes('document') || 
         fileType.includes('word') || 
         fileType.includes('spreadsheet') || 
         fileType.includes('excel') || 
         fileType.includes('presentation') || 
         fileType.includes('powerpoint') ||
         fileType.includes('text')
}

const isArchiveType = (fileType) => {
  return fileType.includes('zip') || 
         fileType.includes('rar') || 
         fileType.includes('7z') || 
         fileType.includes('tar')
}

const getDocumentColor = (fileType) => {
  if (fileType.includes('word') || fileType.includes('document')) return '#2563EB'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '#059669'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '#DC2626'
  if (fileType.includes('pdf')) return '#DC2626'
  return '#6B7280'
}

const getDocumentIcon = (fileType) => {
  if (fileType.includes('word') || fileType.includes('document')) return 'DOC'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'XLS'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'PPT'
  if (fileType.includes('pdf')) return 'PDF'
  return 'TXT'
}

const getArchiveExtension = (fileType) => {
  if (fileType.includes('zip')) return 'ZIP'
  if (fileType.includes('rar')) return 'RAR'
  if (fileType.includes('7z')) return '7Z'
  if (fileType.includes('tar')) return 'TAR'
  return 'ARC'
}

/**
 * Batch generate thumbnails for multiple files
 */
export const generateThumbnails = async (files, options = {}) => {
  const results = await Promise.allSettled(
    files.map(file => generateThumbnail(file, options))
  )
  
  return results.map((result, index) => ({
    file: files[index],
    thumbnail: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }))
}

/**
 * Get thumbnail cache key for a file
 */
export const getThumbnailCacheKey = (file) => {
  return `thumbnail_${file.name}_${file.size}_${file.lastModified}`
}

/**
 * Cache thumbnails in localStorage (with size limit)
 */
export const cacheThumbnail = (key, thumbnail) => {
  try {
    const cache = JSON.parse(localStorage.getItem('thumbnailCache') || '{}')
    cache[key] = {
      thumbnail,
      timestamp: Date.now()
    }
    
    // Limit cache size (remove oldest entries if too many)
    const entries = Object.entries(cache)
    if (entries.length > 100) {
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const newCache = {}
      entries.slice(-50).forEach(([k, v]) => newCache[k] = v)
      localStorage.setItem('thumbnailCache', JSON.stringify(newCache))
    } else {
      localStorage.setItem('thumbnailCache', JSON.stringify(cache))
    }
  } catch (error) {
    console.warn('Failed to cache thumbnail:', error)
  }
}

/**
 * Get cached thumbnail
 */
export const getCachedThumbnail = (key) => {
  try {
    const cache = JSON.parse(localStorage.getItem('thumbnailCache') || '{}')
    const cached = cache[key]
    
    if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days
      return cached.thumbnail
    }
    
    return null
  } catch (error) {
    console.warn('Failed to get cached thumbnail:', error)
    return null
  }
}