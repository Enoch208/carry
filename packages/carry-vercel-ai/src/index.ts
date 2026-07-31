import { wrapLanguageModel } from "ai";
import { carryMiddleware, type CarryMiddlewareOptions } from "./middleware.js";

export * from "./store.js";
export { createGatewayStore, anchorReceipt, type GatewayOptions } from "./gateway.js";
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
 *   // hosted Carry — the gate runs server-side against the on-chain policy
 *   store: createGatewayStore({ baseUrl: "https://usecarry.xyz", apiKey: process.env.CARRY_API_KEY! }),
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
