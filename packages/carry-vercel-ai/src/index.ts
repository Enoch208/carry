import { wrapLanguageModel } from "ai";
import { carryMiddleware, type CarryMiddlewareOptions } from "./middleware.js";

export * from "./store.js";
export {
  carryMiddleware,
  type CarryMiddlewareOptions,
  type CarryLanguageModelMiddleware,
} from "./middleware.js";

/**
 * Wrap any Vercel AI SDK language model with proof-carrying memory.
 *
 * ```ts
 * const model = withCarryMemory(openai("gpt-4o"), {
 *   store: createMemoryStore({ memories }),
 *   agent: "aria",
 *   onReceipt: (r) => console.log(r.used, r.blockedNamespaces),
 * });
 * ```
 *
 * Gated memory is recalled and injected before generation; blocked namespaces
 * are never fetched, and every call emits an Answer Receipt.
 */
export function withCarryMemory<M>(model: M, opts: CarryMiddlewareOptions): M {
  return wrapLanguageModel({
    model: model as never,
    middleware: carryMiddleware(opts) as never,
  }) as M;
}
