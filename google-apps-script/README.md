# Integração com a planilha

1. Abra a planilha e vá em `Extensões > Apps Script`.
2. Cole o conteúdo de `Code.gs` no editor e salve.
3. Em `Implantar > Nova implantação`, escolha `App da Web`.
4. Execute como você e permita acesso a `Qualquer pessoa`.
5. Copie a URL terminada em `/exec`.
6. Cole essa URL em `CONFIG.sheetsEndpoint`, no início de `index.html`.

Para atualizar o código sem trocar a URL: `Implantar > Gerenciar implantações > ✏️ Editar > Versão: Nova versão > Implantar`.

A aba `Respostas` será criada automaticamente com as colunas `data_hora` e `resposta_roleta`.

## Aba `Estoque` (totais de brindes e prêmios)

Criada automaticamente na primeira consulta do jogo (ou crie à mão):

| item    | total |
|---------|-------|
| brindes | 100   |
| premios | 10    |

- Edite a coluna `total` direto na planilha ou pelo painel da organização (`#organizacao`) de qualquer aparelho.
- Todos os aparelhos com o jogo aberto recebem o novo total em até 20 segundos.
- Restante = total − baixas da aba `Respostas` (linhas com `direito` = `simples`/`top` depois da última linha `zerar`; `CANCELADO` em `brinde_entregue` devolve ao estoque).
