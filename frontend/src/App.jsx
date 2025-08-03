import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Star, Filter, Search, RefreshCw } from 'lucide-react';

// API configuration - DIFFERENT FOR LOCAL VS VERCEL
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://task-manager-backend-murex-eight.vercel.app/api' // Production: relative path (same domain on Vercel)
  : 'http://localhost:5000/api'; // Development: full URL to backend server

function App() {
  // State management
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    important: 0
  });

  // API functions with better error handling
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`${API_BASE_URL}/tasks?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(`Failed to load tasks: ${err.message}`);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const createTask = async (taskText) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: taskText }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
      
      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      fetchStats();
      return newTask;
    } catch (err) {
      setError(`Failed to create task: ${err.message}`);
      console.error('Error creating task:', err);
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task._id === id ? updatedTask : task
      ));
      fetchStats();
      return updatedTask;
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }
      
      setTasks(prev => prev.filter(task => task._id !== id));
      fetchStats();
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
      console.error('Error deleting task:', err);
    }
  };

  // Load tasks on component mount and when filter/search changes
  useEffect(() => {
    fetchTasks();
  }, [filter, searchTerm]);

  // Load stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Event handlers
  const addTask = async (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      await createTask(newTask.trim());
      setNewTask('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask(e);
    }
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t._id === id);
    if (task) {
      updateTask(id, { completed: !task.completed });
    }
  };

  const toggleImportant = (id) => {
    const task = tasks.find(t => t._id === id);
    if (task) {
      updateTask(id, { important: !task.important });
    }
  };

  const handleDeleteTask = (id) => {
    deleteTask(id);
  };

  const refreshTasks = () => {
    fetchTasks();
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 w-full">
      <div className="w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Task Manager Pro
            </h1>
            <p className="text-gray-600">Master your productivity with modern React & MongoDB</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="text-sm text-green-600 font-medium">
                ✅ {import.meta.env.PROD ? 'Production' : 'Development'} mode
              </div>
              <div className="text-xs text-gray-500">
                API: {API_BASE_URL}
              </div>
              <button
                onClick={refreshTasks}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Refresh tasks"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, color: 'blue', icon: '📋' },
              { label: 'Pending', value: stats.pending, color: 'yellow', icon: '⏳' },
              { label: 'Completed', value: stats.completed, color: 'green', icon: '✅' },
              { label: 'Important', value: stats.important, color: 'red', icon: '⭐' }
            ].map((stat) => (
              <div key={stat.label} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className={`text-2xl font-bold ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'green' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.value}
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Main Task Interface */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
            {/* Add Task Input */}
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a new task... (Press Enter or click Add)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-700"
                    disabled={loading}
                    maxLength={500}
                  />
                </div>
                <button
                  onClick={addTask}
                  disabled={loading || !newTask.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Plus size={20} />
                  Add
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'completed', 'important'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-1 ${
                      filter === filterType
                        ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    <Filter size={16} />
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            )}

            {/* Task List */}
            {!loading && (
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">
                      {searchTerm || filter !== 'all' ? '🔍' : '📝'}
                    </div>
                    <p className="text-lg font-medium mb-2">
                      {searchTerm || filter !== 'all' 
                        ? 'No tasks match your criteria' 
                        : 'No tasks yet. Add your first task above!'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {searchTerm || filter !== 'all' 
                        ? 'Try adjusting your search or filter' 
                        : 'Start by adding a task to get organized'}
                    </p>
                  </div>
                ) : (
                  tasks.map((task, index) => (
                    <div
                      key={task._id}
                      className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md transform hover:scale-[1.02] ${
                        task.completed
                          ? 'bg-green-50 border-green-200'
                          : task.important
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(task._id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {task.completed && <Check size={16} />}
                      </button>

                      {/* Task Text */}
                      <span
                        className={`flex-1 transition-all duration-200 ${
                          task.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-800'
                        }`}
                      >
                        {task.text}
                      </span>

                      {/* Badges */}
                      <div className="flex gap-2">
                        {task.important && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                            Important
                          </span>
                        )}
                        {task.completed && (
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full font-medium">
                            Done
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => toggleImportant(task._id)}
                          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                            task.important
                              ? 'text-red-500 bg-red-100'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title={task.important ? 'Remove from important' : 'Mark as important'}
                        >
                          <Star size={16} fill={task.important ? 'currentColor' : 'none'} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 hover:scale-110"
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p className="mb-1">🚀 Built with React + Vite + Tailwind CSS + Node.js + MongoDB Atlas</p>
            <p className="flex items-center justify-center gap-2">
              <span>Environment:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                import.meta.env.PROD 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {import.meta.env.PROD ? 'Production' : 'Development'}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs">Vercel Ready</span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">MongoDB Atlas</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;