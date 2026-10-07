# Finanças Web

Front em Next.js (App Router), React e TypeScript para a API NestJS do projeto `financas-api`. Interface em português, responsiva e com dados reais da API.

## Executar localmente

Com Node.js 20.9 ou superior, instale e execute o front:

```powershell
cd C:\projetos\financas-web
npm install
npm run dev
```

Abra http://localhost:3001. Em outro terminal, mantenha a API em execução na porta 3000:

```powershell
cd C:\projetos\financas-api
pnpm start:dev
```

O endereço padrão da API é `http://localhost:3000`. Para usar outro endereço, crie `.env.local` na raiz de `financas-web` com `API_URL=https://endereco-da-api` (veja `.env.example`). Essa variável fica no servidor; não precisa habilitar CORS, pois o navegador faz as chamadas para o próprio Next.js.

## Funcionalidades

- Cadastro e login com os campos reais da API (`nome`, `login`, `senha`).
- Sessão em cookies HttpOnly e renovação automática via `/auth/refresh`.
- Logout com revogação do refresh token na API.
- Visão geral com total de contas, valores em aberto, valores pagos e progresso por quantidade de contas.
- Cadastro, busca, filtros, pagamento e exclusão de contas.
- Navegação por mês nas contas e na visão geral, preservada na URL.
- Recorrência mensal a partir do mês inicial e parcelas até a quantidade informada.
- Valor por parcela e indicação da parcela atual (ex.: 2 de 6).
- Pagamento separado para cada mês; excluir remove a conta de todos os meses após confirmação.
- Cadastro, busca, edição e exclusão de formas de pagamento.
- Seleção opcional de uma forma de pagamento no cadastro da conta, com exibição na tabela. O vínculo vale para todos os meses e parcelas; excluir a forma mantém as contas e seus pagamentos sem o vínculo.
- Troca ou remoção da forma diretamente no combobox da listagem de contas, com salvamento automático e toast. Durante a gravação os controles ficam bloqueados; uma falha restaura a seleção anterior. A visão geral continua somente para consulta.
- Edição do valor com dois cliques na célula. Enter/botão salva; Esc/botão cancela. Aceita vírgula ou ponto decimal, com até duas casas, sem arredondar valores inválidos. O total da seleção é atualizado após salvar; o novo valor vale para todos os meses/parcelas, inclusive meses pagos, sem alterar seus status ou datas.
- Estados de carregamento, erro e listas vazias; confirmação antes de pagar e excluir.
- Notificações no canto superior direito com fechamento automático, barra de tempo e botão para dispensar. O prazo pausa ao passar o mouse ou focar o aviso; erros de formulário e de carregamento permanecem junto ao conteúdo para permitir correção e nova tentativa.

A API recebe `formaPagamentoId` opcional no cadastro e retorna `formaPagamento` com `id` e `nome`. Apenas formas do usuário autenticado podem ser vinculadas. Contas existentes ou criadas sem seleção aparecem como “Não informada”. Não há vencimentos, receitas ou recuperação de senha nos endpoints atuais.

## Verificação e produção

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:smoke
npm start
```

Em produção, use HTTPS: os cookies recebem `Secure` quando `NODE_ENV=production`. O serviço Next.js precisa alcançar `API_URL`.

O proxy permite somente as rotas usadas pelo front, confere a origem das mutações, não expõe os tokens ao JavaScript e usa `no-store` para dados privados. A deduplicação de refresh é local ao processo; para operar múltiplas instâncias do Next.js, adote uma coordenação compartilhada da rotação de sessão.

O front é um projeto independente em `financas-web`, com suas próprias dependências, configurações e lockfiles. A API fica no projeto `financas-api`.

`test:smoke` precisa de um build prévio. Ele inicia uma API simulada e um Next.js em portas temporárias para verificar a integração HTTP sem tocar no banco real.
