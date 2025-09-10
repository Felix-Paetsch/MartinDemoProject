

import { partition_middleware } from "./middleware/partition";
import { collection_middleware } from "./middleware/collection";
import { guard_middleware } from "./middleware/guard";
import { empty_middleware } from "./middleware/empty";
import { comsume_message } from "./middleware/consume";
import { type Middleware as MW } from "./base/middleware";
import {
    MiddlewareInterrupt,
    MiddlewareContinue,
    MiddlewarePassthrough,
    isMiddlewareContinue,
    isMiddlewareInterrupt
} from "./base/middleware";

export namespace Middleware {
    export type Middleware = MW;

}