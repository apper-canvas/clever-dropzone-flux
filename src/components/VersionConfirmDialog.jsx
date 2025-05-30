import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import ApperIcon from './ApperIcon'

const VersionConfirmDialog = ({ isOpen, onConfirm, onCancel, version, currentFile }) => {
  if (!isOpen || !version || !currentFile) return null

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <ApperIcon name="AlertTriangle" className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-800">Restore File Version</h3>
              <p className="text-sm text-surface-500">This action cannot be undone</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <ApperIcon name="AlertCircle" className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Warning:</p>
                <p>
                  Restoring this version will replace the current file. The current version will be saved 
                  as a backup before the restore operation.
                </p>
              </div>
            </div>
          </div>

          {/* Version Comparison */}
          <div className="space-y-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-surface-700 mb-2">Current Version</h4>
              <div className="bg-surface-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-600">Size:</span>
                  <span className="text-surface-800 font-medium">{formatFileSize(currentFile.size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-surface-600">Modified:</span>
                  <span className="text-surface-800 font-medium">
                    {format(currentFile.lastModified, 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ApperIcon name="ArrowDown" className="w-5 h-5 text-surface-400" />
            </div>

            <div>
              <h4 className="text-sm font-medium text-surface-700 mb-2">Restore To Version</h4>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-600">Version:</span>
                  <span className="text-primary font-medium">v{version.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-surface-600">Size:</span>
                  <span className="text-surface-800 font-medium">{formatFileSize(version.fileSize)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-surface-600">Created:</span>
                  <span className="text-surface-800 font-medium">
                    {format(new Date(version.timestamp), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {version.reason && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-surface-600">Reason:</span>
                    <span className="text-surface-800 font-medium">{version.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-surface-300 text-surface-700 rounded-lg hover:bg-surface-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Restore Version
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default VersionConfirmDialog