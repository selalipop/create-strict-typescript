export const STRICT_COMPILER_OPTIONS = {
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  useUnknownInCatchVariables: true,
  noImplicitOverride: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  forceConsistentCasingInFileNames: true,
  isolatedModules: true,
  skipLibCheck: true,
  esModuleInterop: true,
  resolveJsonModule: true,
  allowJs: true,
} as const;

export const STRICT_FLAG_KEYS = Object.keys(STRICT_COMPILER_OPTIONS) as Array<
  keyof typeof STRICT_COMPILER_OPTIONS
>;
