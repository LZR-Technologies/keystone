// Refuses code that leaks a secret — the most critical security guard.
// Deterministic, no AI. See docs/seguranca.md item 1.3.
//
// The patterns are assembled from parts on purpose: written whole, this file
// would match its own definitions and flag itself. Split, the detector never
// recognizes itself — yet still catches real secrets. No exceptions needed.

import type { Finding, Guard } from './types.ts';

const AWS_KEY = new RegExp('AKIA' + '[0-9A-Z]{16}');
const API_ASSIGNMENT = new RegExp(
  '(?:api[_-]?key|secret|token)\\s*[:=]\\s*[\'"][^\'"]{12,}[\'"]',
  'i',
);
const PRIVATE_KEY = new RegExp('-----BEGIN (?:RSA |EC )?PRIVATE ' + 'KEY-----');

const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'AWS access key', re: AWS_KEY },
  { name: 'API key / token assignment', re: API_ASSIGNMENT },
  { name: 'Private key block', re: PRIVATE_KEY },
];

export const scanSecrets: Guard = (file, content) => {
  const findings: Finding[] = [];
  content.split('\n').forEach((text, index) => {
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(text)) {
        findings.push({
          guard: 'secrets',
          file,
          line: index + 1,
          message: `Possible exposed secret (${name})`,
        });
      }
    }
  });
  return findings;
};
