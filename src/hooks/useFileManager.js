import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { storeFileVersion } from '../utils/versionStorage'

export const useFileManager = () => {
  const [files, setFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('root')
  const [folders, setFolders] = useState([
    { id: 'root', name: 'My Files', parentId: null, fileCount: 0, totalSize: 0 },
    { id: 'documents', name: 'Documents', parentId: 'root', fileCount: 0, totalSize: 0 },
    { id: 'images', name: 'Images', parentId: 'root', fileCount: 0, totalSize: 0 },
    { id: 'videos', name: 'Videos', parentId: 'root', fileCount: 0, totalSize: 0 }
  ])

  const validateFile = useCallback((file) => {
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
  }, [])

  const simulateUpload = useCallback(async (file, generateThumbnail) => {
    return new Promise(async (resolve) => {
      let progress = 0
      const uploadId = Date.now() + Math.random()
      
      setUploadingFiles(prev => [...prev, {
        id: uploadId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading',
        thumbnail: null
      }])

      const thumbnailPromise = generateThumbnail(file)

      const interval = setInterval(async () => {
        progress += Math.random() * 15 + 5
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          const thumbnail = await thumbnailPromise
          
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
            downloadCount: 0,
            thumbnail: thumbnail
          }
          
          setFiles(prev => [...prev, newFile])
          toast.success(`${file.name} uploaded successfully!${thumbnail ? ' Thumbnail generated!' : ''}`)
          resolve(newFile)
        } else {
          setUploadingFiles(prev => prev.map(f => 
            f.id === uploadId ? { ...f, progress } : f
          ))
        }
      }, 200)
    })
  }, [selectedFolder])

  const handleFiles = useCallback(async (fileList, generateThumbnail) => {
    const validFiles = Array.from(fileList).filter(validateFile)
    
    if (validFiles.length === 0) return
    
    toast.info(`Starting upload of ${validFiles.length} file(s)...`)
    
    for (const file of validFiles) {
      await simulateUpload(file, generateThumbnail)
    }
  }, [validateFile, simulateUpload])

  const deleteFile = useCallback((fileId) => {
    const file = files.find(f => f.id === fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
    toast.success(`${file.name} deleted successfully!`)
  }, [files])

  const downloadFile = useCallback((file) => {
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
  }, [])

  const createFolder = useCallback((folderName) => {
    if (!folderName.trim()) {
      toast.error('Please enter a folder name')
      return false
    }
    
    const newFolder = {
      id: Date.now().toString(),
      name: folderName.trim(),
      parentId: selectedFolder,
      fileCount: 0,
      totalSize: 0,
      createdDate: new Date()
    }
    
    setFolders(prev => [...prev, newFolder])
    toast.success(`Folder "${newFolder.name}" created successfully!`)
    return true
  }, [selectedFolder])

  const cancelUpload = useCallback((uploadId) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== uploadId))
    toast.info('Upload cancelled')
  }, [])

  const handleFileUpdate = useCallback((updatedFile) => {
    const currentFile = files.find(f => f.id === updatedFile.id)
    if (currentFile) {
      storeFileVersion(currentFile, 'File updated')
    }

    setFiles(prev => prev.map(f => 
      f.id === updatedFile.id ? updatedFile : f
    ))
    
    toast.success('File updated successfully!')
  }, [files])

  const getCurrentFolderFiles = useCallback(() => {
    return files.filter(file => file.folderId === selectedFolder)
  }, [files, selectedFolder])

  const getCurrentSubfolders = useCallback(() => {
    return folders.filter(folder => folder.parentId === selectedFolder)
  }, [folders, selectedFolder])

  const getBreadcrumb = useCallback(() => {
    const currentFolder = folders.find(f => f.id === selectedFolder)
    const breadcrumb = []
    let folder = currentFolder
    while (folder) {
      breadcrumb.unshift(folder)
      folder = folders.find(f => f.id === folder.parentId)
    }
    return breadcrumb
  }, [folders, selectedFolder])

  return {
    files,
    setFiles,
    uploadingFiles,
    selectedFolder,
    setSelectedFolder,
    folders,
    handleFiles,
    deleteFile,
    downloadFile,
    createFolder,
    cancelUpload,
    handleFileUpdate,
    getCurrentFolderFiles,
    getCurrentSubfolders,
    getBreadcrumb
  }
}