
const derivs = function (add, addsuf, mult, multsuf, prim, dec, chr) {
    return {
        dvAdditive: () => add.op(add.d),
        dvAdditiveSuffix: () => addsuf.op(addsuf.d),
        dvMultitive: () => mult.op(mult.d),
        dvMultitiveSuffix: () => multsuf.op(multsuf.d),
        dvPrimary: () => prim.op(prim.d),
        dvDecimal: () => dec.op(dec.d),
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
    const alt1 = (d) => d().dvChar().match({
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
    const alt2 = (d) => d().dvChar().match({
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
    const alt1 = (d) => d().dvChar().match({
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
    const alt2 = (d) => d().dvChar().match({
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
    const alt3 = (d) => d().dvChar().match({
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
    const alt1 = (d) => d().dvChar().match({
        parsed: patternMatch("(", {
            parsed: (dd) => dd().dvAdditive().match({
                parsed: (v, ddd) => ddd().dvChar().match({
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

// Decimal ←  ‘0’|...|‘9’
const pDecimal = function (input) {
    const alt0 = (d) => d().dvChar().match({
        parsed: patternMatch("0", {
            parsed: (dd) => parsed(0, dd),
            noParse: () => alt1(d)
        }),
        noParse: () => alt1(d)
    });
    const alt1 = (d) => d().dvChar().match({
        parsed: patternMatch("1", {
            parsed: (dd) => parsed(1, dd),
            noParse: () => alt2(d)
        }),
        noParse: () => alt2(d)
    });
    const alt2 = (d) => d().dvChar().match({
        parsed: patternMatch("2", {
            parsed: (dd) => parsed(2, dd),
            noParse: () => alt3(d)
        }),
        noParse: () => alt3(d)
    });
    const alt3 = (d) => d().dvChar().match({
        parsed: patternMatch("3", {
            parsed: (dd) => parsed(3, dd),
            noParse: () => alt4(d)
        }),
        noParse: () => alt4(d)
    });
    const alt4 = (d) => d().dvChar().match({
        parsed: patternMatch("4", {
            parsed: (dd) => parsed(4, dd),
            noParse: () => alt5(d)
        }),
        noParse: () => alt5(d)
    });
    const alt5 = (d) => d().dvChar().match({
        parsed: patternMatch("5", {
            parsed: (dd) => parsed(5, dd),
            noParse: () => alt6(d)
        }),
        noParse: () => alt6(d)
    });
    const alt6 = (d) => d().dvChar().match({
        parsed: patternMatch("6", {
            parsed: (dd) => parsed(6, dd),
            noParse: () => alt7(d)
        }),
        noParse: () => alt7(d)
    });
    const alt7 = (d) => d().dvChar().match({
        parsed: patternMatch("7", {
            parsed: (dd) => parsed(7, dd),
            noParse: () => alt8(d)
        }),
        noParse: () => alt8(d)
    });
    const alt8 = (d) => d().dvChar().match({
        parsed: patternMatch("8", {
            parsed: (dd) => parsed(8, dd),
            noParse: () => alt9(d)
        }),
        noParse: () => alt9(d)
    });
    const alt9 = (d) => d().dvChar().match({
        parsed: patternMatch("9", {
            parsed: (dd) => parsed(9, dd),
            noParse
        }),
        noParse
    });
    return alt0(input);
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
