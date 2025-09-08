import { Context, Effect, Option, ParseResult, pipe, Schema } from "effect";
import { ProtocolError } from "pc-messaging-kernel/messaging/protocols/base/protocol_errors";
import { ResultPromise } from "pc-messaging-kernel/utils/boundary/result";
import { Json } from "pc-messaging-kernel/utils/json";
import { v4 as uuidv4 } from "uuid";
import { Address } from "../../../../messaging/base/address";
import { Environment, EnvironmentT } from "../../../../pluginSystem/common_lib/messageEnvironments/environment";
import { Bridge } from "../../exports";
import { MessagePartnerObject, MPOInitializationError } from "../base/message_partner_object";
import { MPOCommunicationProtocol } from "../base/mpo_commands/mpo_communication/protocol";
import { __branch_cb_impl, branch_impl, on_branch_impl, register_branch_command } from "./commands/branch";
import { __bridge_cb_impl, bridge_impl, on_bridge_impl, register_bridge_command } from "./commands/bridge";

export class MessagePartner extends MessagePartnerObject {
    static message_partners: MessagePartner[] = [];
    static get_message_partner(uuid: string, env: Environment) {
        return Option.fromNullable(MessagePartner.message_partners.find(
            mp => mp.uuid === uuid && !mp.is_removed() && mp.env === env
        ));
    }

    public _message_partner_objects: MessagePartnerObject[] = [];
    readonly MPOCommunication: MPOCommunicationProtocol;

    constructor(
        readonly address: Address,
        readonly env: Environment,
        uuid: string = uuidv4()
    ) {
        super(null as any, uuid);
        (this.message_partner as any) = this;
        MessagePartner.message_partners.push(this);
        this.MPOCommunication = new MPOCommunicationProtocol(env);

        // Register command handlers
        register_branch_command(MessagePartner);
        register_bridge_command(MessagePartner);
    }

    is_removed(): boolean {
        return this.removed;
    }

    register_message_partner_object(mpo: MessagePartnerObject) {
        if (!(mpo instanceof MessagePartner)) {
            this._message_partner_objects.push(mpo);
        }
    }

    get_message_partner_object(uuid: string): Option.Option<MessagePartnerObject> {
        if (uuid.charAt(uuid.length - 2) === "_" && uuid.slice(0, -2) === this.uuid.slice(0, -2)) {
            return Option.some(this);
        }
        if (uuid == this.uuid) {
            return Option.some(this);
        }

        return Option.fromNullable(this._message_partner_objects.find(
            mp => mp.uuid === uuid
        ));
    }

    static makeMP = Schema.transformOrFail(
        Schema.Struct({
            address: Schema.instanceOf(Address),
            uuid: Schema.String
        }),
        Schema.instanceOf(MessagePartner),
        {
            encode: (mpo: MessagePartner, _, __) => Effect.succeed({
                address: mpo.address,
                uuid: mpo.uuid
            }),
            decode: ({ uuid, address }, _, ast) => pipe(
                EnvironmentT,
                Effect.andThen(env => MessagePartner.get_message_partner(uuid, env)),
                Effect.flip,
                Effect.andThen(() => Effect.gen(function* () {
                    const env = yield* EnvironmentT;
                    return new MessagePartner(address, env, uuid);
                })),
                Effect.catchAll(e => {
                    return ParseResult.fail(new ParseResult.Type(ast, { uuid, address }, "Message partner already exists"));
                })
            )
        }
    )

    static fromExistingMessagePartnerObject(mpo: MessagePartnerObject, uuid: string): Effect.Effect<MessagePartner, MPOInitializationError> {
        return Schema.decode(this.makeMP)({
            address: mpo.message_partner.address,
            uuid: uuid
        }).pipe(
            Effect.provideService(EnvironmentT, mpo.message_partner.env),
            Effect.mapError(e => new MPOInitializationError({
                message_partner_uuid: mpo.message_partner.uuid,
                uuid: uuid,
                error: e
            }))
        );
    }

    static makeLocalPair(env1: Environment, env2: Environment, uuid = uuidv4()): Effect.Effect<[MessagePartner, MessagePartner], MPOInitializationError> {
        return Effect.gen(this, function* () {
            for (const mp of this.message_partners) {
                if (mp.uuid === uuid && (mp.env === env1 || mp.env === env2)) {
                    return yield* new MPOInitializationError({
                        message_partner_uuid: uuid,
                        uuid: uuid,
                        error: new Error("Message partners with UUID already exist")
                    })
                }
            }

            return [
                new MessagePartner(env2.ownAddress, env1, uuid),
                new MessagePartner(env1.ownAddress, env2, uuid)
            ] as [MessagePartner, MessagePartner];
        })
    }

    branch(data: Json): Effect.Effect<MessagePartner, ProtocolError> {
        return branch_impl.call(this, data);
    };
    on_branch(cb: (mpo: MessagePartner, data: Json) => void): void {
        return on_branch_impl.call(this, cb);
    };
    __branch_cb(mpo: MessagePartner, data: Json): void {
        return __branch_cb_impl.call(this, mpo, data);
    };
    bridge(data?: Json): ResultPromise<Bridge, ProtocolError> {
        return bridge_impl.call(this, data);
    };
    on_bridge(cb: (mpo: Bridge, data: Json) => void): void {
        return on_bridge_impl.call(this, cb);
    };
    __bridge_cb(mpo: Bridge, data: Json): void {
        return __bridge_cb_impl.call(this, mpo, data);
    };
}

export class MessagePartnerT extends Context.Tag("MessagePartnerT")<MessagePartnerT, MessagePartner>() { }

