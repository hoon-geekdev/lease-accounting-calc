import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { getHistory, deleteHistoryItem, clearHistory } from '../utils/localStorage';
import dayjs from 'dayjs';

const HistoryManager = ({ onLoadHistory, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const historyData = getHistory();
    setHistory(historyData);
  };

  const handleLoadHistory = (item) => {
    onLoadHistory(item.formData);
    onClose();
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
      setLoading(true);
      const success = deleteHistoryItem(id);
      if (success) {
        loadHistory();
      } else {
        alert('기록 삭제에 실패했습니다.');
      }
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('모든 계산 기록을 삭제하시겠습니까?')) {
      setLoading(true);
      const success = clearHistory();
      if (success) {
        setHistory([]);
      } else {
        alert('기록 초기화에 실패했습니다.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">계산 기록</h2>
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                전체 삭제
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">저장된 계산 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {dayjs(item.summary.startDate).format('YYYY.MM.DD')} ~ {dayjs(item.summary.endDate).format('YYYY.MM.DD')}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">월임차료:</span>
                          <div className="font-medium">{item.summary.monthlyPayment.toLocaleString()}원</div>
                        </div>
                        <div>
                          <span className="text-gray-600">연이자율:</span>
                          <div className="font-medium">{item.summary.annualRate}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600">기간:</span>
                          <div className="font-medium">{item.summary.totalMonths}개월</div>
                        </div>
                        <div>
                          <span className="text-gray-600">초기리스부채:</span>
                          <div className="font-medium">{item.summary.initialLeaseAmount.toLocaleString()}원</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {item.summary.accountingBasis === 'monthly' ? '월별' : '분기별'} 회계처리
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleLoadHistory(item)}
                        size="sm"
                        disabled={loading}
                      >
                        불러오기
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item.id)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryManager; 