import React, { useState } from 'react';
import LeaseForm from './components/LeaseForm';
import ResultsDisplay from './components/ResultsDisplay';
import Alert from './components/ui/Alert';
import { generateLeaseSchedule, generateJournalEntries } from './utils/leaseCalculations';
import { saveToHistory } from './utils/localStorage';

function App() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFormSubmit = async (leaseData) => {
    try {
      setLoading(true);
      setError(null);

      // 리스 스케줄 생성
      console.log('리스 스케줄 생성 중...', leaseData);
      const schedule = generateLeaseSchedule(leaseData);
      
      if (schedule.length === 0) {
        throw new Error('리스 스케줄을 생성할 수 없습니다.');
      }

      // 회계 분개 생성
      console.log('회계 분개 생성 중...', schedule.length, '개월');
      const journalEntries = generateJournalEntries(leaseData, schedule);

      // 결과 설정
      const results = {
        leaseData,
        schedule,
        journalEntries
      };
      
      setResults(results);

      // 계산 기록 저장
      saveToHistory(leaseData, results);

      console.log('계산 완료:', {
        scheduleItems: schedule.length,
        journalEntries: journalEntries.length
      });

    } catch (err) {
      console.error('계산 오류:', err);
      setError(err.message || '계산 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                리스 회계처리 자동 계산기
              </h1>
              <span className="ml-3 text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded">
                K-IFRS 제1116
              </span>
            </div>
            {results && (
              <button
                onClick={handleReset}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                새로 계산하기
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert type="error" title="오류 발생" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!results ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                리스 회계처리를 자동으로 계산해보세요
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                K-IFRS 제1116 기준에 따라 리스 계약 정보를 입력하시면, 
                리스 스케줄과 회계 분개를 자동으로 생성하여 Excel 또는 CSV 파일로 다운로드할 수 있습니다.
              </p>
            </div>

            <LeaseForm onSubmit={handleFormSubmit} loading={loading} />

            {/* 기능 소개 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">자동 계산</h3>
                <p className="text-gray-600 text-sm">
                  현재가치, 이자비용, 감가상각, 유동성 대체 등 모든 리스 회계처리를 자동으로 계산합니다.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">파일 내보내기</h3>
                <p className="text-gray-600 text-sm">
                  계산 결과를 Excel 또는 CSV 파일로 즉시 다운로드하여 업무에 활용할 수 있습니다.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">K-IFRS 준수</h3>
                <p className="text-gray-600 text-sm">
                  K-IFRS 제1116호 리스 기준에 완전히 부합하는 회계처리를 보장합니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ResultsDisplay 
            leaseData={results.leaseData}
            schedule={results.schedule}
            journalEntries={results.journalEntries}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-2">
              리스 회계처리 자동 계산기 - K-IFRS 제1116 기준
            </p>
            <p>
              이 도구는 일반적인 리스 계약에 대한 참고용이며, 
              복잡한 계약 조건이나 특수한 상황에서는 전문가와 상담하시기 바랍니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 