import React, { useState, useEffect } from 'react';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import Alert from './ui/Alert';
import HistoryManager from './HistoryManager';
import { validateLeaseData } from '../utils/leaseCalculations';
import { saveFormData, loadFormData } from '../utils/localStorage';

const LeaseForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    annualRate: '',
    monthlyPayment: '',
    accountingBasis: 'monthly',
    terminationDate: ''
  });
  
  const [errors, setErrors] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 컴포넌트 마운트 시 저장된 데이터 불러오기
  useEffect(() => {
    const savedData = loadFormData();
    if (savedData) {
      // 저장된 데이터의 숫자 필드를 적절히 포맷팅
      const formattedData = {
        ...savedData,
        monthlyPayment: typeof savedData.monthlyPayment === 'number' 
          ? savedData.monthlyPayment.toLocaleString()
          : savedData.monthlyPayment || '',
        annualRate: savedData.annualRate ? savedData.annualRate.toString() : '',
      };
      setFormData(formattedData);
    }
  }, []);

  // 폼 데이터 변경 시 자동 저장
  useEffect(() => {
    const timer = setTimeout(() => {
      // 저장할 때는 숫자 형태로 변환
      const dataToSave = {
        ...formData,
        annualRate: parseFloat(formData.annualRate) || 0,
        monthlyPayment: typeof formData.monthlyPayment === 'string' 
          ? parseInt(formData.monthlyPayment.replace(/,/g, '')) || 0
          : parseInt(formData.monthlyPayment) || 0
      };
      saveFormData(dataToSave);
    }, 1000); // 1초 후 저장

    return () => clearTimeout(timer);
  }, [formData]);

  const accountingBasisOptions = [
    { value: 'monthly', label: '월별' },
    { value: 'quarterly', label: '분기별' }
  ];

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 입력 시 에러 초기화
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 숫자 필드 변환 (안전한 처리)
    const processedData = {
      ...formData,
      annualRate: parseFloat(formData.annualRate) || 0,
      monthlyPayment: typeof formData.monthlyPayment === 'string' 
        ? parseInt(formData.monthlyPayment.replace(/,/g, '')) || 0
        : parseInt(formData.monthlyPayment) || 0
    };
    
    // 유효성 검증
    const validationErrors = validateLeaseData(processedData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSubmit(processedData);
  };

  const formatNumber = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleMonthlyPaymentChange = (e) => {
    const formatted = formatNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      monthlyPayment: formatted
    }));
    
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleLoadHistory = (historyData) => {
    // 불러온 데이터의 monthlyPayment를 포맷팅
    const formattedData = {
      ...historyData,
      monthlyPayment: typeof historyData.monthlyPayment === 'number' 
        ? historyData.monthlyPayment.toLocaleString()
        : historyData.monthlyPayment,
      annualRate: historyData.annualRate.toString(),
    };
    
    setFormData(formattedData);
    setErrors([]);
  };

  const handleClearForm = () => {
    if (window.confirm('입력된 내용을 모두 초기화하시겠습니까?')) {
      setFormData({
        startDate: '',
        endDate: '',
        annualRate: '',
        monthlyPayment: '',
        accountingBasis: 'monthly',
        terminationDate: ''
      });
      setErrors([]);
    }
  };

  return (
    <>
      {showHistory && (
        <HistoryManager
          onLoadHistory={handleLoadHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">리스 계약 정보 입력</h2>
      
      {errors.length > 0 && (
        <Alert type="error" title="입력 오류">
          <ul className="list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="개시일"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange('startDate')}
            required
          />
          
          <Input
            label="종료일"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange('endDate')}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="연이자율 (%)"
            type="number"
            value={formData.annualRate}
            onChange={handleInputChange('annualRate')}
            placeholder="예: 5.5"
            step="0.1"
            min="0"
            required
          />
          
          <Input
            label="월임차료 (원)"
            type="text"
            value={formData.monthlyPayment}
            onChange={handleMonthlyPaymentChange}
            placeholder="예: 1,000,000"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="회계처리 기준"
            value={formData.accountingBasis}
            onChange={handleInputChange('accountingBasis')}
            options={accountingBasisOptions}
            required
          />
          
          <Input
            label="해지일 (선택사항)"
            type="date"
            value={formData.terminationDate}
            onChange={handleInputChange('terminationDate')}
            placeholder="중도 해지일이 있는 경우"
          />
        </div>

        <div className="pt-4 flex flex-wrap gap-2">
          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="flex-1 md:flex-none"
          >
            {loading ? '계산 중...' : '리스 회계처리 계산하기'}
          </Button>
          
          <Button
            type="button"
            onClick={() => setShowHistory(true)}
            variant="outline"
            size="lg"
          >
            계산 기록
          </Button>
          
          <Button
            type="button"
            onClick={handleClearForm}
            variant="outline"
            size="lg"
          >
            초기화
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">입력 안내</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 개시일과 종료일을 기준으로 리스 기간이 계산됩니다.</li>
          <li>• 연이자율은 소수점 입력이 가능합니다. (예: 5.5%)</li>
          <li>• 월임차료는 매월 동일한 금액으로 가정합니다.</li>
          <li>• 회계처리 기준에 따라 월별 또는 분기별로 분개가 생성됩니다.</li>
          <li>• 해지일을 입력하면 중도 해지 회계처리가 포함됩니다.</li>
          <li>• 입력된 값은 자동으로 저장되며, 계산 기록에서 이전 계산을 불러올 수 있습니다.</li>
        </ul>
      </div>
    </div>
    </>
  );
};

export default LeaseForm; 