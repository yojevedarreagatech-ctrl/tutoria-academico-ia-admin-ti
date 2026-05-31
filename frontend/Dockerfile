FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY tsconfig.json next-env.d.ts next.config.ts postcss.config.js tailwind.config.ts /app/
COPY app /app/app
COPY components /app/components
COPY lib /app/lib
COPY types /app/types

EXPOSE 3000

CMD ["npm", "run", "dev"]
