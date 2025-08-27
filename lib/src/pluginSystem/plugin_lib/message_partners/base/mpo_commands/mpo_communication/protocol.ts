import { Effect, Schema } from "effect";
import { SendEffectT } from "../../../../../../messaging/base/send";
import { ProtocolCommunicationHandler, ProtocolCommunicationHandlerT } from "../../../../../../messaging/protocols/base/communicationHandler";
import { fail_as_protocol_error, ProtocolError, ProtocolErrorN } from "../../../../../../messaging/protocols/base/protocol_errors";
import { Json } from "../../../../../../utils/json";
import { Environment } from "../../../../../common_lib/messageEnvironments/environment";
import { MessageEnvironmentProtocol } from "../../../../../common_lib/messageEnvironments/messageEnvironment_protocol";
import { MessagePartnerObject } from "../../message_partner_object";
import { MPOCommunicationHandler, MPOMessageProtocolDataSchema } from "./MPOCommunicationHandler";
import { get_message_partner_object } from "./tools";

export class MPOCommunicationProtocol extends MessageEnvironmentProtocol<Effect.Effect<MPOCommunicationHandler, ProtocolError>, MPOCommunicationHandler> {
    constructor(readonly environment: Environment) {
        super(environment, "message_partner_object_communication", "main", "1.0.0");
    }

    run(): Effect.Effect<Effect.Effect<MPOCommunicationHandler, ProtocolError>, ProtocolError> {
        return ProtocolErrorN({
            message: "Use run_mpo method instead for MPO communication"
        });
    }

    run_mpo(
        mpo: MessagePartnerObject,
        mpo_message_protocol_name: string,
        data?: Json,
        timeout?: number
    ): Effect.Effect<
        Effect.Effect<MPOCommunicationHandler, ProtocolError>,
        ProtocolError
    > {
        return Effect.gen(this, function* () {
            const handlerE = yield* this.send_first_message(
                mpo.message_partner.address,
                Schema.encodeSync(MPOMessageProtocolDataSchema)({
                    mpo_ident: mpo.ident,
                    mpo_message_protocol_name,
                    protocol_data: data
                }), timeout
            )

            return handlerE.pipe(
                Effect.andThen(handler => MPOCommunicationHandler.fromMPOMessage(handler.__current_pm)),
                Effect.provideService(SendEffectT, this.environment.send)
            )
        }).pipe(fail_as_protocol_error)
    }

    on_first_request = Effect.fn("on_first_request")(
        function* (this: MPOCommunicationProtocol, pch: ProtocolCommunicationHandler) {
            const ich = yield* MPOCommunicationHandler.fromMPOMessage(pch.__current_pm);
            return yield* this.on_callback(ich);
        },
        (e) => e.pipe(
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore
        )
    );

    on_callback = Effect.fn("on_callback")(
        function* (this: MPOCommunicationProtocol, ch: MPOCommunicationHandler) {
            const data = ch.data;
            const mpo = yield* get_message_partner_object(data.mpo_ident, this.environment).pipe(
                Effect.provideService(ProtocolCommunicationHandlerT, ch)
            );

            yield* mpo._recieve_mpo_message(
                data.mpo_message_protocol_name,
                data.protocol_data,
                ch
            );
        },
        (e) => e.pipe(
            Effect.tapError(e => Effect.logError(e)),
            Effect.ignore
        )
    )
}