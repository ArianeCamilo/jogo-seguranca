$root = $PSScriptRoot
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.webp' = 'image/webp'; '.ttf' = 'font/ttf'; '.woff2' = 'font/woff2' }
$l = [System.Net.HttpListener]::new()
$l.Prefixes.Add('http://localhost:5173/')
$l.Start()
while ($l.IsListening) {
  $c = $l.GetContext()
  $path = $c.Request.Url.LocalPath
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
  if ((Test-Path $file -PathType Leaf) -and $file.StartsWith($root)) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $c.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
    $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
