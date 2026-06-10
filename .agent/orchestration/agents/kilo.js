/**
 * Kilo — infra + CI/CD agent.
 *
 * Generates and validates:
 *   - Vercel project config
 *   - GitHub Actions workflows
 *   - Environment / secret plan
 */

const fs = require('node:fs');
const path = require('node:path');

const WORKFLOWS = {
  ci: {
    file: '.github/workflows/ci.yml',
    triggers: ['push', 'pull_request'],
    jobs: ['lint', 'typecheck', 'test', 'build'],
  },
  deploy: {
    file: '.github/workflows/deploy.yml',
    triggers: ['push:main'],
    jobs: ['build', 'vercel-deploy'],
  },
};

function planInfra(payload) {
  const target = payload.target || 'vercel';
  return {
    target,
    region: payload.region || 'sin1',
    runtime: payload.runtime || 'nodejs20.x',
    buildCommand: payload.buildCommand || 'next build',
    outputDir: payload.outputDir || '.next',
    env: payload.env || ['DATABASE_URL', 'NEXTAUTH_SECRET', 'API_KEY'],
    workflows: WORKFLOWS,
  };
}

function emitWorkflows(payload, ctx) {
  const repoRoot = path.resolve(ctx.hubRoot, '..');
  const targetDir = path.join(repoRoot, '.github', 'workflows');
  fs.mkdirSync(targetDir, { recursive: true });

  const ci = `name: ci
on:
  push:
    branches: [main, develop]
  pull_request:
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm test --if-present
  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
`;

  const deploy = `name: deploy
on:
  push:
    branches: [main]
jobs:
  vercel-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/setup@v4
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;

  fs.writeFileSync(path.join(targetDir, 'ci.yml'), ci, 'utf8');
  fs.writeFileSync(path.join(targetDir, 'deploy.yml'), deploy, 'utf8');

  return { emitted: ['.github/workflows/ci.yml', '.github/workflows/deploy.yml'] };
}

module.exports = {
  name: 'kilo',
  planInfra,
  emitWorkflows,
  handle: async (payload, ctx) => {
    if (payload.op === 'plan') return planInfra(payload);
    if (payload.op === 'emit-workflows') return emitWorkflows(payload, ctx);
    return planInfra(payload);
  },
};
