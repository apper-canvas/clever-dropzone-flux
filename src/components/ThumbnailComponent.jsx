import { ApperIcon } from './ApperIcon'
import { getThumbnailCacheKey } from '../utils/thumbnailGenerator'

const ThumbnailComponent = ({ file, className = "", loadingThumbnails = new Set() }) => {
  const cacheKey = getThumbnailCacheKey(file)
  const isLoading = loadingThumbnails.has(cacheKey)
  
  if (file.thumbnail) {
    return (
      <img 
        src={file.thumbnail} 
        alt={file.name}
        className={`${className} thumbnail-fade-in`}
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextElementSibling?.style.display = 'flex'
        }}
      />
    )
  }
  
  if (isLoading) {
    return (
      <div className={`${className.replace('file-thumbnail', 'thumbnail-placeholder')} thumbnail-loading`}>
        <ApperIcon name="Loader2" className="w-6 h-6 text-surface-400 animate-spin" />
      </div>
    )
  }
  
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'Image'
    if (type.startsWith('video/')) return 'Video'
    if (type.startsWith('audio/')) return 'Music'
    if (type.includes('pdf')) return 'FileText'
    if (type.includes('document') || type.includes('word')) return 'FileText'
    if (type.includes('spreadsheet') || type.includes('excel')) return 'FileSpreadsheet'
    if (type.includes('presentation') || type.includes('powerpoint')) return 'FileImage'
    if (type.includes('zip') || type.includes('rar')) return 'Archive'
    return 'File'
  }
  
  return (
    <div className={`${className.replace('file-thumbnail', 'thumbnail-placeholder')}`}>
      <ApperIcon name={getFileIcon(file.type)} className="w-8 h-8 text-surface-400" />
    </div>
  )
}

export default ThumbnailComponent