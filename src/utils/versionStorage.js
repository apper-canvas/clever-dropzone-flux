import { v4 as uuidv4 } from 'uuid'

/**
 * Version storage utility for managing file version history
 */

const VERSION_STORAGE_KEY = 'fileVersionHistory'
const MAX_VERSIONS_PER_FILE = 10
const MAX_TOTAL_STORAGE_MB = 50

/**
 * Create a new version entry for a file
 * @param {Object} file - The file object
 * @param {string} reason - Reason for version creation
 * @param {string} previousContent - Previous file content/URL
 * @returns {Object} Version object
 */
export const createFileVersion = (file, reason = 'File updated', previousContent = null) => {
  return {
    id: uuidv4(),
    fileId: file.id,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    content: previousContent || file.url,
    thumbnail: file.thumbnail || null,
    timestamp: new Date().toISOString(),
    reason: reason,
    version: getNextVersionNumber(file.id)
  }
}

/**
 * Store a new version for a file
 * @param {Object} file - The file object
 * @param {string} reason - Reason for version creation
 * @param {string} previousContent - Previous file content
 */
export const storeFileVersion = (file, reason = 'File updated', previousContent = null) => {
  try {
    const versions = getStoredVersions()
    const fileVersions = versions[file.id] || []
    
    // Create new version
    const newVersion = createFileVersion(file, reason, previousContent)
    
    // Add to file versions
    fileVersions.push(newVersion)
    
    // Keep only the latest versions (remove oldest if exceeding limit)
    if (fileVersions.length > MAX_VERSIONS_PER_FILE) {
      fileVersions.splice(0, fileVersions.length - MAX_VERSIONS_PER_FILE)
    }
    
    // Update storage
    versions[file.id] = fileVersions
    
    // Check total storage size and cleanup if needed
    cleanupStorageIfNeeded(versions)
    
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions))
    
    return newVersion
  } catch (error) {
    console.error('Error storing file version:', error)
    return null
  }
}

/**
 * Get version history for a specific file
 * @param {string} fileId - The file ID
 * @returns {Array} Array of version objects
 */
export const getFileVersionHistory = (fileId) => {
  try {
    const versions = getStoredVersions()
    return (versions[fileId] || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  } catch (error) {
    console.error('Error getting file version history:', error)
    return []
  }
}

/**
 * Get a specific version by ID
 * @param {string} fileId - The file ID
 * @param {string} versionId - The version ID
 * @returns {Object|null} Version object or null
 */
export const getFileVersion = (fileId, versionId) => {
  try {
    const versions = getFileVersionHistory(fileId)
    return versions.find(v => v.id === versionId) || null
  } catch (error) {
    console.error('Error getting file version:', error)
    return null
  }
}

/**
 * Restore a specific version of a file
 * @param {string} fileId - The file ID
 * @param {string} versionId - The version ID to restore
 * @param {Object} currentFile - Current file object
 * @returns {Object|null} Restored version data
 */
export const restoreFileVersion = (fileId, versionId, currentFile) => {
  try {
    const version = getFileVersion(fileId, versionId)
    if (!version) {
      throw new Error('Version not found')
    }
    
    // Store current version before restoring
    storeFileVersion(currentFile, 'Pre-restore backup')
    
    // Return the version data for restoration
    return {
      content: version.content,
      thumbnail: version.thumbnail,
      metadata: {
        restoredFrom: version.timestamp,
        originalReason: version.reason,
        restoredAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error restoring file version:', error)
    return null
  }
}

/**
 * Delete all versions for a specific file
 * @param {string} fileId - The file ID
 */
export const deleteFileVersions = (fileId) => {
  try {
    const versions = getStoredVersions()
    delete versions[fileId]
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions))
  } catch (error) {
    console.error('Error deleting file versions:', error)
  }
}

/**
 * Get total storage statistics
 * @returns {Object} Storage statistics
 */
export const getStorageStats = () => {
  try {
    const versions = getStoredVersions()
    let totalVersions = 0
    let totalFiles = 0
    let estimatedSize = 0
    
    Object.keys(versions).forEach(fileId => {
      totalFiles++
      const fileVersions = versions[fileId]
      totalVersions += fileVersions.length
      
      // Estimate size (this is rough since we're storing URLs, not actual file content)
      fileVersions.forEach(version => {
        estimatedSize += version.fileSize || 0
      })
    })
    
    return {
      totalFiles,
      totalVersions,
      estimatedSizeMB: Math.round(estimatedSize / (1024 * 1024) * 100) / 100,
      storageUsed: new Blob([localStorage.getItem(VERSION_STORAGE_KEY) || '']).size
    }
  } catch (error) {
    console.error('Error getting storage stats:', error)
    return { totalFiles: 0, totalVersions: 0, estimatedSizeMB: 0, storageUsed: 0 }
  }
}

/**
 * Clean up old versions if storage is getting full
 * @param {Object} versions - Current versions object
 */
const cleanupStorageIfNeeded = (versions) => {
  const stats = getStorageStats()
  
  if (stats.estimatedSizeMB > MAX_TOTAL_STORAGE_MB) {
    // Remove oldest versions from files with most versions
    const fileVersionCounts = Object.keys(versions).map(fileId => ({
      fileId,
      count: versions[fileId].length,
      oldestTimestamp: Math.min(...versions[fileId].map(v => new Date(v.timestamp).getTime()))
    }))
    
    // Sort by version count (descending) then by oldest timestamp
    fileVersionCounts.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.oldestTimestamp - b.oldestTimestamp
    })
    
    // Remove oldest versions from files with most versions
    fileVersionCounts.forEach(({ fileId }) => {
      if (versions[fileId] && versions[fileId].length > 3) {
        versions[fileId].shift() // Remove oldest version
      }
    })
  }
}

/**
 * Get stored versions from localStorage
 * @returns {Object} Versions object
 */
const getStoredVersions = () => {
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error parsing stored versions:', error)
    return {}
  }
}

/**
 * Get next version number for a file
 * @param {string} fileId - The file ID
 * @returns {number} Next version number
 */
const getNextVersionNumber = (fileId) => {
  const versions = getFileVersionHistory(fileId)
  return versions.length > 0 ? Math.max(...versions.map(v => v.version || 0)) + 1 : 1
}

/**
 * Export all version data (for backup purposes)
 * @returns {Object} All version data
 */
export const exportVersionData = () => {
  return getStoredVersions()
}

/**
 * Import version data (for restore purposes)
 * @param {Object} versionData - Version data to import
 */
export const importVersionData = (versionData) => {
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versionData))
    return true
  } catch (error) {
    console.error('Error importing version data:', error)
    return false
  }
}