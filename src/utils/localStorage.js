// 로컬스토리지 키
const STORAGE_KEY = 'lease-calculator-data';
const HISTORY_KEY = 'lease-calculator-history';

// 현재 입력값 저장
export function saveFormData(formData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    return true;
  } catch (error) {
    console.error('데이터 저장 실패:', error);
    return false;
  }
}

// 현재 입력값 불러오기
export function loadFormData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
    return null;
  }
}

// 계산 기록 저장
export function saveToHistory(formData, results) {
  try {
    const history = getHistory();
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      formData,
      summary: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyPayment: formData.monthlyPayment,
        annualRate: formData.annualRate,
        accountingBasis: formData.accountingBasis,
        initialLeaseAmount: results.schedule.length > 0 ? results.schedule[0].leaseBalance : 0,
        totalMonths: results.schedule.length
      }
    };
    
    // 최대 10개까지만 저장
    history.unshift(newEntry);
    if (history.length > 10) {
      history.splice(10);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('기록 저장 실패:', error);
    return false;
  }
}

// 계산 기록 불러오기
export function getHistory() {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('기록 불러오기 실패:', error);
    return [];
  }
}

// 특정 기록 삭제
export function deleteHistoryItem(id) {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('기록 삭제 실패:', error);
    return false;
  }
}

// 모든 기록 삭제
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('기록 초기화 실패:', error);
    return false;
  }
}

// 모든 데이터 삭제
export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('데이터 초기화 실패:', error);
    return false;
  }
} 