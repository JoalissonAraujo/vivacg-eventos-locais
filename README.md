# VivaCG

Catálogo responsivo de eventos locais em Campina Grande, com pesquisa, filtros, detalhes e fluxo de reserva ou lista de interesse.

## Links

- **Aplicação publicada:** https://vivacg-eventos-locais.vercel.app/
- **Código-fonte:** https://github.com/JoalissonAraujo/vivacg-eventos-locais

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
- Vercel para publicação contínua;
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

A versão atual possui 13 testes automatizados para validação, reservas, favoritos, códigos individuais, migração de dados e cancelamentos.

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

Para que o MVP funcione sem credenciais externas, favoritos, reservas e ingressos são armazenados no `localStorage`. A escolha permite executar e demonstrar toda a jornada sem configurar servidor, banco ou segredos. Os dados persistem após recarregar a página, mas pertencem somente ao navegador em que foram criados.

A disponibilidade é recalculada localmente após criação, ampliação ou cancelamento de reservas. Reservas confirmadas consomem vagas; lista de interesse e ingressos cancelados não consomem. O limite de quatro ingressos é verificado na interface e no serviço.

Cada reserva recebe um código de grupo e cada ingresso recebe um código próprio, gerados com `crypto.randomUUID()`. E-mails são normalizados, registros cancelados permanecem no histórico e dados de versões anteriores são migrados automaticamente.

Para uma versão multiusuário, eventos e reservas seriam persistidos no Supabase por uma Edge Function. A função validaria capacidade de maneira transacional, impediria concorrência sobre a última vaga e manteria credenciais privilegiadas fora do navegador. Favoritos poderiam continuar locais.

O modelo PostgreSQL não permite preço negativo, evento com término anterior ao início, mais de quatro ingressos ou duas reservas do mesmo e-mail no mesmo evento. Códigos são únicos, existe apenas um ingresso principal por reserva e as tabelas usam Row Level Security. Não há política pública para leitura de reservas ou ingressos.

## Uso de inteligência artificial

A IA foi utilizada para apoiar decomposição do problema, definição do MVP, estrutura inicial dos componentes, revisão de acessibilidade, modelagem de dados e documentação. Todas as decisões foram revisadas considerando o limite de tempo e os critérios do edital.

Prompts relevantes devem ser registrados durante o desenvolvimento real. Exemplos:

- “Analise o edital e separe requisitos obrigatórios, restrições e critérios de avaliação.”
- “Proponha um MVP de eventos locais executável em quatro horas, sem inventar requisitos.”
- “Revise este formulário React quanto a validação, feedback e acessibilidade básica.”
- “Modele as tabelas mínimas para eventos e reservas no PostgreSQL com integridade e RLS.”

## Limitações

- dados de eventos são fictícios e locais;
- favoritos, reservas e ingressos ficam somente no navegador atual;
- dados não são compartilhados entre dispositivos ou navegadores;
- limpar os dados do site remove o histórico local;
- a quantidade de vagas não é sincronizada entre visitantes diferentes;
- não há autenticação, envio real de e-mail ou painel administrativo;
- códigos de ingresso são demonstrativos e não possuem validação presencial;
- imagens demonstrativas dependem de conexão com a internet;
- `localStorage` não deve armazenar dados sensíveis em uma versão comercial.

## Próximos passos

1. Integrar leitura de eventos ao Supabase.
2. Criar Edge Function para reservas, tokens de gerenciamento e controle transacional de vagas.
3. Adicionar recuperação segura da reserva por e-mail.
4. Implementar autenticação e painel para organizadores.
5. Adicionar validação de ingresso por QR Code.
6. Ampliar testes de componentes e acessibilidade.

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
