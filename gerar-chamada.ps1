# Gera o chamada.html com os banners (banner.html e garra.html) embutidos, para funcionar aberto direto do disco,
# em qualquer navegador e na Vercel, sem depender de arquivos carregados de dentro da página.
# Rode de novo sempre que alterar o banner.html ou o garra.html:   powershell -ExecutionPolicy Bypass -File gerar-chamada.ps1
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$slides = @('banner.html', 'garra.html')          # ordem de exibição: roleta, depois garra

$pages = foreach ($s in $slides) {
  $html = [System.IO.File]::ReadAllText((Join-Path $dir $s), [System.Text.Encoding]::UTF8)
  (ConvertTo-Json $html -Compress).Replace('</', '<\/')   # "<\/" evita fechar o <script> de fora por engano
}
$list = '[' + ($pages -join ",`n") + ']'

$template = @'
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#002233">
<meta name="robots" content="noindex,nofollow">
<title>Chamadas · Cyber Shield Game</title>
<style>
  html, body { height: 100%; margin: 0; background: #002233; overflow: hidden; }
  iframe { position: fixed; inset: 0; width: 100%; height: 100%; border: 0; opacity: 0; transition: opacity .8s ease; background: #002233; }
  iframe.on { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { iframe { transition: none; } }
</style>
</head>
<body>
<!-- ARQUIVO GERADO por gerar-chamada.ps1: não edite aqui; altere o banner.html ou o garra.html e rode o script de novo.
     Exibição em loop para a TV: um banner depois do outro, sem parar. Abra em tela cheia (F11).
     O tempo de cada banner (segundos) é 15; para mudar, use ?s=20 no endereço. -->
<script>
const PAGES = /*PAGES*/;
const SECONDS = Math.max(6, +new URLSearchParams(location.search).get('s') || 15);

const frames = PAGES.map(() => {
  const f = document.createElement('iframe');
  f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
  document.body.appendChild(f);
  return f;
});
let cur = -1;
function show(i) {
  const f = frames[i];
  let done = false;
  const go = () => {
    if (done) return; done = true;
    if (cur >= 0 && cur !== i) frames[cur].classList.remove('on');
    f.classList.add('on'); cur = i;
    setTimeout(() => show((i + 1) % PAGES.length), SECONDS * 1000);
  };
  f.onload = () => setTimeout(go, 300);
  setTimeout(go, 3000);                                            // se demorar a carregar, segue mesmo assim
  f.srcdoc = PAGES[i] + '<!-- ' + Date.now() + ' -->';             // recarrega o banner para a animação recomeçar do início
}
show(0);
/* o ponteiro do mouse aparece ao mexer e some depois de 3 segundos parado (tela de exibição) */
(function cursorAuto() {
  let t = 0;
  const hide = () => { document.body.style.cursor = 'none'; };
  const show = () => { document.body.style.cursor = ''; clearTimeout(t); t = setTimeout(hide, 3000); };
  addEventListener('mousemove', show); show();
})();</script>
</body>
</html>
'@

$out = $template.Replace('/*PAGES*/', $list)
[System.IO.File]::WriteAllText((Join-Path $dir 'chamada.html'), $out, (New-Object System.Text.UTF8Encoding($false)))
"chamada.html gerado ({0:N0} KB)" -f ((Get-Item (Join-Path $dir 'chamada.html')).Length / 1KB)
