import { defineConfig } from '@lingui/conf'

export default defineConfig({
  sourceLocale: 'fr',
  locales: ['fr'],
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src'],
    },
  ],
  format: 'po',
})
