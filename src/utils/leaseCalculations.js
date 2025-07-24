import dayjs from 'dayjs';

// 리스료 현재가치 계산 (후급 연금 방식 - 엑셀 PV 함수와 동일)
export function calculatePresentValue(monthlyPayment, startDate, endDate, annualRate) {
  const months = dayjs(endDate).diff(dayjs(startDate), 'month') + 1;
  const monthlyRate = annualRate / 100 / 12; // 단순 나누기 방식
  
  if (monthlyRate === 0) {
    return monthlyPayment * months;
  }
  
  // 후급 연금의 현재가치 공식 (엑셀 PV 함수의 type=0)
  // PV = PMT × [1 - (1 + r)^(-n)] / r
  const pvFactor = (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
  const presentValue = monthlyPayment * pvFactor;
  
  return Math.round(presentValue);
}

// 월별 리스 스케줄 생성
export function generateLeaseSchedule(leaseData) {
  const { startDate, endDate, monthlyPayment, annualRate, terminationDate } = leaseData;
  const monthlyRate = annualRate / 100 / 12; // 단순 나누기 방식
  const months = dayjs(endDate).diff(dayjs(startDate), 'month') + 1;
  const presentValue = calculatePresentValue(monthlyPayment, startDate, endDate, annualRate);
  const monthlyDepreciation = Math.round(presentValue / months);
  
  const schedule = [];
  let leaseBalance = presentValue;
  let totalDepreciation = 0; // 누적 감가상각비 추적
  
  for (let i = 0; i < months; i++) {
    const paymentDate = dayjs(startDate).add(i, 'month');
    
    // 중도 해지일 체크
    if (terminationDate && paymentDate.isAfter(dayjs(terminationDate))) {
      break;
    }
    
    // 후급 방식: 매월 말에 지급, 기초 잔액에 대한 이자비용 발생
    const interestExpense = Math.round(leaseBalance * monthlyRate);
    const principalPayment = monthlyPayment - interestExpense;
    
    const endingBalance = leaseBalance - principalPayment;
    
    // 감가상각비 계산 (마지막 회차에서 차액 조정)
    let currentDepreciation;
    if (i === months - 1) {
      // 마지막 회차: 총 현재가치에서 기존 감가상각비 누계를 뺀 나머지
      currentDepreciation = presentValue - totalDepreciation;
    } else {
      currentDepreciation = monthlyDepreciation;
    }
    
    totalDepreciation += currentDepreciation;
    
    schedule.push({
      no: i + 1,
      paymentDate: paymentDate.format('YYYY-MM-DD'),
      monthlyPayment,
      interestExpense,
      principalPayment,
      leaseBalance: leaseBalance,
      endingBalance: Math.max(0, endingBalance),
      depreciation: currentDepreciation
    });
    
    leaseBalance = Math.max(0, endingBalance);
  }
  
  return schedule;
}

// 초기 단기부채 계산 (개시일 기준 1-12개월)
function calculateInitialCurrentLiability(schedule, startDate, accountingBasis) {
  // 개시일부터 12개월간의 상환원금 합계 (1-12개월)
  const twelveMonthsLater = startDate.add(12, 'month');
  
  let currentLiability = 0;
  
  schedule.forEach((item, index) => {
    const paymentDate = dayjs(item.paymentDate);
    // 1개월부터 12개월까지 (인덱스 0-11)
    if (index < 12) {
      currentLiability += item.principalPayment;
    }
  });
  
  return currentLiability;
}

// 유동부채 계산 (회계처리 기준에 따라) - 순차적 유동성 대체
function calculateCurrentLiability(schedule, asOfDate, accountingBasis, startDate) {
  let currentLiability = 0;
  
  // 현재 기간이 몇 번째 기간인지 계산
  const monthsFromStart = asOfDate.diff(dayjs(startDate), 'month') + 1;
  
  if (accountingBasis === 'monthly') {
    // 월별: 매월 다음 1개월치 대체
    // 1월차 -> 13월차, 2월차 -> 14월차, ...
    const targetIndex = 12 + (monthsFromStart - 1); // 12개월 이후부터 시작
    
    if (targetIndex < schedule.length) {
      currentLiability = schedule[targetIndex].principalPayment;
    }
  } else {
    // 분기별: 매 분기 다음 3개월치 대체
    // 1분기 -> 13-15월차, 2분기 -> 16-18월차, ...
    const quarter = Math.ceil(monthsFromStart / 3);
    const startIndex = 12 + (quarter - 1) * 3; // 12개월 이후부터 시작
    
    for (let i = 0; i < 3; i++) {
      const targetIndex = startIndex + i;
      if (targetIndex < schedule.length) {
        currentLiability += schedule[targetIndex].principalPayment;
      }
    }
  }
  
  return currentLiability;
}

// 회계 분개 생성
export function generateJournalEntries(leaseData, schedule) {
  const { startDate, endDate, accountingBasis, terminationDate } = leaseData;
  const presentValue = calculatePresentValue(leaseData.monthlyPayment, startDate, endDate, leaseData.annualRate);
  
  const entries = [];
  
  // 초기 인식 - 리스부채를 단기/장기로 구분
  const startDateObj = dayjs(startDate);
  const initialCurrentLiability = calculateInitialCurrentLiability(schedule, startDateObj, accountingBasis);
  const initialNonCurrentLiability = presentValue - initialCurrentLiability;
  
  entries.push({
    date: startDateObj.format('YYYY-MM-DD'),
    account: '사용권자산',
    debit: presentValue,
    credit: 0,
    amount: presentValue,
    note: '리스 초기 인식'
  });
  
  if (initialCurrentLiability > 0) {
    entries.push({
      date: startDateObj.format('YYYY-MM-DD'),
      account: '유동리스부채',
      debit: 0,
      credit: initialCurrentLiability,
      amount: initialCurrentLiability,
      note: '리스 초기 인식 (1-12개월분)'
    });
  }
  
  if (initialNonCurrentLiability > 0) {
    entries.push({
      date: startDateObj.format('YYYY-MM-DD'),
      account: '비유동리스부채',
      debit: 0,
      credit: initialNonCurrentLiability,
      amount: initialNonCurrentLiability,
      note: '리스 초기 인식 (13개월 이후)'
    });
  }
  
  // 월별/분기별 회계처리
  const groupedData = groupByPeriod(schedule, accountingBasis);
  
  Object.keys(groupedData).forEach(period => {
    const periodData = groupedData[period];
    const periodEnd = dayjs(period);
    
    // 감가상각비
    const totalDepreciation = periodData.reduce((sum, item) => sum + item.depreciation, 0);
    if (totalDepreciation > 0) {
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '감가상각비',
        debit: totalDepreciation,
        credit: 0,
        amount: totalDepreciation,
        note: `${accountingBasis === 'monthly' ? '월별' : '분기별'} 감가상각`
      });
      
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '감가상각누계액(사용권자산)',
        debit: 0,
        credit: totalDepreciation,
        amount: totalDepreciation,
        note: `${accountingBasis === 'monthly' ? '월별' : '분기별'} 감가상각`
      });
    }
    
    // 이자비용
    const totalInterest = periodData.reduce((sum, item) => sum + item.interestExpense, 0);
    if (totalInterest > 0) {
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '이자비용',
        debit: totalInterest,
        credit: 0,
        amount: totalInterest,
        note: `${accountingBasis === 'monthly' ? '월별' : '분기별'} 이자비용`
      });
      
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '리스부채',
        debit: 0,
        credit: totalInterest,
        amount: totalInterest,
        note: `${accountingBasis === 'monthly' ? '월별' : '분기별'} 이자비용`
      });
    }
    
    // 리스료 지급
    const totalPayment = periodData.reduce((sum, item) => sum + item.monthlyPayment, 0);
    if (totalPayment > 0) {
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '리스부채',
        debit: totalPayment - totalInterest,
        credit: 0,
        amount: totalPayment - totalInterest,
        note: `${accountingBasis === 'monthly' ? '월별' : '분기별'} 리스료 지급`
      });
      
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '현금',
        debit: 0,
        credit: totalPayment,
        amount: totalPayment,
        note: `${accountingBasis === 'monthly' ? '월별' : '분기별'} 리스료 지급`
      });
    }
    
    // 유동성 대체 (순차적 대체)
    const currentLiability = calculateCurrentLiability(schedule, periodEnd, accountingBasis, startDate);
    if (currentLiability > 0) {
      // 현재 기간이 몇 번째 기간인지 계산
      const monthsFromStart = periodEnd.diff(dayjs(startDate), 'month') + 1;
      let noteDetail;
      
      if (accountingBasis === 'monthly') {
        const targetMonth = 12 + monthsFromStart;
        noteDetail = `유동성 대체 (${targetMonth}개월째)`;
      } else {
        const quarter = Math.ceil(monthsFromStart / 3);
        const startMonth = 12 + (quarter - 1) * 3 + 1;
        const endMonth = startMonth + 2;
        noteDetail = `유동성 대체 (${startMonth}-${endMonth}개월째)`;
      }
      
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '비유동리스부채',
        debit: currentLiability,
        credit: 0,
        amount: currentLiability,
        note: noteDetail
      });
      
      entries.push({
        date: periodEnd.format('YYYY-MM-DD'),
        account: '유동리스부채',
        debit: 0,
        credit: currentLiability,
        amount: currentLiability,
        note: noteDetail
      });
    }
  });
  
  // 중도 해지 처리
  if (terminationDate) {
    const terminationEntries = generateTerminationEntries(leaseData, schedule);
    entries.push(...terminationEntries);
  }
  
  // 리스 종료 시점 처리 (정상 만료)
  if (!terminationDate) {
    const endEntries = generateLeaseEndEntries(leaseData, schedule);
    entries.push(...endEntries);
  }
  
  return entries;
}

