# Yield 360

Monorepo para uma aplicacao de gestao de financas pessoais e planeamento patrimonial.

## Apps

- `apps/web`: frontend React + Vite + TailwindCSS preparado para Cloudflare Pages.
- `apps/api`: API REST em Cloudflare Workers com Hono e persistencia em Cloudflare D1.
- `packages/shared`: dados partilhados entre frontend e backend.

## Desenvolvimento local

1. Instale dependencias na raiz:

   ```bash
   npm install
   ```

2. Crie uma base D1 e atualize o binding no `apps/api/wrangler.toml`:

   ```bash
   npx wrangler d1 create yield-360-db
   npx wrangler d1 execute yield-360-db --file migrations/0001_init.sql --remote
   ```

3. Crie um ficheiro `.env` na raiz a partir de `.env.example` e preencha os valores Cloudflare:

   ```bash
   CLOUDFLARE_API_TOKEN="<token>"
   CLOUDFLARE_ACCOUNT_ID="72b4c01fe2cc0314c7fccbcd977986f0"
   CLOUDFLARE_PAGES_PROJECT_NAME="yield-360-web"
   ```

4. Arranque frontend e worker em paralelo:

   ```bash
   npm run dev
   ```

5. Aceda ao frontend em `http://127.0.0.1:5174`. Se a porta estiver ocupada, o Vite escolhe automaticamente a proxima disponivel e mostra o URL no terminal.

O `npm run dev` em `apps/web` liga-se por omissao ao worker publicado em Cloudflare (`https://yield-360-api.yield360app.workers.dev`). Se precisar de apontar para outro endpoint, defina `VITE_API_BASE_URL` num `.env` dentro de `apps/web`.

## Deploy

- Frontend: `npm run deploy:web`.
- API: `npm run deploy:api`.

Os scripts de deploy leem sempre o `.env` da raiz antes de chamar o Wrangler. Assim, o token usado e o `CLOUDFLARE_ACCOUNT_ID` ficam alinhados com o projeto, sem depender da sessao autenticada local.

O `npm run build` da monorepo nao exige credenciais Cloudflare para a API. O passo `@yield-360/api:build` faz apenas um bundle local com `wrangler deploy --dry-run`, por isso funciona em CI do Cloudflare Pages sem `CLOUDFLARE_API_TOKEN`.

Para a API publicada funcionar com D1, o binding `DB` do Worker precisa apontar para uma base existente e o schema SQL precisa estar aplicado. Se a API responder com `503`, confirme o bloco `[[d1_databases]]` em `apps/api/wrangler.toml` e execute a migracao `migrations/0001_init.sql` na base remota.