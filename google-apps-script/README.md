# Integração com a planilha

1. Abra a planilha e vá em `Extensões > Apps Script`.
2. Cole o conteúdo de `Code.gs` no editor e salve.
3. Em `Implantar > Nova implantação`, escolha `App da Web`.
4. Execute como você e permita acesso a `Qualquer pessoa`.
5. Copie a URL terminada em `/exec`.
6. Cole essa URL em `CONFIG.sheetsEndpoint`, no início de `roleta.html`.

A aba `Respostas` será criada automaticamente com as colunas `data_hora` e `resposta_roleta`.
