const SHEET_ID = '1Xm_EC4PS4I_kRQ2ucuVxBR-BDL31xj-Q16DJJZ7EBKk';
const TAB_NAME = 'Respostas';

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return json_({ ok: false, error: 'doPost deve ser chamado por uma requisição POST; não execute esta função manualmente.' });
  }
  const data = JSON.parse(e.postData.contents || '{}');
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['data_hora', 'resposta_roleta']);
  }
  sheet.appendRow([
    data.data_hora || new Date().toISOString(), data.resposta_roleta || ''
  ]);
  return json_({ ok: true });
}

function doGet() { return json_({ ok: true, service: 'roleta' }); }

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
