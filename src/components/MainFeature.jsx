import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { formatDistance } from 'date-fns'
import ApperIcon from './ApperIcon'

const MainFeature = () => {
  const [files, setFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('root')
  const [folders, setFolders] = useState([
    { id: 'root', name: 'My Files', parentId: null, fileCount: 0, totalSize: 0 },
    { id: 'documents', name: 'Documents', parentId: 'root', fileCount: 0, totalSize: 0 },
    { id: 'images', name: 'Images', parentId: 'root', fileCount: 0, totalSize: 0 },
    { id: 'videos', name: 'Videos', parentId: 'root', fileCount: 0, totalSize: 0 }
  ])
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const fileInputRef = useRef(null)

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const validateFile = (file) => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = [
      'image/', 'video/', 'audio/', 'application/pdf', 
      'application/msword', 'application/vnd.openxmlformats',
      'text/', 'application/zip', 'application/x-rar'
    ]
    
    if (file.size > maxSize) {
      toast.error(`File ${file.name} is too large. Maximum size is 100MB.`)
      return false
    }
    
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type))
    if (!isAllowed) {
      toast.error(`File type ${file.type} is not supported.`)
      return false
    }
    
    return true
  }

  const simulateUpload = (file) => {
    return new Promise((resolve) => {
      let progress = 0
      const uploadId = Date.now() + Math.random()
      
      setUploadingFiles(prev => [...prev, {
        id: uploadId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading'
      }])

      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
          
          const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            lastModified: new Date(file.lastModified),
            folderId: selectedFolder,
            url: URL.createObjectURL(file),
            isPublic: false,
            downloadCount: 0
          }
          
          setFiles(prev => [...prev, newFile])
          toast.success(`${file.name} uploaded successfully!`)
          resolve(newFile)
        } else {
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId ? { ...f, progress } : f
          ))
        }
      }, 200)
    })
  }

  const handleFiles = async (fileList) => {
    const validFiles = Array.from(fileList).filter(validateFile)
    
    if (validFiles.length === 0) return
    
    toast.info(`Starting upload of ${validFiles.length} file(s)...`)
    
    for (const file of validFiles) {
      await simulateUpload(file)
    }
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [selectedFolder])

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const deleteFile = (fileId) => {
    const file = files.find(f => f.id === fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success(`${file.name} deleted successfully!`)
  }

  const downloadFile = (file) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.click()
    
    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, downloadCount: f.downloadCount + 1 }
        : f
    ))
    toast.info(`Downloading ${file.name}...`)
  }

  const createFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name')
      return
    }
    
    const newFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      parentId: selectedFolder,
      fileCount: 0,
      totalSize: 0,
      createdDate: new Date()
    }
    
    setFolders(prev => [...prev, newFolder])
    setNewFolderName('')
    setShowNewFolderInput(false)
    toast.success(`Folder "${newFolder.name}" created successfully!`)
  }

  const cancelUpload = (uploadId) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
    toast.info('Upload cancelled')
  }

  const getCurrentFolderFiles = () => {
    return files.filter(file => file.folderId === selectedFolder)
  }

  const getCurrentSubfolders = () => {
    return folders.filter(folder => folder.parentId === selectedFolder)
  }

  const sortedFiles = getCurrentFolderFiles().sort((a, b) => {
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

  const currentFolder = folders.find(f => f.id === selectedFolder)
  const breadcrumb = []
  let folder = currentFolder
  while (folder) {
    breadcrumb.unshift(folder)
    folder = folders.find(f => f.id === folder.parentId)
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-white/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-surface-800">File Manager</h2>
            <div className="flex items-center space-x-2 text-sm text-surface-600">
              {breadcrumb.map((folder, index) => (
                <div key={folder.id} className="flex items-center space-x-2">
                  {index > 0 && <ApperIcon name="ChevronRight" className="w-4 h-4" />}
                  <button 
                    onClick={() => setSelectedFolder(folder.id)}
                    className="hover:text-primary transition-colors"
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg neu-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
              <option value="type">Sort by Type</option>
            </select>
            
            <div className="flex rounded-lg overflow-hidden neu-button">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-surface-600'}`}
              >
                <ApperIcon name="Grid3X3" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-surface-600'}`}
              >
                <ApperIcon name="List" className="w-4 h-4" />
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ApperIcon name="FolderPlus" className="w-4 h-4" />
              <span className="hidden sm:inline">New Folder</span>
            </motion.button>
          </div>
        </div>

        {/* New Folder Input */}
        <AnimatePresence>
          {showNewFolderInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="flex-1 px-4 py-2 rounded-lg border border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              />
              <div className="flex gap-2">
                <button
                  onClick={createFolder}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewFolderInput(false)
                    setNewFolderName('')
                  }}
                  className="px-4 py-2 border border-surface-300 text-surface-600 rounded-lg hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? 'dropzone-active border-primary bg-primary/5' 
            : 'border-surface-300 hover:border-primary/50 hover:bg-primary/2'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 sm:p-12 text-center">
          <motion.div
            animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
          >
            <ApperIcon name="Upload" className="w-8 h-8 text-white" />
          </motion.div>
          
          <h3 className="text-xl font-semibold text-surface-800 mb-2">
            {dragActive ? 'Drop files here!' : 'Upload your files'}
          </h3>
          <p className="text-surface-600 mb-6">
            Drag and drop files here, or click to browse
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ApperIcon name="Plus" className="w-5 h-5" />
            <span>Choose Files</span>
          </motion.button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
          />
          
          <p className="text-xs text-surface-500 mt-4">
            Max file size: 100MB. Supported: Images, Videos, Documents, Archives
          </p>
        </div>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-lg font-semibold text-surface-800 mb-4 flex items-center space-x-2">
              <ApperIcon name="Upload" className="w-5 h-5 text-primary" />
              <span>Uploading Files</span>
            </h3>
            <div className="space-y-3">
              {uploadingFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-800">{file.name}</span>
                      <button
                        onClick={() => cancelUpload(file.id)}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <ApperIcon name="X" className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-full bg-surface-200 rounded-full h-2">
                      <motion.div
                        className="progress-bar h-2 rounded-full"
                        style={{ width: `${file.progress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-surface-500 mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{Math.round(file.progress)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files and Folders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6 border border-white/20"
      >
        {getCurrentSubfolders().length === 0 && sortedFiles.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center"
            >
              <ApperIcon name="FolderOpen" className="w-8 h-8 text-surface-400" />
            </motion.div>
            <h3 className="text-lg font-medium text-surface-600 mb-2">No files yet</h3>
            <p className="text-surface-500">Upload your first file to get started</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
          }>
            {/* Folders */}
            {getCurrentSubfolders().map((folder) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`file-item p-4 rounded-xl cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : 'text-center'
                }`}
                onClick={() => setSelectedFolder(folder.id)}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center ${
                  viewMode === 'list' ? 'flex-shrink-0' : 'mx-auto mb-3'
                }`}>
                  <ApperIcon name="Folder" className="w-6 h-6 text-white" />
                </div>
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <h4 className="font-medium text-surface-800 truncate">{folder.name}</h4>
                  <p className="text-sm text-surface-500">
                    {folder.fileCount} files
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Files */}
            {sortedFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`file-item p-4 rounded-xl ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : 'text-center'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center ${
                  viewMode === 'list' ? 'flex-shrink-0' : 'mx-auto mb-3'
                }`}>
                  <ApperIcon name={getFileIcon(file.type)} className="w-6 h-6 text-white" />
                </div>
                <div className={`${viewMode === 'list' ? 'flex-1 min-w-0' : ''}`}>
                  <h4 className="font-medium text-surface-800 truncate" title={file.name}>
                    {file.name}
                  </h4>
                  <p className="text-sm text-surface-500">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-surface-400">
                    {formatDistance(file.uploadDate, new Date(), { addSuffix: true })}
                  </p>
                </div>
                <div className={`flex items-center space-x-2 ${
                  viewMode === 'list' ? '' : 'mt-3 justify-center'
                }`}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => downloadFile(file)}
                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                  >
                    <ApperIcon name="Download" className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteFile(file.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <ApperIcon name="Trash2" className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MainFeature