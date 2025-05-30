import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'
import { format, subDays, startOfDay } from 'date-fns'
import ApperIcon from '../components/ApperIcon'
import { formatFileSize } from '../utils/fileUtils'

const Dashboard = () => {
  const [files] = useState(() => {
    // Get files from localStorage for demo purposes
    const storedFiles = localStorage.getItem('uploadedFiles')
    return storedFiles ? JSON.parse(storedFiles) : []
  })

  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    recentUploads: []
  })

  useEffect(() => {
    // Calculate statistics from files
    const totalFiles = files.length
    const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0)
    
    const fileTypes = files.reduce((acc, file) => {
      const type = file.type ? file.type.split('/')[0] : 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const recentUploads = files
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 5)

    setStats({ totalFiles, totalSize, fileTypes, recentUploads })
  }, [files])

  // Chart configurations
  const fileTypeChartOptions = {
    chart: {
      type: 'donut',
      height: 300,
      fontFamily: 'Inter, sans-serif'
    },
    labels: Object.keys(stats.fileTypes).map(type => 
      type.charAt(0).toUpperCase() + type.slice(1)
    ),
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
    legend: {
      position: 'bottom',
      fontSize: '12px'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }

  const uploadTrendOptions = {
    chart: {
      type: 'area',
      height: 300,
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false
      }
    },
    xaxis: {
      categories: Array.from({ length: 7 }, (_, i) => 
        format(subDays(new Date(), 6 - i), 'MMM dd')
      )
    },
    yaxis: {
      title: {
        text: 'Files Uploaded'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.1,
      }
    },
    colors: ['#3B82F6'],
    stroke: {
      curve: 'smooth',
      width: 2
    }
  }

  // Mock upload trend data
  const uploadTrendSeries = [{
    name: 'Files Uploaded',
    data: [2, 5, 3, 8, 4, 6, 7]
  }]

  const quickActions = [
    {
      title: 'Upload Files',
      description: 'Add new files to your storage',
      icon: 'Upload',
      color: 'bg-blue-500',
      link: '/'
    },
    {
      title: 'Create Folder',
      description: 'Organize your files better',
      icon: 'FolderPlus',
      color: 'bg-purple-500',
      link: '/'
    },
    {
      title: 'View All Files',
      description: 'Browse your file collection',
      icon: 'Files',
      color: 'bg-green-500',
      link: '/'
    },
    {
      title: 'Storage Settings',
      description: 'Manage your storage options',
      icon: 'Settings',
      color: 'bg-orange-500',
      link: '/'
    }
  ]

  const recentActivities = [
    {
      action: 'Uploaded',
      fileName: 'document.pdf',
      time: '2 minutes ago',
      icon: 'Upload',
      color: 'text-blue-500'
    },
    {
      action: 'Created folder',
      fileName: 'Projects',
      time: '1 hour ago',
      icon: 'FolderPlus',
      color: 'text-purple-500'
    },
    {
      action: 'Deleted',
      fileName: 'old-image.jpg',
      time: '3 hours ago',
      icon: 'Trash2',
      color: 'text-red-500'
    },
    {
      action: 'Downloaded',
      fileName: 'report.xlsx',
      time: '1 day ago',
      icon: 'Download',
      color: 'text-green-500'
    }
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-surface-800 mb-2">Dashboard</h1>
              <p className="text-surface-600">Welcome back! Here's an overview of your file storage.</p>
            </div>
            <Link
              to="/"
              className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ApperIcon name="ArrowLeft" className="w-4 h-4" />
              <span>Back to Files</span>
            </Link>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass-card p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-600 text-sm font-medium">Total Files</p>
                <p className="text-2xl font-bold text-surface-800">{stats.totalFiles}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ApperIcon name="Files" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-600 text-sm font-medium">Storage Used</p>
                <p className="text-2xl font-bold text-surface-800">{formatFileSize(stats.totalSize)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ApperIcon name="HardDrive" className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-600 text-sm font-medium">File Types</p>
                <p className="text-2xl font-bold text-surface-800">{Object.keys(stats.fileTypes).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ApperIcon name="FileType" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-surface-600 text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold text-surface-800">+{Math.floor(stats.totalFiles * 0.3)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <ApperIcon name="TrendingUp" className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* File Type Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-2xl border border-white/20"
            >
              <h3 className="text-lg font-semibold text-surface-800 mb-4">File Type Distribution</h3>
              {Object.keys(stats.fileTypes).length > 0 ? (
                <Chart
                  options={fileTypeChartOptions}
                  series={Object.values(stats.fileTypes)}
                  type="donut"
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-surface-500">
                  <div className="text-center">
                    <ApperIcon name="PieChart" className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No files to display</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Upload Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-2xl border border-white/20"
            >
              <h3 className="text-lg font-semibold text-surface-800 mb-4">Upload Trends (Last 7 Days)</h3>
              <Chart
                options={uploadTrendOptions}
                series={uploadTrendSeries}
                type="area"
                height={300}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 rounded-2xl border border-white/20"
            >
              <h3 className="text-lg font-semibold text-surface-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors group"
                  >
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <ApperIcon name={action.icon} className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-surface-800">{action.title}</p>
                      <p className="text-xs text-surface-600">{action.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 rounded-2xl border border-white/20"
            >
              <h3 className="text-lg font-semibold text-surface-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2">
                    <div className={`w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center`}>
                      <ApperIcon name={activity.icon} className={`w-4 h-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-800">
                        <span className="font-medium">{activity.action}</span> {activity.fileName}
                      </p>
                      <p className="text-xs text-surface-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              {recentActivities.length === 0 && (
                <div className="text-center py-4 text-surface-500">
                  <ApperIcon name="Clock" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard