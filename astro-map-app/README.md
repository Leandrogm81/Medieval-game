# AstroMap - Mapa Astral com IA

Aplicativo web completo para cálculo e interpretação de mapas astrais, com relatórios gerados por inteligência artificial.

## Funcionalidades

- **Cálculo Preciso**: Usa Swiss Ephemeris (WASM) para cálculos astronômicos profissionais
- **Mapa Visual**: Roda zodiacal SVG interativa com planetas, casas e aspectos
- **Dois Sistemas de Casas**: Placidus e Signos Inteiros (Whole Signs)
- **Relatório IA**: Geração de interpretações completas via OpenRouter (múltiplos modelos)
- **Revolução Solar**: Cálculo de trânsitos e previsões anuais
- **Exportar PDF**: Download do relatório completo
- **Salvar Localmente**: Mapas salvos no localStorage (sem cadastro)

## 📋 PASSO A PASSO: Como colocar a API dentro do app

### 1. Estrutura da API

A API está localizada em:
```
src/app/api/report/route.ts
```

Este arquivo faz:
- Recebe dados do mapa astral do frontend
- Chama a API da OpenRouter **no servidor** (chave fica segura)
- Retorna o relatório formatado

### 2. Configurar a Chave API

**Passo 2.1** - Copie o arquivo de exemplo:
```bash
cp .env.local.example .env.local
```

Ou no Windows:
```cmd
copy .env.local.example .env.local
```

**Passo 2.2** - Obtenha sua chave gratuita:
1. Acesse: https://openrouter.ai/keys
2. Clique em "Create API Key"
3. Copie a chave (começa com `sk-or-v1-`)

**Passo 2.3** - Edite o arquivo `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-sua-chave-real-aqui
```

⚠️ **IMPORTANTE**: Nunca commit este arquivo! Ele está no `.gitignore`.

### 3. Rodar o App

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### 4. Como funciona o fluxo

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │ ───> │  Seu Server  │ ───> │  OpenRouter │
│  (Frontend) │      │   (Next.js)  │      │    (IA)     │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                     │
       │  1. Envia dados     │  2. Chama API       │
       │     do mapa         │     com API Key     │
       │                     │                     │
       │  4. Mostra          │  3. Retorna         │
       │     relatório       │     relatório       │
       │                     │                     │
```

**Segurança**: A chave API fica apenas no servidor, nunca chega ao navegador!

## 🤖 Modelos de IA Disponíveis

Você pode escolher entre 5 modelos diferentes:

| Modelo | Qualidade | Custo Aproximado | Melhor Para |
|--------|-----------|------------------|-------------|
| **Gemini 2.5 Flash** | ⭐⭐⭐⭐ | ~R$0.80 | Uso geral, equilibrado |
| **Gemini 2.0 Flash Lite** | ⭐⭐⭐ | ~R$0.40 | Orçamento limitado |
| **DeepSeek V3** | ⭐⭐⭐⭐⭐ | ~R$0.50 | Textos em português |
| **Claude 3.5 Sonnet** | ⭐⭐⭐⭐⭐ | ~R$2.00 | Máxima qualidade |
| **Llama 3.3 70B** | ⭐⭐⭐⭐ | ~R$0.30 | Open source |

## 🚀 Deploy

### Opção 1: Vercel (Recomendado)

1. Push para GitHub
2. Importe na Vercel
3. Adicione a variável de ambiente `OPENROUTER_API_KEY`
4. Deploy automático!

### Opção 2: Servidor Próprio

```bash
# Build
npm run build

# Iniciar
npm start
```

O app roda na porta 3000 por padrão.

### Opção 3: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
ENV PORT=3000
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
CMD ["npm", "start"]
```

## 💰 Custos

- **OpenRouter**: Pay-per-use (pague pelo que usar)
- **Créditos**: Adicione créditos na sua conta OpenRouter
- **Estimativa**: Cada relatório custa entre R$0.30 e R$2.00 dependendo do modelo

## 🔒 Segurança

✅ Chave API fica no servidor (`.env.local`)
✅ Nunca é exposta no frontend
✅ Chamadas são feitas internamente
✅ `.env.local` está no `.gitignore`

## 🛠️ Tecnologias

- **Framework**: Next.js 15 + React 19 + TypeScript
- **Estilização**: Tailwind CSS 4
- **Efemérides**: sweph-wasm (Swiss Ephemeris)
- **IA**: OpenRouter API (múltiplos modelos)
- **PDF**: @react-pdf/renderer

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar em produção
npm start

# Lint
npm run lint
```

## 🐛 Troubleshooting

### "Chave API não configurada"
Verifique se o arquivo `.env.local` existe e tem a chave correta.

### "Erro 401 na API"
Sua chave pode estar inválida ou sem créditos. Verifique em openrouter.ai

### "Modelo não encontrado"
Alguns modelos podem ficar indisponíveis. Tente outro da lista.

## 📄 Licença

MIT License - Uso livre.

**Nota**: Swiss Ephemeris é AGPL-3.0. Para uso comercial, verifique em astro.com.

## 🙏 Créditos

- Swiss Ephemeris: https://www.astro.com/swisseph/
- OpenRouter: https://openrouter.ai/
- OpenStreetMap: https://nominatim.org/
