
const derivs = function (
    add,
    addsuf,
    mult,
    multsuf,
    prim,
    dec,
    digs,
    dig,
    sym,
    ws,
    chr
) {
    return {
        // Expressions
        dvAdditive: () => add.op(add.d),
        dvAdditiveSuffix: () => addsuf.op(addsuf.d),
        dvMultitive: () => mult.op(mult.d),
        dvMultitiveSuffix: () => multsuf.op(multsuf.d),
        dvPrimary: () => prim.op(prim.d),
        dvDecimal: () => dec.op(dec.d),

        // Lexical tokens
        dvDigits: () => digs.op(digs.d),
        dvDigit: () => dig.op(dig.d),
        dvSymbol: () => sym.op(sym.d),
        dvWhitespace: () => ws.op(ws.d),

        // Raw input
        dvChar: () => chr
    };
};

const patternMatch = function (ch, {parsed, noParse}) {
    return function (v, d) {
        return (
            v === ch
            ? parsed(d)
            : noParse()
        );
    };
};

const parsed = function (v, derivs) {
    const match = function ({parsed}) {
        return parsed(v, derivs);
    };
    return {match};
};
const noParse = function () {
    const match = function ({noParse}) {
        return noParse();
    };
    return {match};
};

// Additive ←  Multitive AdditiveSuffix
const pAdditive = (d) => d().dvMultitive().match({
    parsed: (vl, dd) => dd().dvAdditiveSuffix().match({
        parsed: (suf, ddd) => parsed(suf(vl), ddd),
        noParse
    }),
    noParse
});

//AdditiveSuffix <- '+' Multitive AdditiveSuffix
//                | '-' Multitive AdditiveSuffix
//                | ε
// operations are left-associative
const pAdditiveSuffix = function (input) {
    const alt1 = (d) => d().dvSymbol().match({
        parsed: patternMatch("+", {
            parsed: (dd) => dd().dvMultitive().match({
                parsed: (vr, ddd) => ddd().dvAdditiveSuffix().match({
                    parsed: (suf, dddd) => parsed(
                        (vl) => suf(vl + vr),
                        dddd
                    ),
                    noParse: () => alt2(d)
                }),
                noParse: () => alt2(d)
            }),
            noParse: () => alt2(d)
        }),
        noParse: () => alt2(d)
    });
    const alt2 = (d) => d().dvSymbol().match({
        parsed: patternMatch("-", {
            parsed: (dd) => dd().dvMultitive().match({
                parsed: (vr, ddd) => ddd().dvAdditiveSuffix().match({
                    parsed: (suf, dddd) => parsed(
                        (vl) => suf(vl - vr),
                        dddd
                    ),
                    noParse: () => alt3(d)
                }),
                noParse: () => alt3(d)
            }),
            noParse: () => alt3(d)
        }),
        noParse: () => alt3(d)
    });
    const alt3 = (d) => parsed((v) => v, d);
    return alt1(input);
};

// Multitive ←  Primary MultitiveSuffix
const pMultitive = (d) => d().dvPrimary().match({
    parsed: (vl, dd) => dd().dvMultitiveSuffix().match({
        parsed: (suf, ddd) => parsed(suf(vl), ddd),
        noParse
    }),
    noParse
});

// MultitiveSuffix ←  '*' Primary MultitiveSuffix
//                  | '/' Primary MultitiveSuffix
//                  | '%' Primary MultitiveSuffix
//                  | ε
// operations are left-associative
const pMultitiveSuffix = function (input) {
    const alt1 = (d) => d().dvSymbol().match({
        parsed: patternMatch("*", {
            parsed: (dd) => dd().dvPrimary().match({
                parsed: (vr, ddd) => ddd().dvMultitiveSuffix().match({
                    parsed: (suf, dddd) => parsed(
                        (vl) => suf(vl * vr),
                        dddd
                    ),
                    noParse: () => alt2(d)
                }),
                noParse: () => alt2(d)
            }),
            noParse: () => alt2(d)
        }),
        noParse: () => alt2(d)
    });
    const alt2 = (d) => d().dvSymbol().match({
        parsed: patternMatch("/", {
            parsed: (dd) => dd().dvPrimary().match({
                parsed: (vr, ddd) => ddd().dvMultitiveSuffix().match({
                    parsed: (suf, dddd) => parsed(
                        (vl) => suf(Math.floor(vl / vr)),
                        dddd
                    ),
                    noParse: () => alt3(d)
                }),
                noParse: () => alt3(d)
            }),
            noParse: () => alt3(d)
        }),
        noParse: () => alt3(d)
    });
    const alt3 = (d) => d().dvSymbol().match({
        parsed: patternMatch("%", {
            parsed: (dd) => dd().dvPrimary().match({
                parsed: (vr, ddd) => ddd().dvMultitiveSuffix().match({
                    parsed: (suf, dddd) => parsed(
                        (vl) => suf(vl % vr),
                        dddd
                    ),
                    noParse: () => alt4(d)
                }),
                noParse: () => alt4(d)
            }),
            noParse: () => alt4(d)
        }),
        noParse: () => alt4(d)
    });
    const alt4 = (d) => parsed((v) => v, d);
    return alt1(input);
};

