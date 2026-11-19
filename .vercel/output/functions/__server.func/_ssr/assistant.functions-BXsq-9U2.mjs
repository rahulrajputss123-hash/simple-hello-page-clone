import { i as createServerFn } from "./server-CpGMOUrW.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Br_KWlRY.mjs";
import { i as enumType, l as stringType, n as arrayType, s as objectType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-BPtk4SPL.mjs";
import { t as withServerTiming } from "./server-timing-middleware-BDljk4aZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assistant.functions-BXsq-9U2.js
var turnSchema = objectType({
	role: enumType(["user", "assistant"]),
	content: stringType().trim().min(1).max(4e3)
});
var chatInput = objectType({
	message: stringType().trim().min(1).max(2e3),
	history: arrayType(turnSchema).max(12).default([]),
	/**
	* Optional id of the offer the user is currently viewing. Only the id is
	* accepted — the offer's facts are loaded server-side so the client can never
	* feed the model made-up offer data.
	*/
	offerId: stringType().uuid().nullable().optional()
});
/**
* Authenticated: sends a user message + short conversation history to Gemini
* (with CASHGPT_SYSTEM_PROMPT as the system instruction) and returns the reply.
*
* When `offerId` is supplied, the real offer row (plus this user's own claim) is
* loaded and appended to the system instruction so offer-specific questions are
* answered from stored data. Without it, behaviour is unchanged.
*/
var sendAssistantMessage_createServerFn_handler = createServerRpc({
	id: "8c90d46f19347dc6eb554371817d0ca3267967968a59b2cb5b8deda869be6bfe",
	name: "sendAssistantMessage",
	filename: "src/lib/assistant.functions.ts"
}, (opts) => sendAssistantMessage.__executeServer(opts));
var sendAssistantMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => chatInput.parse(input)).handler(sendAssistantMessage_createServerFn_handler, withServerTiming("sendAssistantMessage", async ({ data, context }) => {
	const { generateAssistantReply, OFFER_CONTEXT_RULES } = await import("./server-B84ishln.mjs");
	const { buildOfferAssistantContext, resolveOfferIdFromMessage } = await import("./offer-context.server-G1P32-S7.mjs");
	const contextOfferId = data.offerId ?? null;
	const namedOfferId = await resolveOfferIdFromMessage(data.message);
	const offerId = namedOfferId ?? contextOfferId;
	if (namedOfferId && contextOfferId && namedOfferId !== contextOfferId) console.info(`[assistant] message names offer ${namedOfferId}, overriding the in-context offer ${contextOfferId}`);
	else if (namedOfferId && !contextOfferId) console.info(`[assistant] resolved offer ${namedOfferId} from the message text`);
	let extraContext;
	if (offerId) {
		const offerContext = await buildOfferAssistantContext(offerId, context.userId);
		if (offerContext) {
			extraContext = `${OFFER_CONTEXT_RULES}\n\n${offerContext.promptBlock}`;
			console.info(`[assistant] offer context attached: ${offerContext.offerId} (${offerContext.conversionMode}), ${extraContext.length} chars`);
		} else console.warn(`[assistant] offerId ${offerId} returned no context (no matching offers row) — answering without offer data`);
	}
	return { reply: await generateAssistantReply(data.message, data.history, extraContext) };
}));
//#endregion
export { sendAssistantMessage_createServerFn_handler };
