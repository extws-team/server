import { eslint } from '@kirick/lint/eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
	{
		ignores: ['_MIGRATE_OLD_*', 'oxlint.config.ts'],
	},
	eslint,
);