// Primary ←  ‘(’ Additive ‘)’| Decimal
const pPrimary = function (input) {
    const alt1 = (d) => d().dvSymbol().match({
        parsed: patternMatch("(", {
            parsed: (dd) => dd().dvAdditive().match({
                parsed: (v, ddd) => ddd().dvSymbol().match({
                    parsed: patternMatch(")", {
                        parsed: (dddd) => parsed(v, dddd),
                        noParse: () => alt2(d)
                    }),
                    noParse: () => alt2(d)
                }),
                noParse: () => alt2(d)
            }),
            noParse: () => alt2(d)
        }),
        noParse: () => alt2(d)
    });
    const alt2 = (d) => d().dvDecimal();
    return alt1(input);
};

const pDecimal = (d) => d().dvDigits().match({
    parsed: (v, dd) => dd().dvWhitespace().match({
        parsed: (ignore, ddd) => parsed(v.value, ddd),
        noParse
    }),
    noParse
});

const pDigits = (d) => d().dvDigit().match({
    parsed: (vl, dd) => dd().dvDigits().match({
        parsed: (vw, ddd) => parsed(
            {
                value: vl * Math.pow(10, vw.width) + vw.value,
                width: vw.width + 1
            },
            ddd
        ),
        noParse: () => parsed({value: vl, width: 1}, dd)
    }),
    noParse
});

const pDigit = function (input) {
    const digits = "0123456789";
    const index = (ch) => digits.indexOf(ch);
    return input().dvChar().match({
        parsed: function (ch, d) {
            return (
                index(ch) >= 0
                ? parsed(index(ch), d)
                : noParse()
            );
        },
        noParse
    });
};

const pSymbol = function (input) {
    const symbols = "+-*/%()";
    return input().dvChar().match({
        parsed: function (ch, d) {
            if (symbols.indexOf(ch) >= 0) {
                return d().dvWhitespace().match({
                    parsed: (ignore, dd) => parsed(ch, dd),
                    noParse
                });
            } else {
                return noParse();
            }
        },
        noParse
    });
};

const pWhitespace = function (input) {
    const spaces = " \t\n\r\f";
    return input().dvChar().match({
        parsed: function (ch, d) {
            return (
                spaces.indexOf(ch) >= 0
                ? pWhitespace(d)
                : parsed(undefined, input)
            );
        },
        noParse: () => parsed(undefined, input)
    });
};

const lazy = function (fn) {
    let res;
    let processed = false;
    return function (...args) {
        if (processed) {
            return res;
        }
        res = fn.apply(undefined, args);
        processed = true;
        return res;
    };
};

const recursive_parse = function (input) {
    const parseChar = function (s) {
        if (s.length === 0) {
            return noParse();
        }
        const head = s[0];
        const tail = s.substr(1);
        return parsed(head, recursive_parse(tail));
    };

    const d = lazy(() => derivs(
        {op: pAdditive, d},
        {op: pAdditiveSuffix, d},
        {op: pMultitive, d},
        {op: pMultitiveSuffix, d},
        {op: pPrimary, d},
        {op: pDecimal, d},
        {op: pDigits, d},
        {op: pDigit, d},
        {op: pSymbol, d},
        {op: pWhitespace, d},
        parseChar(input)
    ));

    return d;
};

const parse = function (input) {
    const derivation = recursive_parse(input);
    return derivation().dvAdditive().match({
        parsed: (v) => v,
        noParse: function () {
            throw new Error("Parse error");
        }
    });
};

export default Object.freeze(parse);
export {parse};
