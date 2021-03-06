import { nativebind } from "../../engine/bindings";
import type { Expr } from "../../engine/main/Expr";
import { QuoTypeError } from "../../priv/error";

export const lib = Object.assign(
    new Map([
        //
        ...nativebind(
            String,
            [
                "charAt",
                "charCodeAt",
                "codePointAt",
                "concat",
                "endsWith",
                "includes",
                "indexOf",
                "lastIndexOf",
                "padEnd",
                "padStart",
                "slice",
                "split",
                "startsWith",
                "substring",
                "toLowerCase",
                "toString",
                "toUpperCase",
                "trim",
                "trimEnd",
                "trimLeft",
                "trimRight",
                "trimStart",
            ],
            function (target: unknown, expr: Expr) {
                if (typeof target !== "string") throw new QuoTypeError(this, expr.token, `Target must be a string.`);
            }
        ),
    ]),
    { name: "str" }
);
