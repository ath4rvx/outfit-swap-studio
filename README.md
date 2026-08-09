# Outfit Swap Studio — deployable

This is a full-stack Express app. The browser serves the UI, while `/api/outfit-swap`
keeps the OpenAI API key on the server.

## Local

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env
# put your OpenAI API key in .env
npm start
```

Open http://localhost:3000

Health check: http://localhost:3000/health

## Deploy to Render

1. Put this folder in a GitHub repository.
2. In Render, create **New → Web Service** and connect that repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable:
   - `OPENAI_API_KEY` = your OpenAI API key
6. Deploy.

The included `render.yaml` can also be used as a Blueprint.

Do not put your API key into `public/app.js` or any browser-side file.

## Important

Image generation uses an OpenAI image-generation model and can incur API usage charges.
The exact model availability and pricing are controlled by your OpenAI API account.
