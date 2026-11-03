const SHEET_ID = '1Xm_EC4PS4I_kRQ2ucuVxBR-BDL31xj-Q16DJJZ7EBKk';
const TAB_NAME = 'Respostas';
const TARGET_GID = 1308743066;

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

function doGet(e) {
  if (e && e.parameter && e.parameter.resposta_roleta) {
    const sheet = getSheet_();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['data_hora', 'resposta_roleta']);
    }
    sheet.appendRow([
      e.parameter.data_hora || new Date().toISOString(),
      e.parameter.resposta_roleta
    ]);
    return json_({ ok: true, saved: true });
  }
  return json_({ ok: true, service: 'roleta' });
}

// Execute manualmente no editor apenas para validar o acesso à planilha.
function testeManual() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['data_hora', 'resposta_roleta']);
  }
  sheet.appendRow([new Date(), 'TESTE_MANUAL']);
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const byGid = ss.getSheets().find(sheet => sheet.getSheetId() === TARGET_GID);
  return byGid || ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
