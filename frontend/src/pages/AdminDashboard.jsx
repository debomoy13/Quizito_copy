// src/pages/AdminDashboard.jsx
import { useState } from 'react';
import { 
  BarChart3, Users, Trophy, Zap, Clock, TrendingUp, 
  Settings, Download, Filter, Calendar, Eye, Edit, Trash2,
  Plus, Search, ChevronRight, DownloadCloud, Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('week');

  const stats = [
    { icon: <Users />, label: 'Total Users', value: '2,458', change: '+12%', color: 'from-blue-500 to-cyan-500' },
    { icon: <Trophy />, label: 'Quizzes Created', value: '1,234', change: '+24%', color: 'from-purple-500 to-pink-500' },
    { icon: <Zap />, label: 'Active Sessions', value: '156', change: '+8%', color: 'from-green-500 to-emerald-500' },
    { icon: <Clock />, label: 'Avg Session Time', value: '18m', change: '+5%', color: 'from-yellow-500 to-orange-500' },
  ];

  const recentQuizzes = [
    { id: 1, title: 'JavaScript Fundamentals', participants: 245, date: '2024-01-15', status: 'active' },
    { id: 2, title: 'React Advanced Patterns', participants: 189, date: '2024-01-14', status: 'completed' },
    { id: 3, title: 'Machine Learning Basics', participants: 312, date: '2024-01-13', status: 'active' },
    { id: 4, title: 'Data Structures Quiz', participants: 156, date: '2024-01-12', status: 'completed' },
    { id: 5, title: 'Web Security', participants: 98, date: '2024-01-11', status: 'active' },
  ];

  const userActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Quizzes Created',
        data: [65, 78, 92, 89, 76, 85, 95],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Active Users',
        data: [45, 52, 68, 74, 65, 70, 82],
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const categoryData = {
    labels: ['Technology', 'Science', 'Education', 'Entertainment', 'Business'],
    datasets: [{
      data: [35, 20, 25, 15, 5],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(59, 130, 246, 0.8)',
      ],
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(236, 72, 153)',
        'rgb(59, 130, 246)',
      ],
      borderWidth: 2,
    }]
  };

  const performanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Average Score',
      data: [65, 72, 78, 75, 82, 85],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor your quiz platform performance and user engagement</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 flex items-center">
              <DownloadCloud className="mr-2" size={18} />
              Export Report
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center">
              <Settings className="mr-2" size={18} />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl`}>
                  <div className="text-white">{stat.icon}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  stat.change.startsWith('+') 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Activity Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">User Activity</h3>
                  <p className="text-gray-600">Last 7 days performance</p>
                </div>
                <div className="flex space-x-2">
                  {['day', 'week', 'month', 'year'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
                        timeRange === range
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-80">
                <Bar data={userActivityData} options={chartOptions} />
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Quiz Categories</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="h-64">
                  <Doughnut 
                    data={categoryData} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: 'rgba(0, 0, 0, 0.8)',
                            padding: 20,
                            font: {
                              size: 14
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-4">
                  {categoryData.labels.map((label, index) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryData.datasets[0].backgroundColor[index] }}
                        ></div>
                        <span className="font-medium text-gray-800">{label}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {categoryData.datasets[0].data[index]}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-8">
            {/* Performance Trend */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Trend</h3>
              <div className="h-64">
                <Line data={performanceData} options={chartOptions} />
              </div>
            </div>

            {/* Recent Quizzes */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Recent Quizzes</h3>
                  <p className="text-gray-600">Latest created quizzes</p>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center">
                  View All
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div key={quiz.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800">{quiz.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        quiz.status === 'active'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {quiz.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="mr-1" size={14} />
                        {quiz.participants} participants
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {quiz.date}
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <button className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Eye size={18} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center">
                <Plus className="mr-2" size={20} />
                Create New Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Top Performer</h3>
              <Trophy size={24} />
            </div>
            <div className="text-3xl font-bold mb-2">Alex Johnson</div>
            <div className="text-indigo-200">98.5% average score</div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Most Active</h3>
              <Zap size={24} />
            </div>
            <div className="text-3xl font-bold mb-2">Sarah Miller</div>
            <div className="text-green-200">42 quizzes completed</div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Fastest</h3>
              <Clock size={24} />
            </div>
            <div className="text-3xl font-bold mb-2">Mike Chen</div>
            <div className="text-yellow-200">8.2s average response</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
