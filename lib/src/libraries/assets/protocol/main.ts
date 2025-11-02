import { PluginEnvironment } from "../../../pluginSystem/kernel_exports"
import MessageChannel from "../../../middleware/channel"
import { active_subscriptions, connect, register_subscription, unregister_subscription } from "../library/subscriptions"
import { FileContentsS, FileReferenceS, MetaDataS, RecencyTokenS } from "../schemas"
import { Schema } from "effect"
import { Transcoder, UUID } from "../../../utils/exports"
import { noResponderProtocol } from "../../../middleware/protocol"
import { AssetSideOperation, AssetSideOperationS, ClientSideOperation } from "../operations"
import { clientSide_to_assetSide_operations } from "./operations"
import { process_operations } from "../plugin/process_operations"

const ResponseSchema = Schema.Struct({
    fileReferences: Schema.Record({
        key: FileReferenceS,
        value: Schema.Struct({
            contents: Schema.optional(FileContentsS),
            meta_data: MetaDataS,
            recency_token: RecencyTokenS
        })
    }),
    fileReferenceArrays: Schema.Array(
        Schema.mutable(Schema.Array(FileReferenceS))
    ),
    active_file_references: Schema.optional(Schema.Array(FileReferenceS))
});

export type ProtocolResponse = Schema.Schema.Type<typeof ResponseSchema>;
export type ProtocolResult = (
    Schema.Schema.Type<typeof ResponseSchema>
    & {
        subscriptionArrays: UUID[][]
    }
) | Error;

const RequestTranscoder = Transcoder.SchemaTranscoder(
    Schema.Tuple(
        Schema.Literal("Bundled", "Atomic"),
        Schema.Array(AssetSideOperationS)
    )
);
const ResponseTranscoder = Transcoder.SchemaTranscoder(ResponseSchema);

export const asset_protocol = noResponderProtocol<
    PluginEnvironment,
    {
        operations: ClientSideOperation[],
        type: "Bundled" | "Atomic"
    },
    ProtocolResult
>(
    "asset::perform_operation_batch",
    async (mc: MessageChannel, env: PluginEnvironment, withData: {
        operations: ClientSideOperation[],
        type: "Bundled" | "Atomic"
    }) => {
        const { operations } = withData;
        if (operations.some(o => o.type === "SUBSCRIBE_CB")) {
            const res = await connect(env);
            if (res instanceof Error) {
                return res;
            }
        }

        const response = await mc.send_await_next_transcoded(
            RequestTranscoder,
            [
                withData.type,
                clientSide_to_assetSide_operations(env, operations)
            ],
            ResponseTranscoder
        );

        if (response instanceof Error) {
            return response;
        }

        const subscriptionArrays: UUID[][] = [];
        operations.forEach(op => {
            if (op.type === "UNSUBSCRIBE_CB") {
                return unregister_subscription(
                    env,
                    op.fr,
                    op.key,
                )
            }
            if (op.type === "SUBSCRIBE_CB") {
                return register_subscription(env, op.fr, op.key, op.cb)
            }

            if (op.type === "GET_ACTIVE_SUBSCRIPTIONS_FILE_REFERENCE") {
                subscriptionArrays.push(active_subscriptions(env, op.fr, response.active_file_references || []));
            }
        });

        return {
            ...response,
            subscriptionArrays: subscriptionArrays
        };
    },
    async (mc: MessageChannel) => {
        const operations = await mc.next_decoded(RequestTranscoder);
        if (operations instanceof Error) return;
        const res = process_operations(
            operations[1] as AssetSideOperation[],
            operations[0],
            mc.partner
        );
        if (!(res instanceof Error)) {
            mc.send_encoded(ResponseTranscoder, res);
        }
    }
)
