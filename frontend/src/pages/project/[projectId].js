import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import DevelopmentPlan from '../../components/DevelopmentPlan';
import { apiClient } from '../../services/api';

export default function ProjectPage() {
  const router = useRouter();
  const { projectId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.getPlan(projectId);
      
      if (response.success) {
        setProjectData(response.data);
        setSteps(response.data.steps || []);
        setProgress(response.data.progress || { total: 0, completed: 0 });
      } else {
        setError(response.error || 'Ошибка загрузки проекта');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки проекта');
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepId) => {
    try {
      const response = await apiClient.completeStep(stepId);
      
      if (response.success) {
        // Обновляем локальное состояние
        setSteps(steps.map(step => 
          step.id === stepId 
            ? { ...step, completed: true, completedAt: response.data.step.completedAt }
            : step
        ));
        setProgress(response.data.progress);
      }
    } catch (err) {
      console.error('Error completing step:', err);
      alert(err.response?.data?.error || 'Ошибка отметки шага');
    }
  };

  const handleStepUncomplete = async (stepId) => {
    try {
      const response = await apiClient.uncompleteStep(stepId);
      
      if (response.success) {
        // Обновляем локальное состояние
        setSteps(steps.map(step => 
          step.id === stepId 
            ? { ...step, completed: false, completedAt: null }
            : step
        ));
        setProgress(response.data.progress);
      }
    } catch (err) {
      console.error('Error uncompleting step:', err);
      alert(err.response?.data?.error || 'Ошибка отмены шага');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <span className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer">
              ← Вернуться на главную
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>План разработки - Vibe Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <span className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-4 cursor-pointer">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Вернуться на главную
              </span>
            </Link>

            {projectData && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                  Образ продукта
                </h1>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {projectData.productVision}
                </p>
                
                {projectData.keyFeatures && projectData.keyFeatures.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Ключевые функции:</h3>
                    <div className="flex flex-wrap gap-2">
                      {projectData.keyFeatures.map((feature, index) => (
                        <span 
                          key={index}
                          className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Development Plan */}
          <DevelopmentPlan 
            steps={steps}
            progress={progress}
            onStepComplete={handleStepComplete}
            onStepUncomplete={handleStepUncomplete}
          />
        </div>
      </main>
    </>
  );
}

