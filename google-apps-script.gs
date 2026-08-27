// این کد را در Google Sheets > Extensions > Apps Script قرار دهید
const SHEET_NAME = 'DATA';
const STAFF = {
  'seller-1': { name: 'سمیه فلاح پور', col: 3 },
  'seller-2': { name: 'ثنا آخته', col: 4 },
  'seller-3': { name: 'گیتا ازم', col: 5 }
};
const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function doPost(e) {
  try {
    const p = JSON.parse(e.postData.contents);
    const person = STAFF[p.staffId];
    const hours = Number(p.hours);
    if (!person) return out({error:'پرسنل معتبر نیست.'}, 400);
    if (!isFinite(hours) || hours < 0 || hours > 24) return out({error:'مقدار باید بین ۰ تا ۲۴ باشد.'}, 400);
    const now = new Date();
    const fa = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Tehran', 'yyyy/MM/dd');
    const parts = fa.split('/');
    const year = Number(parts[0]), month = Number(parts[1]), day = Number(parts[2]);
    const key = ('0'+month).slice(-2) + '/' + ('0'+day).slice(-2);
    const sh = SpreadsheetApp.openById('1rbAr73QlY29aaRHtQWbo4EDginBSoIyk0OUyS0emZiA').getSheetByName(SHEET_NAME);
    const data = sh.getRange(2, 1, Math.max(sh.getLastRow()-1, 1), 6).getDisplayValues();
    let row = -1;
    for (let i=0; i<data.length; i++) if (String(data[i][0]).trim() === key) { row=i+2; break; }
    if (row < 0) return out({error:'ردیف تاریخ امروز در جدول پیدا نشد.'}, 404);
    const cell = sh.getRange(row, person.col);
    if (String(cell.getDisplayValue()).trim() !== '') return out({error:'کارکرد امروز قبلاً ثبت شده است.'}, 409);
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    try {
      if (String(cell.getDisplayValue()).trim() !== '') return out({error:'کارکرد امروز قبلاً ثبت شده است.'}, 409);
      cell.setValue(hours);
      sh.getRange(row, 6).setFormula('=SUM(C'+row+':E'+row+')');
      updateMonthlyReport();
    } finally { lock.releaseLock(); }
    return out({ok:true});
  } catch (err) { return out({error:String(err)}, 500); }
}
function updateMonthlyReport() {
  const ss = SpreadsheetApp.openById('1rbAr73QlY29aaRHtQWbo4EDginBSoIyk0OUyS0emZiA');
  const reportName = 'گزارش ماهانه';
  let r = ss.getSheetByName(reportName);
  if (!r) r = ss.insertSheet(reportName);
  r.clear();
  r.getRange('A1:E1').setValues([['گزارش ماهانه کارکرد','سمیه فلاح پور','ثنا آخته','گیتا ازم','جمع کل']]);
  r.getRange('A1:E1').setFontWeight('bold').setBackground('#dbeafe');
  r.getRange('A2:A13').setValues(MONTHS.map(m => [m]));
  for (let i=2; i<=13; i++) {
    r.getRange(i,2).setFormula("=SUMIF(DATA!B:B,A"+i+",DATA!C:C)");
    r.getRange(i,3).setFormula("=SUMIF(DATA!B:B,A"+i+",DATA!D:D)");
    r.getRange(i,4).setFormula("=SUMIF(DATA!B:B,A"+i+",DATA!E:E)");
    r.getRange(i,5).setFormula('=SUM(B'+i+':D'+i+')');
  }
  r.getRange('A15:E15').setValues([['جمع کل سال','','','','']]);
  r.getRange('B15').setFormula('=SUM(B2:B13)');
  r.getRange('C15').setFormula('=SUM(C2:C13)');
  r.getRange('D15').setFormula('=SUM(D2:D13)');
  r.getRange('E15').setFormula('=SUM(E2:E13)');
  r.getRange('A15:E15').setFontWeight('bold').setBackground('#dcfce7');
  r.setFrozenRows(1); r.autoResizeColumns(1,5);
}

function out(obj, code) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
