import React, { useState } from 'react';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { exportToExcel, generateSummary } from '../utils/excelExport';

const ResultsDisplay = ({ leaseData, schedule, journalEntries }) => {
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(true);
  const [showJournal, setShowJournal] = useState(false);
  
  const summary = generateSummary(leaseData, schedule);

  const handleExcelExport = async () => {
    try {
      setLoading(true);
      await exportToExcel(leaseData, schedule, journalEntries);
    } catch (error) {
      console.error('Excel 내보내기 오류:', error);
      alert('Excel 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* 요약 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">계산 결과 요약</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">리스 기간</div>
            <div className="text-lg font-semibold text-blue-600">{summary.duration}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">초기 리스부채</div>
            <div className="text-lg font-semibold text-green-600">{summary.initialLeaseAmount}</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600">총 지급액</div>
            <div className="text-lg font-semibold text-purple-600">{summary.totalPayments}</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-gray-600">총 이자비용</div>
            <div className="text-lg font-semibold text-orange-600">{summary.totalInterest}</div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• 리스 계약 기간: {summary.startDate} ~ {summary.endDate}</p>
          <p>• 월임차료: {summary.monthlyPayment}</p>
          <p>• 연이자율: {summary.annualRate}</p>
        </div>
      </div>

      {/* 다운로드 버튼 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">파일 다운로드</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            onClick={handleExcelExport}
            loading={loading}
            size="lg"
            className="flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 11-2 0V4H6v12h8v-1a1 1 0 112 0v1a1 1 0 01-1 1H5a1 1 0 01-1-1V3z"/>
              <path d="M6 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM6 12a1 1 0 011-1h3a1 1 0 110 2H7a1 1 0 01-1-1z"/>
            </svg>
            Excel 파일 다운로드
          </Button>
        </div>
        
        <Alert type="info" className="mt-4">
          Excel 파일에는 리스스케줄과 회계분개가 별도 시트로 구성되어 다운로드됩니다.
        </Alert>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => {setShowSchedule(true); setShowJournal(false);}}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                showSchedule 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              리스 스케줄 ({schedule.length}개월)
            </button>
            <button
              onClick={() => {setShowSchedule(false); setShowJournal(true);}}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                showJournal 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              회계 분개 ({journalEntries.length}건)
            </button>
          </nav>
        </div>

        <div className="p-6">
          {showSchedule && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지급일자</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">월임차료</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">이자비용</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">상환원금</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">리스부채잔액</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">감가상각비</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedule.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.paymentDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.monthlyPayment.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.interestExpense.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.principalPayment.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.endingBalance.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.depreciation.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showJournal && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계정과목</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">차변</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">대변</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {journalEntries.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.account}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{entry.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay; 