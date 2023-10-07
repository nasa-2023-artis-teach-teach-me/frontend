FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json package.json
RUN bun i --ignore-scripts

COPY . .

ENV NODE_ENV=production

RUN bun run build

FROM oven/bun:latest

WORKDIR /app

COPY --from=builder /app/build /app
RUN bun i --prod --verbose

EXPOSE 3000

CMD ["bun", "start"]
