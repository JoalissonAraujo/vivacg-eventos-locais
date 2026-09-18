# VivaCG

Catálogo responsivo de eventos locais em Campina Grande, com pesquisa, filtros, detalhes e fluxo de reserva ou lista de interesse.

## Problema e proposta

Eventos locais costumam ficar dispersos em diferentes redes sociais. O VivaCG reúne informações essenciais em uma jornada curta: descobrir um evento, consultar os detalhes e reservar uma vaga.

O projeto foi pensado como MVP para o desafio de estágio da InovatechIA. Prioriza funcionamento, experiência, responsividade, acessibilidade básica e clareza de implementação.

## Escopo entregue

- catálogo com seis eventos de exemplo;
- pesquisa por evento ou local;
- filtros por categoria, data e disponibilidade;
- detalhes completos em uma janela responsiva;
- reserva ou lista de interesse;
- validação de nome, e-mail e quantidade;
- prevenção local de reserva duplicada;
- atualização local das vagas após a reserva;
- comprovante copiável com código da solicitação;
- área “Minhas reservas” com histórico deste navegador;
- favoritos locais e filtro para exibir somente eventos salvos;
- ampliação segura de uma reserva existente, com convidado opcional;
- remoção de vaga adicional e cancelamento sem apagar o histórico;
- detalhes da reserva com código do grupo e código exclusivo para cada ingresso;
- cancelamento individual de ingresso adicional, mantendo seu histórico;
- estados vazio, carregando, erro e sucesso;
- layout adaptado para celular e desktop;
- modelo PostgreSQL/Supabase com integridade, índices e RLS.

## Tecnologias

- React 19 e TypeScript;
- Vite;
- React Hook Form e Zod;
- Lucide React;
- CSS responsivo próprio;
- Vitest;
- PostgreSQL/Supabase planejado em `supabase/schema.sql`.

## Executar no VS Code (PowerShell)

Abra a pasta `vivacg` no VS Code. No terminal integrado, execute:

```powershell
npm install
npm run dev
```

O terminal mostrará um endereço semelhante a `http://localhost:5173`.

Para validar a entrega:

```powershell
npm run test
npm run lint
npm run build
```

## Iniciar o versionamento Git

```powershell
git init
git add .
git commit -m "feat: implementa MVP de eventos locais"
git branch -M main
```

Depois de criar um repositório vazio no GitHub, conecte-o usando a URL fornecida pela plataforma:

```powershell
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## Decisões técnicas

Os eventos estão isolados em `src/data/events.ts` e a persistência em `src/services/reservationsService.ts`. Essa separação permite trocar os dados locais pelo Supabase sem reescrever os componentes visuais.

Para que o MVP funcione sem credenciais externas, as reservas são armazenadas no `localStorage` do navegador. Isso é adequado apenas para demonstração. O esquema SQL incluído mostra a evolução prevista para um backend real.

O banco não permite preço negativo, evento com término anterior ao início, quantidade fora do intervalo de 1 a 4 ou duas reservas do mesmo e-mail no mesmo evento. As tabelas usam Row Level Security. Não foi criada uma política pública para ler reservas, protegendo os dados de participantes.

## Uso de inteligência artificial

A IA foi utilizada para apoiar decomposição do problema, definição do MVP, estrutura inicial dos componentes, revisão de acessibilidade, modelagem de dados e documentação. Todas as decisões foram revisadas considerando o limite de tempo e os critérios do edital.

Prompts relevantes devem ser registrados durante o desenvolvimento real. Exemplos:

- “Analise o edital e separe requisitos obrigatórios, restrições e critérios de avaliação.”
- “Proponha um MVP de eventos locais executável em quatro horas, sem inventar requisitos.”
- “Revise este formulário React quanto a validação, feedback e acessibilidade básica.”
- “Modele as tabelas mínimas para eventos e reservas no PostgreSQL com integridade e RLS.”

## Limitações

- dados de eventos são fictícios e locais;
- a reserva fica apenas no navegador atual;
- não há autenticação, envio real de e-mail ou painel administrativo;
- imagens demonstrativas dependem de conexão com a internet;
- a disponibilidade exibida ainda não é recalculada após a reserva local.

## Próximos passos

1. Integrar leitura de eventos ao Supabase.
2. Criar Edge Function para reservas e controle transacional de vagas.
3. Implementar autenticação e painel para organizadores.
4. Adicionar cancelamento, favoritos e notificações.
5. Realizar testes de acessibilidade e de componentes mais amplos.

## Estrutura principal

```text
src/
├── components/   # componentes da interface
├── data/         # eventos fictícios
├── lib/          # formatação de data e preço
├── schemas/      # validação e testes
├── services/     # persistência de reservas
└── types/        # contratos TypeScript
```
