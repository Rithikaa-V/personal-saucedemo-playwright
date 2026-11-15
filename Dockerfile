FROM mcr.microsoft.com/playwright:v1.65.1-noble
WORKDIR /app
ENV CI=1 HOME=/root

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx tsc --noEmit

CMD ["npx", "playwright", "test"]
