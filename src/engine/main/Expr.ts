import type { Token } from "./Token";

export interface ExprVisitor<R> {
    visitListExpr(expr: ListExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitSymbolExpr(expr: SymbolExpr): R;
}

export abstract class Expr {
    abstract token: Token;

    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class ListExpr extends Expr {
    public constructor(public readonly token: Token, public readonly list: Expr[]) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitListExpr(this);
    }
}

export class LiteralExpr extends Expr {
    public constructor(public readonly token: Token, public readonly literal: unknown) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

export class SymbolExpr extends Expr {
    public constructor(public readonly token: Token) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSymbolExpr(this);
    }
}
