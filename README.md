# Hafaloha

Monorepo containing the Hafaloha e-commerce platform.

## Structure

```
hafaloha/
├── api/          # Rails 8 API
├── web/          # React 19 + Vite Frontend
└── README.md
```

## Getting Started

### API (Rails)

```bash
cd api
bundle install
rails db:setup
rails server -p 3000
```

### Web (React)

```bash
cd web
npm install
npm run dev
```

## Development

- **API** runs on `http://localhost:3000`
- **Web** runs on `http://localhost:5173`

## Deployment

- **API**: Render (render.com)
- **Web**: Netlify

## History

This monorepo was created by combining:
- `hafaloha-api` (Rails backend)
- `hafaloha-web` (React frontend)

Full git history from both repos is preserved.
