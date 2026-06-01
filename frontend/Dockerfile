FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm ci

FROM node:20-alpine AS dev

WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json package-lock.json /app/
COPY tsconfig.json next-env.d.ts next.config.ts postcss.config.js tailwind.config.ts /app/
COPY app /app/app
COPY components /app/components
COPY lib /app/lib
COPY types /app/types

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:8088/api
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8088/ws
ARG NEXT_PUBLIC_VOICE_AGENT_SILENCE_MS=1500

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_VOICE_AGENT_SILENCE_MS=$NEXT_PUBLIC_VOICE_AGENT_SILENCE_MS

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json package-lock.json /app/
COPY tsconfig.json next-env.d.ts next.config.ts postcss.config.js tailwind.config.ts /app/
COPY app /app/app
COPY components /app/components
COPY lib /app/lib
COPY types /app/types

RUN npm run build

FROM node:20-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone /app/
COPY --from=builder /app/.next/static /app/.next/static
EXPOSE 3000

CMD ["node", "server.js"]
