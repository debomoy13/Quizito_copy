// src/pages/BackendTest.jsx
import { useState } from 'react';
import { useQuiz } from '../QuizContext';
import { Server, Database, Wifi, WifiOff, TestTube, RefreshCw } from 'lucide-react';

const BackendTest = () => {
  const { api, checkBackendEndpoints } = useQuiz();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    const endpoints = [
      { path: '/health', method: 'GET', name: 'Health Check' },
      { path: '/api', method: 'GET', name: 'API Root' },
      { path: '/api/auth/register', method: 'GET', name: 'Auth Register' },
      { path: '/api/auth/login', method: 'GET', name: 'Auth Login' },
      { path: '/api/quiz', method: 'GET', name: 'Quiz API' },
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await api({
          method: endpoint.method,
          url: endpoint.path,
          timeout: 5000
        });
        const responseTime = Date.now() - startTime;

        results.push({
          name: endpoint.name,
          status: 'success',
          message: `✅ ${response.status} - ${responseTime}ms`,
          data: response.data
        });
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: 'error',
          message: `❌ ${error.response?.status || 'No response'} - ${error.message}`,
          error: error.response?.data || error.message
        });
      }
    }

    setTestResults(results);
    setLoading(false);
  };

  const testAuth = async () => {
    setLoading(true);
    
    // Test registration
    try {
      const testUser = {
        name: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: 'testpass123'
      };

      const response = await api.post('/auth/register', testUser);
      setTestResults(prev => [...prev, {
        name: 'Registration Test',
        status: 'success',
        message: '✅ Registration endpoint works',
        data: response.data
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: 'Registration Test',
        status: 'error',
        message: `❌ ${error.response?.status || 'Error'}`,
        error: error.response?.data || error.message
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Backend Diagnostics</h1>
          <p className="text-gray-600">Testing connection to your backend server</p>
          <div className="mt-4 p-3 bg-gray-100 rounded-lg inline-block">
            <code className="text-sm">
              {import.meta.env.VITE_API_URL || 'https://quizito-backend.onrender.com/api'}
            </code>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                <Server className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Backend Connection Tests</h2>
                <p className="text-gray-600">Run diagnostic tests on your backend endpoints</p>
              </div>
            </div>
            <button
              onClick={runTests}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={20} />
              Run Tests
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${
                    test.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {test.status === 'success' ? (
                        <Wifi className="text-green-600" size={20} />
                      ) : (
                        <WifiOff className="text-red-600" size={20} />
                      )}
                      <div>
                        <h3 className="font-bold text-gray-800">{test.name}</h3>
                        <p className={test.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                          {test.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {test.data && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <details>
                        <summary className="cursor-pointer text-sm text-gray-600 font-medium">
                          View response data
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                  
                  {test.error && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <details>
                        <summary className="cursor-pointer text-sm text-red-600 font-medium">
                          View error details
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
                          {JSON.stringify(test.error, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {testResults.length === 0 && !loading && (
            <div className="text-center py-12">
              <TestTube className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">Click "Run Tests" to diagnose backend connection</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Running diagnostic tests...</p>
            </div>
          )}
        </div>

        {/* Test Authentication */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Authentication Test</h3>
          <p className="text-gray-600 mb-6">Test if registration and login endpoints are working</p>
          
          <div className="space-y-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg"
            >
              Test Registration
            </button>
            
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-2">Common Issues & Fixes:</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">•</span>
                  <span><strong>CORS Error:</strong> Backend needs CORS headers for your frontend domain</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">•</span>
                  <span><strong>404 Error:</strong> Endpoint might not exist in your backend</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">•</span>
                  <span><strong>500 Error:</strong> Backend server error, check backend logs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500">•</span>
                  <span><strong>Timeout:</strong> Render.com free tier has cold starts (30-50s first request)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Check Script */}
        <div className="mt-6 p-6 bg-gray-900 text-gray-100 rounded-2xl">
          <h4 className="font-bold mb-3">Quick Debug Script (Run in browser console):</h4>
          <pre className="text-sm overflow-x-auto">
{`// Test backend endpoints
async function testBackend() {
  const baseUrl = '${import.meta.env.VITE_API_URL || 'https://quizito-backend.onrender.com/api'}';
  
  console.log('Testing:', baseUrl);
  
  try {
    // Test health endpoint
    const health = await fetch(baseUrl.replace('/api', '/health'));
    console.log('Health:', await health.json());
    
    // Test API root
    const api = await fetch(baseUrl);
    console.log('API:', await api.json());
    
    // Test auth endpoint
    const auth = await fetch(baseUrl + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    });
    console.log('Auth:', await auth.json());
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testBackend();`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default BackendTest;
