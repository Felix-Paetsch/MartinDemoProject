import { PluginEnvironment } from "../../../pluginSystem/kernel_exports"
import MessageChannel from "../../../middleware/channel"
import { ClientSideBaseOperation, BaseOperationS, client_side_base_operations_to_base_operations, AssetSideBaseOperation } from "./operations"
import { active_subscriptions, connect, register_subscription, unregister_subscription } from "../library/subscriptions"
import { FileContentsS, FileReferenceS, MetaDataS, RecencyTokenS } from "../schemas"
import { Schema } from "effect"
import { process_operations } from "../plugin/file_store"
import { Transcoder, UUID } from "../../../utils/exports"
import { noResponderProtocol } from "../../../middleware/protocol"
import { FileReference } from "../types"

const ResponseSchema = Schema.mutable(Schema.Struct({
    fileReferences: Schema.mutable(Schema.Record({
        key: FileReferenceS,
        value: Schema.Struct({
            contents: Schema.optional(FileContentsS),
            meta_data: MetaDataS,
            recency_token: RecencyTokenS
        })
    })),
    fileReferenceArrays: Schema.Array(
        Schema.mutable(Schema.Array(FileReferenceS))
    ),
    active_file_references: Schema.optional(
        Schema.Array(FileReferenceS)
    )
}));

export type ProtocolResponse = (
    Schema.Schema.Type<typeof ResponseSchema>
) | Error;

const RequestTranscoder = Transcoder.SchemaTranscoder(
    Schema.Tuple(
        Schema.Literal("Bundled", "Atomic"),
        Schema.Array(BaseOperationS)
    )
);
const ResponseTranscoder = Transcoder.SchemaTranscoder(ResponseSchema);

export const asset_protocol = noResponderProtocol(
    "asset::perform_operation_batch",
    async (mc: MessageChannel, env: PluginEnvironment, withData: {
        operations: ClientSideBaseOperation[],
        type: "Bundled" | "Atomic"
    }) => {
        const { operations } = withData;
        if (operations.some(o => o.type === "SUBSCRIBE")) {
            const res = await connect(env);
            if (res instanceof Error) {
                return res;
            }
        }

        const response = await mc.send_await_next_transcoded(
            RequestTranscoder,
            [
                withData.type,
                client_side_base_operations_to_base_operations(env, operations)
            ],
            ResponseTranscoder
        );

        if (response instanceof Error) {
            return response;
        }

        const active_subscriptions_dict: { [key: FileReference]: string[] } = {};
        operations.forEach(op => {
            if (op.type === "UNSUBSCRIBE") {
                return unregister_subscription(
                    env,
                    op.fr,
                    op.key,
                )
            }
            if (op.type === "SUBSCRIBE") {
                return register_subscription(env, op.fr, op.key, op.cb)
            }

            if (op.type === "GET_ACTIVE_SUBSCRIPTIONS") {
                active_subscriptions_dict[op.fr] = active_subscriptions(
                    env, op.fr, response.active_file_references || []
                )
            }
        });

        return {
            fileReferences: response.fileReferences,
            fileReferenceArrays: response.fileReferenceArrays,
            active_subscriptions: active_subscriptions_dict
        };
    },
    async (mc: MessageChannel) => {
        const operations = await mc.next_decoded(RequestTranscoder);
        if (operations instanceof Error) return;
        const res = process_operations(
            operations[1] as AssetSideBaseOperation[],
            operations[0],
            mc.partner
        );
        if (!(res instanceof Error)) {
            mc.send_encoded(ResponseTranscoder, res);
        }
    }
)