// 기간별 그룹핑
function groupByPeriod(schedule, basis) {
  const grouped = {};
  
  schedule.forEach(item => {
    let key;
    const date = dayjs(item.paymentDate);
    
    if (basis === 'monthly') {
      key = date.endOf('month').format('YYYY-MM-DD');
    } else {
      // quarterly
      const quarter = Math.floor(date.month() / 3);
      key = date.month(quarter * 3 + 2).endOf('month').format('YYYY-MM-DD');
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
}

// 중도 해지 회계처리
function generateTerminationEntries(leaseData, schedule) {
  const { terminationDate } = leaseData;
  const entries = [];
  
  // 해지일 기준 잔여 장부금액 계산
  let remainingAsset = 0;
  let remainingLiability = 0;
  
  const terminationDateObj = dayjs(terminationDate);
  
  schedule.forEach(item => {
    const paymentDate = dayjs(item.paymentDate);
    if (paymentDate.isAfter(terminationDateObj)) {
      remainingAsset += item.depreciation;
      remainingLiability += item.endingBalance > 0 ? item.principalPayment : 0;
    }
  });
  
  if (remainingLiability > 0) {
    entries.push({
      date: terminationDate,
      account: '리스부채',
      debit: remainingLiability,
      credit: 0,
      amount: remainingLiability,
      note: '중도 해지 - 리스부채 제거'
    });
  }
  
  if (remainingAsset > 0) {
    entries.push({
      date: terminationDate,
      account: '사용권자산',
      debit: 0,
      credit: remainingAsset,
      amount: remainingAsset,
      note: '중도 해지 - 사용권자산 제거'
    });
  }
  
  // 제거손익
  const gainLoss = remainingLiability - remainingAsset;
  if (gainLoss !== 0) {
    entries.push({
      date: terminationDate,
      account: gainLoss > 0 ? '제거이익' : '제거손실',
      debit: gainLoss < 0 ? Math.abs(gainLoss) : 0,
      credit: gainLoss > 0 ? gainLoss : 0,
      amount: Math.abs(gainLoss),
      note: '중도 해지 - 제거손익'
    });
  }
  
  return entries;
}

// 리스 종료 시점 회계처리 (정상 만료)
function generateLeaseEndEntries(leaseData, schedule) {
  const { endDate } = leaseData;
  const entries = [];
  
  if (schedule.length === 0) return entries;
  
  // 총 사용권자산 금액 (초기 인식 금액)
  const totalAssetAmount = schedule[0].leaseBalance;
  
  // 총 감가상각누계액 (전체 기간의 감가상각비 합계)
  const totalDepreciation = schedule.reduce((sum, item) => sum + item.depreciation, 0);
  
  // 리스 종료일에 사용권자산과 감가상각누계액 제거
  entries.push({
    date: dayjs(endDate).format('YYYY-MM-DD'),
    account: '감가상각누계액(사용권자산)',
    debit: totalDepreciation,
    credit: 0,
    amount: totalDepreciation,
    note: '리스 종료 - 감가상각누계액 제거'
  });
  
  entries.push({
    date: dayjs(endDate).format('YYYY-MM-DD'),
    account: '사용권자산',
    debit: 0,
    credit: totalAssetAmount,
    amount: totalAssetAmount,
    note: '리스 종료 - 사용권자산 제거'
  });
  
  return entries;
}

// 입력 유효성 검증
export function validateLeaseData(data) {
  const errors = [];
  
  if (!data.startDate) {
    errors.push('개시일을 입력해주세요.');
  }
  
  if (!data.endDate) {
    errors.push('종료일을 입력해주세요.');
  }
  
  if (data.startDate && data.endDate && dayjs(data.startDate).isAfter(dayjs(data.endDate))) {
    errors.push('개시일은 종료일보다 빨라야 합니다.');
  }
  
  if (!data.annualRate || data.annualRate <= 0) {
    errors.push('연이자율은 0보다 큰 값을 입력해주세요.');
  }
  
  if (!data.monthlyPayment || data.monthlyPayment <= 0) {
    errors.push('월임차료는 0보다 큰 값을 입력해주세요.');
  }
  
  if (data.terminationDate && data.endDate && dayjs(data.terminationDate).isAfter(dayjs(data.endDate))) {
    errors.push('해지일은 종료일보다 빨라야 합니다.');
  }
  
  return errors;
} 