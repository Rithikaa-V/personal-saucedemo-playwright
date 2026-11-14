import type { ZodTypeAny, z } from 'zod';

/** Contract assertion with a readable failure message (path + reason per issue). */
export function parseContract<S extends ZodTypeAny>(schema: S, body: unknown, label = 'response'): z.infer<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Contract violation in ${label}:\n${issues}\nBody: ${JSON.stringify(body)}`);
  }
  return result.data;
}
