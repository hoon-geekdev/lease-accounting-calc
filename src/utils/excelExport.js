import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

// Excel 파일로 내보내기
export function exportToExcel(leaseData, schedule, journalEntries) {
  try {
    const { startDate, endDate } = leaseData;
    
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    
    // 입력 정보 및 요약
    const summary = generateSummary(leaseData, schedule);
    const totalPayments = schedule.reduce((sum, item) => sum + item.monthlyPayment, 0);
    const totalInterest = schedule.reduce((sum, item) => sum + item.interestExpense, 0);
    const initialLeaseAmount = schedule.length > 0 ? schedule[0].leaseBalance : 0;
    
    // 리스 스케줄 시트 (입력정보, 요약, 스케줄 포함)
    const scheduleData = [
      // 입력 정보
      ['리스 회계처리 계산 결과', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['■ 입력 정보', '', '', '', '', '', '', ''],
      ['개시일', dayjs(leaseData.startDate).format('YYYY-MM-DD'), '', '', '', '', '', ''],
      ['종료일', dayjs(leaseData.endDate).format('YYYY-MM-DD'), '', '', '', '', '', ''],
      ['리스 기간', `${schedule.length}개월`, '', '', '', '', '', ''],
      ['연이자율', `${leaseData.annualRate}%`, '', '', '', '', '', ''],
      ['월임차료', leaseData.monthlyPayment.toLocaleString() + '원', '', '', '', '', '', ''],
      ['회계처리 기준', leaseData.accountingBasis === 'monthly' ? '월별' : '분기별', '', '', '', '', '', ''],
      ...(leaseData.terminationDate ? [['해지일', dayjs(leaseData.terminationDate).format('YYYY-MM-DD'), '', '', '', '', '', '']] : []),
      ['', '', '', '', '', '', '', ''],
      // 요약 정보
      ['■ 계산 결과 요약', '', '', '', '', '', '', ''],
      ['초기 리스부채', initialLeaseAmount.toLocaleString() + '원', '', '', '', '', '', ''],
      ['총 지급액', totalPayments.toLocaleString() + '원', '', '', '', '', '', ''],
      ['총 이자비용', totalInterest.toLocaleString() + '원', '', '', '', '', '', ''],
      ['총 감가상각비', initialLeaseAmount.toLocaleString() + '원', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      // 스케줄 헤더
      ['■ 리스 스케줄', '', '', '', '', '', '', ''],
      ['No', '지급일자', '월임차료', '이자비용', '상환원금', '리스부채잔액', '기말잔액', '감가상각비'],
      // 스케줄 데이터
      ...schedule.map(item => [
        item.no,
        item.paymentDate,
        item.monthlyPayment.toLocaleString(),
        item.interestExpense.toLocaleString(),
        item.principalPayment.toLocaleString(),
        item.leaseBalance.toLocaleString(),
        item.endingBalance.toLocaleString(),
        item.depreciation.toLocaleString()
      ])
    ];
    
    const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
    
    // 컬럼 너비 설정
    scheduleSheet['!cols'] = [
      { width: 5 },   // No
      { width: 12 },  // 지급일자
      { width: 15 },  // 월임차료
      { width: 15 },  // 이자비용
      { width: 15 },  // 상환원금
      { width: 18 },  // 리스부채잔액
      { width: 15 },  // 기말잔액
      { width: 15 }   // 감가상각비
    ];
    
    XLSX.utils.book_append_sheet(workbook, scheduleSheet, '리스스케줄');
    
    // 회계분개 시트
    const journalData = [
      ['일자', '계정과목', '차변', '대변', '금액', '비고'],
      ...journalEntries.map(entry => [
        entry.date,
        entry.account,
        entry.debit > 0 ? entry.debit.toLocaleString() : '',
        entry.credit > 0 ? entry.credit.toLocaleString() : '',
        entry.amount.toLocaleString(),
        entry.note
      ])
    ];
    
    const journalSheet = XLSX.utils.aoa_to_sheet(journalData);
    
    // 컬럼 너비 설정
    journalSheet['!cols'] = [
      { width: 12 },  // 일자
      { width: 30 },  // 계정과목
      { width: 18 },  // 차변
      { width: 18 },  // 대변
      { width: 18 },  // 금액
      { width: 35 }   // 비고
    ];
    
    XLSX.utils.book_append_sheet(workbook, journalSheet, '회계분개');
    
    // 파일명 생성
    const fileName = `리스회계_${dayjs(startDate).format('YYYY-MM-DD')}_${dayjs(endDate).format('YYYY-MM-DD')}.xlsx`;
    
    // 파일 다운로드
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
    
    return true;
  } catch (error) {
    console.error('Excel 내보내기 오류:', error);
    throw error;
  }
}



// 요약 정보 생성
export function generateSummary(leaseData, schedule) {
  const { startDate, endDate, monthlyPayment, annualRate } = leaseData;
  const totalPayments = schedule.reduce((sum, item) => sum + item.monthlyPayment, 0);
  const totalInterest = schedule.reduce((sum, item) => sum + item.interestExpense, 0);
  const initialLease = schedule.length > 0 ? schedule[0].leaseBalance : 0;
  
  return {
    startDate: dayjs(startDate).format('YYYY년 MM월 DD일'),
    endDate: dayjs(endDate).format('YYYY년 MM월 DD일'),
    duration: `${schedule.length}개월`,
    monthlyPayment: monthlyPayment.toLocaleString() + '원',
    annualRate: annualRate + '%',
    initialLeaseAmount: initialLease.toLocaleString() + '원',
    totalPayments: totalPayments.toLocaleString() + '원',
    totalInterest: totalInterest.toLocaleString() + '원'
  };
} 