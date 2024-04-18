FROM node:10.20.1-alpine

WORKDIR /app

ARG SENTRY_AUTH_TOKEN=""

ARG APP_RELEASE=unknown
ENV APP_RELEASE="${APP_RELEASE}"

COPY .git /app
COPY package.json /app
COPY yarn.lock /app
COPY scripts /app/scripts/
COPY packages/libs /app/packages/libs/
COPY packages/affiliates-api /app/packages/affiliates-api/
COPY packages/common /app/packages/common/
COPY packages/credentials /app/packages/credentials/
COPY packages/data-access-layer /app/packages/data-access-layer/

RUN \
    # gcc & python needed to build some native dependencies
    apk add --no-cache bash git python make gcc g++ libc-dev && \
    yarn install --frozen-lockfile && \
    yarn workspace @pf/utils run build && \
    yarn workspace @pf/taxonomies run build && \
    yarn workspace @pf/workers-dtos run build && \
    yarn workspace @pf/integrations run build && \
    yarn workspace @pf/domain run build && \
    cd /app/packages/affiliates-api && \
    yarn build && \
    # upload source maps and release information to sentry
    # for runtime error tracking
    SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} ./sentry-release.sh && \
    # we don't need git history at runtime
    rm -rf /app/.git

ARG PORT=80
ENV PORT=${PORT}

CMD cd /app/packages/affiliates-api && yarn start
