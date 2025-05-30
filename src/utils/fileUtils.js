export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileIcon = (type) => {
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

export const isViewableFile = (file) => {
  const viewableTypes = [
    'image/', 'video/', 'audio/', 'application/pdf', 'text/'
  ]
  return viewableTypes.some(type => file.type.startsWith(type)) || 
         isTextFile(file.name)
}

export const isTextFile = (filename) => {
  const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.xml', '.csv']
  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

export const sortFiles = (files, sortBy) => {
  return [...files].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        return new Date(b.uploadDate) - new Date(a.uploadDate)
      case 'size':
        return b.size - a.size
      case 'type':
        return a.type.localeCompare(b.type)
      default:
        return 0
    }
  })
}