import { bindmath } from "./bind.js";

export const lib = Object.assign(
    new Map([
        bindmath("abs"),
        bindmath("acos"),
        bindmath("acosh"),
        bindmath("asin"),
        bindmath("asinh"),
        bindmath("atan"),
        bindmath("atanh"),
        bindmath("atan2"),
        bindmath("ceil"),
        bindmath("cbrt"),
        bindmath("expm1"),
        bindmath("clz32"),
        bindmath("cos"),
        bindmath("cosh"),
        bindmath("exp"),
        bindmath("floor"),
        bindmath("fround"),
        bindmath("hypot"),
        bindmath("imul"),
        bindmath("log"),
        bindmath("log1p"),
        bindmath("log2"),
        bindmath("log10"),
        bindmath("max"),
        bindmath("min"),
        bindmath("pow"),
        bindmath("random"),
        bindmath("round"),
        bindmath("sign"),
        bindmath("sin"),
        bindmath("sinh"),
        bindmath("sqrt"),
        bindmath("tan"),
        bindmath("tanh"),
        bindmath("trunc"),
        ["pi", () => Math.PI],
        ["e", () => Math.E],
    ]),
    { name: "math" }
);
