import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistance } from 'date-fns'
import ApperIcon from './ApperIcon'
import FileDetailsModal from './FileDetailsModal'
import FileViewer from './FileViewer'
import ThumbnailComponent from './ThumbnailComponent'
import { useFileManager } from '../hooks/useFileManager'
import { useThumbnails } from '../hooks/useThumbnails'
import { formatFileSize, isViewableFile, sortFiles } from '../utils/fileUtils'

const MainFeature = () => {
  const [dragActive, setDragActive] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [showFileDetails, setShowFileDetails] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [viewerFile, setViewerFile] = useState(null)
  
  const fileInputRef = useRef(null)
  
  const {
    uploadingFiles,
    selectedFolder,
    setSelectedFolder,
    handleFiles,
    deleteFile,
    downloadFile,
    createFolder,
    cancelUpload,
    handleFileUpdate,
    getCurrentFolderFiles,
    getCurrentSubfolders,
    getBreadcrumb
  } = useFileManager()
  
  const { loadingThumbnails, generateFileThumbnail } = useThumbnails(viewMode)
  
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
      handleFiles(e.dataTransfer.files, generateFileThumbnail)
    }
  }, [handleFiles, generateFileThumbnail])

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files, generateFileThumbnail)
    }
  }, [handleFiles, generateFileThumbnail])

  const handleCreateFolder = useCallback(() => {
    if (createFolder(newFolderName)) {
      setNewFolderName('')
      setShowNewFolderInput(false)
    }
  }, [createFolder, newFolderName])

  const openFileDetails = useCallback((file) => {
    setSelectedFile(file)
    setShowFileDetails(true)
  }, [])

  const closeFileDetails = useCallback(() => {
    setShowFileDetails(false)
    setSelectedFile(null)
  }, [])

  const openFileViewer = useCallback((file) => {
    setViewerFile(file)
    setShowFileViewer(true)
  }, [])

  const closeFileViewer = useCallback(() => {
    setShowFileViewer(false)
    setViewerFile(null)
  }, [])

  const handleViewerNavigate = useCallback((newFile) => {
    setViewerFile(newFile)
  }, [])

  const sortedFiles = sortFiles(getCurrentFolderFiles(), sortBy)
  const subfolders = getCurrentSubfolders()
  const breadcrumb = getBreadcrumb()

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
            <nav className="flex items-center space-x-2 text-sm text-surface-600" aria-label="Breadcrumb">
              {breadcrumb.map((folder, index) => (
                <div key={folder.id} className="flex items-center space-x-2">
                  {index > 0 && <ApperIcon name="ChevronRight" className="w-4 h-4" />}
                  <button 
                    onClick={() => setSelectedFolder(folder.id)}
                    className="hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-1"
                    aria-current={index === breadcrumb.length - 1 ? 'page' : undefined}
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg neu-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Sort files by"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="size">Sort by Size</option>
              <option value="type">Sort by Type</option>
            </select>
            
            <div className="flex rounded-lg overflow-hidden neu-button" role="group" aria-label="View mode">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-surface-600'}`}
                aria-pressed={viewMode === 'grid'}
                title="Grid view"
              >
                <ApperIcon name="Grid3X3" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-surface-600'}`}
                aria-pressed={viewMode === 'list'}
                title="List view"
              >
                <ApperIcon name="List" className="w-4 h-4" />
              </button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewFolderInput(!showNewFolderInput)}
              className="flex items-center space-x-2 px-4 py-2 bg-secondary text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/50"
              aria-expanded={showNewFolderInput}
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
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                aria-label="New folder name"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewFolderInput(false)
                    setNewFolderName('')
                  }}
                  className="px-4 py-2 border border-surface-300 text-surface-600 rounded-lg hover:bg-surface-50 transition-colors focus:outline-none focus:ring-2 focus:ring-surface-300"
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
        role="button"
        tabIndex={0}
        aria-label="File upload area"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
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
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            aria-label="File input"
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
                        className="text-surface-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                        title="Cancel upload"
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
        {subfolders.length === 0 && sortedFiles.length === 0 ? (
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
            {subfolders.map((folder) => (
              <motion.div
                key={folder.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`file-item p-4 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : 'text-center'
                }`}
                onClick={() => setSelectedFolder(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedFolder(folder.id)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open folder ${folder.name}`}
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
                {/* Thumbnail */}
                <div className={viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}>
                  <ThumbnailComponent 
                    file={file}
                    className={viewMode === 'grid' ? 'file-thumbnail-grid' : 'file-thumbnail'}
                    loadingThumbnails={loadingThumbnails}
                  />
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
                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                    title="Download file"
                    aria-label={`Download ${file.name}`}
                  >
                    <ApperIcon name="Download" className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteFile(file.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                    title="Delete file"
                    aria-label={`Delete ${file.name}`}
                  >
                    <ApperIcon name="Trash2" className="w-4 h-4" />
                  </motion.button>
                  
                  {isViewableFile(file) && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openFileViewer(file)}
                      className="p-2 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                      title="View file"
                      aria-label={`View ${file.name}`}
                    >
                      <ApperIcon name="Eye" className="w-4 h-4" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openFileDetails(file)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
                    title="View file details"
                    aria-label={`View details for ${file.name}`}
                  >
                    <ApperIcon name="Info" className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* File Details Modal */}
      <FileDetailsModal
        isOpen={showFileDetails}
        onClose={closeFileDetails}
        file={selectedFile}
        onFileUpdate={handleFileUpdate}
      />

      {/* File Viewer */}
      <FileViewer
        isOpen={showFileViewer}
        onClose={closeFileViewer}
        file={viewerFile}
        files={sortedFiles}
        onNavigate={handleViewerNavigate}
      />
    </div>
  )
}

export default MainFeature