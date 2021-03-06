import {
    QuoAssertionError,
    QuoReferenceError,
    QuoRuntimeError,
    QuoSyntaxError,
    QuoThrownError,
    QuoTypeError,
} from "../../priv/error";
import { wraplexeme } from "../executils";
import { Environment } from "./Environment";
import { Expr, ExprVisitor, ListExpr, LiteralExpr, SymbolExpr } from "./Expr";
import { Token, TokenType } from "./Token";

export class Trace {
    public constructor(public readonly file: string, public readonly token: Token, public readonly target: Function) {}
}

export class Interpreter implements ExprVisitor<unknown> {
    public nsdepth = 0;
    public nsactive = false;

    public modname = this.filename;

    public callstack = [
        new Trace(this.filename, new Token(TokenType.Eof, "", undefined, 0, 0), function () {}),
    ] as Trace[];

    public environment = new Environment(this);

    public get exports() {
        return Object.assign(new Map(this.environment.root().getexports()), { name: this.filename });
    }

    public constructor(
        public readonly filepath: string,
        public readonly filename: string,
        public readonly source: string
    ) {}

    public interpret(expr: Expr): unknown {
        const r = this.evaluate(expr);

        if (Array.isArray(r)) return r.pop() ?? null;

        return r;
    }

    public visitLiteralExpr(expr: LiteralExpr) {
        return expr.literal;
    }

    public visitSymbolExpr(expr: SymbolExpr) {
        return this.retrieve(expr);
    }

    public visitListExpr(expr: ListExpr) {
        const [head, ...body] = expr.list;

        const previous = this.environment;

        try {
            this.environment = new Environment(this, this.environment);

            if (head instanceof SymbolExpr) {
                const fn = this.retrieve(head);

                if (typeof fn === "function") {
                    this.callstack.unshift(new Trace(this.filename, head.token, fn));

                    if (this.callstack.length > 1337)
                        throw new QuoRuntimeError(this, head.token, `Callstack limit exceeded.`);

                    try {
                        return fn.apply(this, body);
                    } catch (err) {
                        if (err instanceof QuoThrownError) {
                            throw err;
                        }
                    } finally {
                        this.callstack.shift();
                    }
                }

                if (typeof fn !== "function")
                    throw new QuoTypeError(
                        this,
                        head.token,
                        `Cannot call '${head.token.lexeme}' as it is not a function.`
                    );
            } else {
                return expr.list.map(this.evaluate.bind(this));
            }
        } finally {
            this.environment = previous;
        }
    }

    public istruthy(v: unknown): boolean {
        if (typeof v === "function") return true;

        if (typeof v === "string") return v.length > 0;

        if (typeof v === "number") return v !== 0;

        if (typeof v === "boolean") return v;

        if (Array.isArray(v)) return v.length > 0;

        if (v instanceof Map) return v.size > 0;

        if (v === null) return false;

        throw new QuoAssertionError(`Attempted to coerce unhandled type of value.`);
    }

    public isfalsey(v: unknown): boolean {
        return !this.istruthy(v);
    }

    public numberify(v: unknown): number {
        if (typeof v === "function") return 0;

        if (typeof v === "string") return Number(v) || 0;

        if (typeof v === "number") return v;

        if (typeof v === "boolean") return Number(v);

        if (Array.isArray(v)) return v.length;

        if (v instanceof Map) return v.size;

        if (v === null) return 0;

        throw new QuoAssertionError(`Attempted to numberify unhandled type of value.`);
    }

    public stringify(v: unknown): string {
        if (typeof v === "function")
            return `<${Interpreter.isnativefn(v) ? "native " : ""}fn ${v.name || "(anonymous)"}>`;

        if (typeof v === "string") return v.toString();

        if (typeof v === "number") return v.toString();

        if (typeof v === "boolean") return v.toString();

        if (Array.isArray(v)) return `(${v.map(this.stringify.bind(this)).join(" ")})`;

        if (v instanceof Map) return `[${Interpreter.isnativens(v) ? "native " : ""}namespace ${(v as any).name}]`;

        if (v === null) return "nil";

        throw new QuoAssertionError(`Attempted to stringify unhandled type of value.`);
    }

    public deepclone(v: unknown): unknown {
        if (typeof v === "function") return v;

        if (typeof v === "string") return v;

        if (typeof v === "number") return v;

        if (typeof v === "boolean") return v;

        if (Array.isArray(v)) return v.map(this.deepclone.bind(this));

        if (v instanceof Map) return new Map([...v.entries()].map(([k, v]) => [k, this.deepclone(v)]));

        if (v === null) return v;

        throw new QuoAssertionError(`Attempted to deepclone unhandled type of value.`);
    }

    public deepequals(a: unknown, b: unknown): boolean {
        if (typeof a === "function" || typeof b === "function") return false;

        if (typeof a === "string" && typeof b === "string") return a === b;

        if (typeof a === "number" && typeof b === "number") return a === b;

        if (typeof a === "boolean" && typeof b === "boolean") return a === b;

        if (Array.isArray(a) && Array.isArray(b))
            return a.length === b.length && a.every((x, i) => this.deepequals(x, b[i]));

        if (a instanceof Map && b instanceof Map)
            return (
                a.size === b.size &&
                this.deepequals(
                    Object.fromEntries([...(this.deepclone(a) as Map<any, any>).entries()]),
                    Object.fromEntries([...(this.deepclone(b) as Map<any, any>).entries()])
                )
            );

        if (a === null && b === null) return true;

        return false;
    }

    private retrieve(expr: Expr) {
        const path = expr.token.lexeme.split(":");

        if (path.length === 1) return this.environment.get(expr.token);

        if (path.some((c) => !c)) throw new QuoSyntaxError(this.source, expr.token, `Missing member name in access.`);

        const previous = this.environment;

        this.environment = this.environment.ancestor(1);

        let value: unknown = this.environment.get(wraplexeme(path.shift()!));

        if (typeof value === "undefined")
            throw new QuoReferenceError(this, expr.token, `Cannot reference '${path[0]}' as it is not defined.`);

        while (path.length) {
            if (value instanceof Map) {
                if (!value.has(path[0]))
                    throw new QuoReferenceError(this, expr.token, `No member named '${path[0]}' in namespace.`);

                value = value.get(path.shift()!)!;
            }

            if (path.length > 1)
                throw new QuoTypeError(this, expr.token, `Cannot reference '${path[0]}' as it is not a namespace.`);
        }

        this.environment = previous;

        return value;
    }

    private static isnativefn(v: any): v is Function & { native: true } {
        return v?.native === true && typeof v === "function";
    }

    private static isnativens(v: any): v is Map<any, any> & { native: true } {
        return v?.native === true && v instanceof Map;
    }

    public evaluate(expr: Expr): unknown {
        if (!(expr instanceof Expr)) return expr;

        if (!expr) return null;

        return expr.accept(this);
    }
}
