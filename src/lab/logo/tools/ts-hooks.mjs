/*
 * Node resolve hook for the lab's dev tools: lets plain `node` import the
 * lab's TypeScript modules (Node strips the types), resolving extensionless
 * relative imports to .ts. Usage: node --import ./src/lab/logo/tools/ts-register.mjs …
 */
export async function resolve(specifier, context, next) {
  if (/^\.{1,2}\//.test(specifier) && !/\.[cm]?[jt]s$/.test(specifier)) {
    for (const ext of ['.ts', '/index.ts']) {
      try {
        return await next(specifier + ext, context)
      } catch {}
    }
  }
  return next(specifier, context)
}
