import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

function getSampleRate(name: string): number {
  const raw = process.env[name];

  if (raw === undefined) return 0.1;

  const value = Number(raw.trim());

  if (raw.trim() === '' || !Number.isFinite(value) || value < 0 || value > 1) {
    console.warn(
      `Invalid ${name}: expected a number between 0 and 1. Using default 0.1.`,
    );
    return 0.1;
  }

  return value;
}

// Ensure to call this before importing any other modules!
// Only initialize Sentry if not in test environment
if (process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      // Add our Profiling integration
      nodeProfilingIntegration(),
    ],

    // Add Tracing by setting tracesSampleRate
    // We recommend adjusting this value in production
    tracesSampleRate: getSampleRate('SENTRY_TRACES_SAMPLE_RATE'),

    // Set sampling rate for profiling
    // This is relative to tracesSampleRate
    profilesSampleRate: getSampleRate('SENTRY_PROFILES_SAMPLE_RATE'),
  });
}
