import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { formatDistance, format } from 'date-fns'
import ApperIcon from './ApperIcon'
import VersionConfirmDialog from './VersionConfirmDialog'
import { 
  getFileVersionHistory, 
  restoreFileVersion, 
  getStorageStats 
} from '../utils/versionStorage'

const FileDetailsModal = ({ isOpen, onClose, file, onFileUpdate }) => {
  const [activeTab, setActiveTab] = useState('details')
  const [versionHistory, setVersionHistory] = useState([])
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [storageStats, setStorageStats] = useState({})

  useEffect(() => {
    if (isOpen && file) {
      loadVersionHistory()
      loadStorageStats()
    }
  }, [isOpen, file])

  const loadVersionHistory = () => {
    if (file) {
      const history = getFileVersionHistory(file.id)
      setVersionHistory(history)
    }
  }

  const loadStorageStats = () => {
    const stats = getStorageStats()
    setStorageStats(stats)
  }

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

  const handleRestoreVersion = (version) => {
    setSelectedVersion(version)
    setShowRestoreConfirm(true)
  }

  const confirmRestore = async () => {
    if (!selectedVersion || !file) return

    try {
      const restoredData = restoreFileVersion(file.id, selectedVersion.id, file)
      
      if (restoredData) {
        // Update the file with restored content
        const updatedFile = {
          ...file,
          url: restoredData.content,
          thumbnail: restoredData.thumbnail,
          lastModified: new Date(),
          restoredFrom: restoredData.metadata.restoredFrom
        }
        
        onFileUpdate(updatedFile)
        loadVersionHistory() // Refresh version history
        toast.success(`File restored to version from ${format(new Date(selectedVersion.timestamp), 'MMM dd, yyyy HH:mm')}`)
      } else {
        toast.error('Failed to restore file version')
      }
    } catch (error) {
      console.error('Error restoring version:', error)
      toast.error('Error restoring file version')
    }
    
    setShowRestoreConfirm(false)
    setSelectedVersion(null)
  }

  const cancelRestore = () => {
    setShowRestoreConfirm(false)
    setSelectedVersion(null)
  }

  if (!isOpen || !file) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <ApperIcon name={getFileIcon(file.type)} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-surface-800 truncate max-w-md" title={file.name}>
                    {file.name}
                  </h2>
                  <p className="text-sm text-surface-500">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <ApperIcon name="X" className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-surface-200">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-surface-600 hover:text-surface-800'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'versions'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-surface-600 hover:text-surface-800'
                }`}
              >
                Version History ({versionHistory.length})
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* File Preview */}
                  {file.thumbnail && (
                    <div className="text-center">
                      <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="max-w-sm max-h-64 mx-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  {/* File Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-surface-800">File Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-surface-600">Name:</span>
                          <span className="text-surface-800 font-medium">{file.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Size:</span>
                          <span className="text-surface-800 font-medium">{formatFileSize(file.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Type:</span>
                          <span className="text-surface-800 font-medium">{file.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Uploaded:</span>
                          <span className="text-surface-800 font-medium">
                            {format(file.uploadDate, 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Modified:</span>
                          <span className="text-surface-800 font-medium">
                            {format(file.lastModified, 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Downloads:</span>
                          <span className="text-surface-800 font-medium">{file.downloadCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-surface-800">Version Statistics</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-surface-600">Total Versions:</span>
                          <span className="text-surface-800 font-medium">{versionHistory.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-surface-600">Current Version:</span>
                          <span className="text-surface-800 font-medium">
                            v{Math.max(...versionHistory.map(v => v.version || 0), 0) + 1} (Current)
                          </span>
                        </div>
                        {file.restoredFrom && (
                          <div className="flex justify-between">
                            <span className="text-surface-600">Restored From:</span>
                            <span className="text-surface-800 font-medium">
                              {format(new Date(file.restoredFrom), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <h4 className="text-md font-medium text-surface-700 mb-2">Storage Overview</h4>
                        <div className="text-sm text-surface-600 space-y-1">
                          <div>Total Files: {storageStats.totalFiles}</div>
                          <div>Total Versions: {storageStats.totalVersions}</div>
                          <div>Storage Used: {storageStats.estimatedSizeMB} MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-surface-800">Version History</h3>
                    <div className="text-sm text-surface-500">
                      {versionHistory.length} version{versionHistory.length !== 1 ? 's' : ''} stored
                    </div>
                  </div>

                  {versionHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
                        <ApperIcon name="History" className="w-8 h-8 text-surface-400" />
                      </div>
                      <h4 className="text-lg font-medium text-surface-600 mb-2">No Version History</h4>
                      <p className="text-surface-500">This file doesn't have any previous versions yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Current Version */}
                      <div className="version-card p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                              <ApperIcon name="FileCheck" className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-surface-800">
                                Current Version (v{Math.max(...versionHistory.map(v => v.version || 0), 0) + 1})
                              </div>
                              <div className="text-sm text-surface-600">
                                {formatFileSize(file.size)} • {formatDistance(file.lastModified, new Date(), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium bg-primary text-white rounded">
                              CURRENT
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Previous Versions */}
                      {versionHistory.map((version, index) => (
                        <motion.div
                          key={version.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="version-card p-4 rounded-lg border border-surface-200 hover:border-surface-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center">
                                <ApperIcon name="History" className="w-5 h-5 text-surface-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-surface-800">
                                    Version {version.version || index + 1}
                                  </span>
                                  {version.reason && (
                                    <span className="text-xs px-2 py-1 bg-surface-100 text-surface-600 rounded">
                                      {version.reason}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-surface-600">
                                  {formatFileSize(version.fileSize)} • {format(new Date(version.timestamp), 'MMM dd, yyyy HH:mm')}
                                </div>
                                <div className="text-xs text-surface-500">
                                  {formatDistance(new Date(version.timestamp), new Date(), { addSuffix: true })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {version.thumbnail && (
                                <img
                                  src={version.thumbnail}
                                  alt="Version thumbnail"
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRestoreVersion(version)}
                                className="px-3 py-1 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                              >
                                Restore
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Restore Confirmation Dialog */}
      <VersionConfirmDialog
        isOpen={showRestoreConfirm}
        onConfirm={confirmRestore}
        onCancel={cancelRestore}
        version={selectedVersion}
        currentFile={file}
      />
    </>
  )
}

export default FileDetailsModal