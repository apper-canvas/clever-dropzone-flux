import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import ApperIcon from './ApperIcon'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const FileViewer = ({ isOpen, onClose, file, files, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [imageRotation, setImageRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfTotalPages, setPdfTotalPages] = useState(0)
  const [textContent, setTextContent] = useState('')
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState(false)
  
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const pdfCanvasRef = useRef(null)
  const audioRef = useRef(null)
  const isDragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })

  const currentIndex = files.findIndex(f => f.id === file?.id)
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < files.length - 1

  useEffect(() => {
    if (isOpen && file) {
      loadFile()
    } else {
      resetState()
    }
  }, [isOpen, file])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (canNavigatePrev) navigateFile(-1)
          break
        case 'ArrowRight':
          if (canNavigateNext) navigateFile(1)
          break
        case '+':
        case '=':
          if (file?.type.startsWith('image/')) {
            setImageZoom(prev => Math.min(prev * 1.2, 5))
          }
          break
        case '-':
          if (file?.type.startsWith('image/')) {
            setImageZoom(prev => Math.max(prev / 1.2, 0.1))
          }
          break
        case 'r':
          if (file?.type.startsWith('image/')) {
            setImageRotation(prev => (prev + 90) % 360)
          }
          break
        case 'f':
          toggleFullscreen()
          break
        case ' ':
          if (file?.type.startsWith('audio/')) {
            e.preventDefault()
            toggleAudioPlayback()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, file, canNavigatePrev, canNavigateNext])

  const resetState = () => {
    setIsLoading(true)
    setError(null)
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
    setImageRotation(0)
    setIsFullscreen(false)
    setPdfPage(1)
    setPdfTotalPages(0)
    setTextContent('')
    setAudioCurrentTime(0)
    setAudioDuration(0)
    setAudioPlaying(false)
  }

  const loadFile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const fileType = file.type.toLowerCase()

      if (fileType.startsWith('image/')) {
        // Images load automatically via img src
        setIsLoading(false)
      } else if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
        // Media files load automatically via video/audio elements
        setIsLoading(false)
      } else if (fileType === 'application/pdf') {
        await loadPDF()
      } else if (fileType.startsWith('text/') || isTextFile(file.name)) {
        await loadTextFile()
      } else {
        setError('File type not supported for preview')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Error loading file:', err)
      setError('Failed to load file')
      setIsLoading(false)
      toast.error(`Failed to load ${file.name}`)
    }
  }

  const loadPDF = async () => {
    try {
      const response = await fetch(file.url)
      const arrayBuffer = await response.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      setPdfTotalPages(pdf.numPages)
      await renderPDFPage(pdf, 1)
      setIsLoading(false)
    } catch (error) {
      throw new Error('Failed to load PDF')
    }
  }

  const renderPDFPage = async (pdf, pageNumber) => {
    const page = await pdf.getPage(pageNumber)
    const canvas = pdfCanvasRef.current
    const context = canvas.getContext('2d')
    
    const viewport = page.getViewport({ scale: 1.5 })
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    setPdfPage(pageNumber)
  }

  const loadTextFile = async () => {
    try {
      const response = await fetch(file.url)
      const text = await response.text()
      setTextContent(text)
      setIsLoading(false)
    } catch (error) {
      throw new Error('Failed to load text file')
    }
  }

  const isTextFile = (filename) => {
    const textExtensions = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.xml', '.csv']
    return textExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }

  const navigateFile = (direction) => {
    const newIndex = currentIndex + direction
    if (newIndex >= 0 && newIndex < files.length) {
      const newFile = files[newIndex]
      onNavigate(newFile)
      resetState()
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setError('Failed to load image')
    setIsLoading(false)
  }

  const handleWheel = (e) => {
    if (file?.type.startsWith('image/')) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setImageZoom(prev => Math.max(0.1, Math.min(5, prev * delta)))
    }
  }

  const handleMouseDown = (e) => {
    if (file?.type.startsWith('image/') && imageZoom > 1) {
      isDragging.current = true
      lastPosition.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastPosition.current.x
      const deltaY = e.clientY - lastPosition.current.y
      
      setImagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      lastPosition.current = { x: e.clientX, y: e.clientY }
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const resetImageView = () => {
    setImageZoom(1)
    setImagePosition({ x: 0, y: 0 })
    setImageRotation(0)
  }

const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen()
          setIsFullscreen(true)
        } else {
          toast.warn('Fullscreen mode is not available in this environment')
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
          setIsFullscreen(false)
        }
      }
    } catch (error) {
      console.warn('Fullscreen API blocked by permissions policy:', error)
      toast.warn('Fullscreen mode is not available due to browser restrictions')
      setIsFullscreen(false)
    }
  }

  const handlePDFPageChange = async (newPage) => {
    if (newPage >= 1 && newPage <= pdfTotalPages) {
      const response = await fetch(file.url)
      const arrayBuffer = await response.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      await renderPDFPage(pdf, newPage)
    }
  }

  const toggleAudioPlayback = () => {
    const audio = audioRef.current
    if (audio) {
      if (audioPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      setAudioCurrentTime(audio.currentTime)
      setAudioDuration(audio.duration || 0)
    }
  }

  const handleAudioSeek = (e) => {
    const audio = audioRef.current
    if (audio) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      audio.currentTime = percent * audio.duration
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen || !file) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={containerRef}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-white font-medium truncate max-w-md" title={file.name}>
                  {file.name}
                </h3>
                <span className="text-white/70 text-sm">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-white/70 text-sm">
                  {currentIndex + 1} of {files.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Navigation */}
                <button
                  onClick={() => navigateFile(-1)}
                  disabled={!canNavigatePrev}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ApperIcon name="ChevronLeft" className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateFile(1)}
                  disabled={!canNavigateNext}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ApperIcon name="ChevronRight" className="w-5 h-5" />
                </button>
                
                {/* Image Controls */}
                {file.type.startsWith('image/') && (
                  <>
                    <button
                      onClick={() => setImageZoom(prev => Math.min(prev * 1.2, 5))}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      title="Zoom In"
                    >
                      <ApperIcon name="ZoomIn" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setImageZoom(prev => Math.max(prev / 1.2, 0.1))}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      title="Zoom Out"
                    >
                      <ApperIcon name="ZoomOut" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      title="Rotate"
                    >
                      <ApperIcon name="RotateCw" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={resetImageView}
                      className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      title="Reset View"
                    >
                      <ApperIcon name="RotateCcw" className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  title="Toggle Fullscreen"
                >
                  <ApperIcon name={isFullscreen ? "Minimize" : "Maximize"} className="w-5 h-5" />
                </button>
                
                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ApperIcon name="X" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 pt-20">
            {isLoading && (
              <div className="text-white text-center">
                <ApperIcon name="Loader2" className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading file...</p>
              </div>
            )}

            {error && (
              <div className="text-white text-center">
                <ApperIcon name="AlertCircle" className="w-8 h-8 mx-auto mb-2 text-red-400" />
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* Image Viewer */}
                {file.type.startsWith('image/') && (
                  <div className="relative max-w-full max-h-full">
                    <img
                      ref={imageRef}
                      src={file.url}
                      alt={file.name}
                      className="max-w-full max-h-full object-contain cursor-move"
                      style={{
                        transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px) rotate(${imageRotation}deg)`,
                        transition: isDragging.current ? 'none' : 'transform 0.2s ease'
                      }}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      draggable={false}
                    />
                  </div>
                )}

                {/* Video Viewer */}
                {file.type.startsWith('video/') && (
                  <video
                    src={file.url}
                    controls
                    className="max-w-full max-h-full"
                    onLoadedData={() => setIsLoading(false)}
                    onError={() => setError('Failed to load video')}
                  >
                    Your browser does not support video playback.
                  </video>
                )}

                {/* Audio Viewer */}
                {file.type.startsWith('audio/') && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <ApperIcon name="Music" className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-white font-medium truncate">{file.name}</h4>
                    </div>
                    
                    <audio
                      ref={audioRef}
                      src={file.url}
                      onTimeUpdate={handleAudioTimeUpdate}
                      onPlay={() => setAudioPlaying(true)}
                      onPause={() => setAudioPlaying(false)}
                      onLoadedData={() => setIsLoading(false)}
                      onError={() => setError('Failed to load audio')}
                    />
                    
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div 
                        className="w-full h-2 bg-white/20 rounded-full cursor-pointer"
                        onClick={handleAudioSeek}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all"
                          style={{ width: `${(audioCurrentTime / audioDuration) * 100 || 0}%` }}
                        />
                      </div>
                      
                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">
                          {formatTime(audioCurrentTime)}
                        </span>
                        <button
                          onClick={toggleAudioPlayback}
                          className="p-3 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-white hover:scale-105 transition-transform"
                        >
                          <ApperIcon name={audioPlaying ? "Pause" : "Play"} className="w-6 h-6" />
                        </button>
                        <span className="text-white/70 text-sm">
                          {formatTime(audioDuration)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Viewer */}
                {file.type === 'application/pdf' && (
                  <div className="bg-white rounded-lg p-4 max-w-4xl max-h-full overflow-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePDFPageChange(pdfPage - 1)}
                          disabled={pdfPage <= 1}
                          className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ApperIcon name="ChevronLeft" className="w-4 h-4" />
                        </button>
                        <span className="text-sm">
                          Page {pdfPage} of {pdfTotalPages}
                        </span>
                        <button
                          onClick={() => handlePDFPageChange(pdfPage + 1)}
                          disabled={pdfPage >= pdfTotalPages}
                          className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ApperIcon name="ChevronRight" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <canvas ref={pdfCanvasRef} className="mx-auto" />
                  </div>
                )}

                {/* Text Viewer */}
                {(file.type.startsWith('text/') || isTextFile(file.name)) && (
<div className="bg-white rounded-lg p-6 w-full max-w-4xl h-96 text-viewer-scrollable">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {textContent}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* PDF Navigation */}
          {file.type === 'application/pdf' && !isLoading && !error && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePDFPageChange(pdfPage - 1)}
                  disabled={pdfPage <= 1}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ApperIcon name="ChevronLeft" className="w-4 h-4" />
                </button>
                <span className="text-white text-sm px-3">
                  {pdfPage} / {pdfTotalPages}
                </span>
                <button
                  onClick={() => handlePDFPageChange(pdfPage + 1)}
                  disabled={pdfPage >= pdfTotalPages}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ApperIcon name="ChevronRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FileViewer