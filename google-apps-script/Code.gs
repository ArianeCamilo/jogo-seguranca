const SHEET_ID = '1Xm_EC4PS4I_kRQ2ucuVxBR-BDL31xj-Q16DJJZ7EBKk';
const TAB_NAME = 'Respostas';
const TARGET_GID = 1308743066;

// As colunas A e B continuam as mesmas de antes (data_hora, resposta_roleta); as demais são novas.
// O jogo preenche "direito" (simples ou top) e "resposta_correta". A equipe preenche só "brinde_entregue".
const HEADER = ['data_hora', 'resposta_roleta', 'evento', 'fatia', 'tema', 'pergunta', 'acertou', 'detalhe', 'id', 'direito', 'brinde_entregue', 'resposta_correta'];
const COL = {};
HEADER.forEach(function (name, i) { COL[name] = i; });   // COL.direito = índice 0-based da coluna
const EVENTS = ['quiz', 'quiz_abandonado', 'protecao_total', 'protecao_abandonada', 'premio_entregue', 'zerar'];
const DIREITOS = ['simples', 'top'];
const MAX_LEN = 300;        // tamanho máximo de cada campo
const DEDUPE_ROWS = 500;    // quantas linhas recentes são conferidas para evitar registro duplicado
const TIMEZONE = 'America/Sao_Paulo';

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return json_({ ok: false, error: 'doPost deve ser chamado por uma requisição POST; não execute esta função manualmente.' });
  }
  let data;
  try { data = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, error: 'JSON inválido' }); }
  return json_(save_(data));
}

// O jogo envia por GET (carregado como <script>) e espera a resposta no formato callback({...}) como confirmação de gravação.
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.acao === 'estoque') return reply_(estoque_(), p.callback);
  if (p.resposta_roleta || p.evento) return reply_(save_(p), p.callback);
  return reply_({ ok: true, service: 'roleta' }, p.callback);
}

// Execute manualmente no editor apenas para validar o acesso à planilha.
function testeManual() {
  Logger.log(JSON.stringify(save_({ evento: 'quiz', resposta_roleta: 'TESTE_MANUAL', detalhe: 'teste manual' })));
}

function save_(p) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return { ok: false, error: 'ocupado' };
  }
  try {
    const sheet = getSheet_();
    ensureHeader_(sheet);
    const id = text_(p.id);
    if (id && isDuplicate_(sheet, id)) return { ok: true, saved: false, duplicate: true };
    const evento = EVENTS.indexOf(p.evento) >= 0 ? p.evento : (p.evento ? 'outro' : '');
    const acertou = p.acertou === 'sim' || p.acertou === 'não' ? p.acertou : '';
    const direito = DIREITOS.indexOf(p.direito) >= 0 ? p.direito : '';
    sheet.appendRow([
      date_(p.data_hora), text_(p.resposta_roleta), evento, text_(p.fatia), text_(p.tema),
      text_(p.pergunta), acertou, text_(p.detalhe), id, direito, '', text_(p.resposta_correta)
    ]);
    return { ok: true, saved: true };
  } catch (err) {
    return { ok: false, error: 'falha ao gravar' };
  } finally {
    lock.releaseLock();
  }
}

// Cria o cabeçalho (ou completa o antigo de 2 colunas) uma única vez, dentro do bloqueio.
function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    format_(sheet);
    return;
  }
  const first = sheet.getRange(1, 1, 1, HEADER.length).getValues()[0];
  if (first[0] === 'data_hora' && first.join('|') !== HEADER.join('|')) {
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
    format_(sheet);
  }
}

// Roda junto com o cabeçalho (uma vez): cores em "acertou", lista em "direito" e dica em "brinde_entregue".
function format_(sheet) {
  const colLetter = function (name) { return String.fromCharCode(65 + COL[name]); };
  const acertou = sheet.getRange(colLetter('acertou') + '2:' + colLetter('acertou'));
  const rules = sheet.getConditionalFormatRules();
  rules.push(
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('sim').setBackground('#B7E1CD').setRanges([acertou]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('não').setBackground('#F4CCCC').setRanges([acertou]).build()
  );
  sheet.setConditionalFormatRules(rules);
  sheet.getRange(colLetter('direito') + '2:' + colLetter('direito')).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(DIREITOS, true).setAllowInvalid(false).build());
  sheet.getRange(1, COL.brinde_entregue + 1).setNote(
    'Digite o item entregue (ex.: caneca). Para devolver o prêmio ao estoque (quem não retirou), digite CANCELADO.');
  sheet.getRange(1, COL.direito + 1).setNote('Preenchido pelo jogo: simples (brinde) ou top (prêmio da Proteção Total). Pode ser corrigido na lista.');
}

// Contagem para o jogo decidir se a roda ainda pode cair em Proteção Total.
// Conta só as linhas depois da última marca "zerar". Um prêmio top vale como usado assim que o jogo o gera;
// vira "entregue" quando a equipe preenche brinde_entregue, e volta ao estoque se a equipe digitar CANCELADO.
function estoque_() {
  const out = { ok: true, top_usados: 0, top_entregues: 0, top_pendentes: 0, top_cancelados: 0, simples_entregues: 0, simples_pendentes: 0 };
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return out;
  const rows = sheet.getRange(2, 1, last - 1, HEADER.length).getValues();
  let from = 0;
  rows.forEach(function (r, i) { if (r[COL.evento] === 'zerar') from = i + 1; });
  for (let i = from; i < rows.length; i++) {
    const direito = norm_(rows[i][COL.direito]);
    if (direito !== 'top' && direito !== 'simples') continue;
    const brinde = norm_(rows[i][COL.brinde_entregue]);
    if (direito === 'top') {
      if (isCancel_(brinde)) out.top_cancelados++;
      else if (brinde) { out.top_entregues++; out.top_usados++; }
      else { out.top_pendentes++; out.top_usados++; }
    } else if (!isCancel_(brinde)) {
      if (brinde) out.simples_entregues++; else out.simples_pendentes++;
    }
  }
  return out;
}

function norm_(value) {
  return String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function isCancel_(brinde) {
  return /^(cancel|nao retir|devolv)/.test(brinde);
}

function isDuplicate_(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const n = Math.min(DEDUPE_ROWS, last - 1);
  const col = HEADER.indexOf('id') + 1;
  return sheet.getRange(last - n + 1, col, n, 1).getValues().some(function (r) { return r[0] === id; });
}

// Texto seguro para a planilha: sem quebras de linha, com tamanho limitado e sem virar fórmula (=, +, -, @).
function text_(value) {
  let s = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, MAX_LEN);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function date_(value) {
  const d = value ? new Date(value) : new Date();
  return Utilities.formatDate(isNaN(d.getTime()) ? new Date() : d, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
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

// Com ?callback=nome devolve JavaScript (callback({...})) para o jogo confirmar a gravação; sem ele, JSON comum.
function reply_(value, callback) {
  if (callback && /^[A-Za-z_$][\w$]{0,60}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(value) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(value);
}
