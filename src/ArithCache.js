
const parsed = function (v, sdash) {
    const match = function ({parsed}) {
        return parsed(v, sdash);
    };
    return {match};
};
const noParse = function () {
    const match = function ({noParse}) {
        return noParse();
    };
    return {match};
};

const parseChar = function (ch, s) {
    const head = s[0];
    const tail = s.substr(1);
    const match = function ({parsed, noParse}) {
        return (
            head === ch
            ? parsed(tail)
            : noParse()
        );
    };
    return {match};
};

let memoTable = [];

const memoizeResult = function (memopos, ruleName, result) {
    let col = memoTable[memopos];
    if (!col) {
        memoTable[memopos] = new Map();
        col = memoTable[memopos];
    }
    col.set(ruleName, result);
};

let pos;
const posBuilder = (input) => (inner) => input.length - inner.length;

const hasMemoizedResult = function (ruleName, input) {
    const col = memoTable[pos(input)];
    return col && col.has(ruleName);
};

const useMemoizedResult = function (ruleName, input) {
    const col = memoTable[pos(input)];
    return col.get(ruleName);
};

const applyRule = function (ruleName, fn, input) {
    if (hasMemoizedResult(ruleName, input)) {
        return useMemoizedResult(ruleName, input);
    }

    const result = fn(input);
    memoizeResult(pos(input), ruleName, result);
    return result;
};

// Additive ←  Multitive ‘+’ Additive | Multitive
const pAdditive = function (input) {
    const alt1 = (s) => pMultitive(s).match({
        parsed: (vl, sd) => parseChar("+", sd).match({
            parsed: (sdd) => pAdditive(sdd).match({
                parsed: (vr, sddd) => parsed(vl + vr, sddd),
                noParse: () => alt2(s)
            }),
            noParse: () => alt2(s)
        }),
        noParse: () => alt2(s)
    });
    const alt2 = function (s) {
        const parsedM = pMultitive(s);
        return parsedM.match({
            parsed: (v, sdash) => parsed(v, sdash),
            noParse: () => parsedM
        });
    };
    return applyRule("pAdditive", alt1, input);
};

// Multitive ←  Primary ‘*’ Multitive | Primary
const pMultitive = function (input) {
    const alt1 = function (s) {
        return pPrimary(s).match({
            parsed: (vleft, sd) => parseChar("*", sd).match({
                parsed: (sdd) => pMultitive(sdd).match({
                    parsed: (vright, sddd) => parsed(vleft * vright, sddd),
                    noParse: () => alt2(s)
                }),
                noParse: () => alt2(s)
            }),
            noParse: () => alt2(s)
        });
    };
    const alt2 = function (s) {
        const parsedP = pPrimary(s);
        return parsedP.match({
            parsed: (v, sdash) => parsed(v, sdash),
            noParse: () => parsedP
        });
    };
    return applyRule("pMultitive", alt1, input);
};

// Primary ←  ‘(’ Additive ‘)’| Decimal
const pPrimary = function (input) {
    const alt1 = (s) => parseChar("(", s).match({
        parsed: (sd) => pAdditive(sd).match({
            parsed: (v, sdd) => parseChar(")", sdd).match({
                parsed: (sddd) => parsed(v, sddd),
                noParse: () => alt2(s)
            }),
            noParse: () => alt2(s)
        }),
        noParse: () => alt2(s)
    });
    const alt2 = (s) => pDecimal(s);
    return applyRule("pPrimary", alt1, input);
};

// Decimal ←  ‘0’|...|‘9’
const pDecimal = function (input) {
    const alt0 = (s) => parseChar("0", s).match({
        parsed: (sd) => parsed(0, sd),
        noParse: () => alt1(s)
    });
    const alt1 = (s) => parseChar("1", s).match({
        parsed: (sd) => parsed(1, sd),
        noParse: () => alt2(s)
    });
    const alt2 = (s) => parseChar("2", s).match({
        parsed: (sd) => parsed(2, sd),
        noParse: () => alt3(s)
    });
    const alt3 = (s) => parseChar("3", s).match({
        parsed: (sd) => parsed(3, sd),
        noParse: () => alt4(s)
    });
    const alt4 = (s) => parseChar("4", s).match({
        parsed: (sd) => parsed(4, sd),
        noParse: () => alt5(s)
    });
    const alt5 = (s) => parseChar("5", s).match({
        parsed: (sd) => parsed(5, sd),
        noParse: () => alt6(s)
    });
    const alt6 = (s) => parseChar("6", s).match({
        parsed: (sd) => parsed(6, sd),
        noParse: () => alt7(s)
    });
    const alt7 = (s) => parseChar("7", s).match({
        parsed: (sd) => parsed(7, sd),
        noParse: () => alt8(s)
    });
    const alt8 = (s) => parseChar("8", s).match({
        parsed: (sd) => parsed(8, sd),
        noParse: () => alt9(s)
    });
    const alt9 = (s) => parseChar("9", s).match({
        parsed: (sd) => parsed(9, sd),
        noParse: () => noParse()
    });
    return applyRule("pDecimal", alt0, input);
};

const parse = function (input) {
    memoTable = [];
    pos = posBuilder(input);
    return pAdditive(input).match({
        parsed: (v, ignore) => v,
        noParse: function () {
            throw new Error("Parse error");
        }
    });
};

export default Object.freeze(parse);
export {parse};
