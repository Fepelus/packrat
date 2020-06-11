
const parser = function (dToR) {
    return {
        parse: dToR,
        chain: (f) => parser(
            (d) => dToR(d).match({
                parsed: (v, dd) => f(v).parse(dd),
                noParse
            })
        )
    };
};

const alt = function (head, ...tail) {
    if (tail.length === 0) {
        return head.parse;
    }
    return (d) => head.parse(d).match({
        parsed,
        noParse: () => alt.apply(undefined, tail)(d)
    });
};

const symbol = (ch) => (d) => d().dvChar().match({
    parsed: (v, dd) => (
        v === ch
        ? parsed(ch, dd)
        : noParse()
    ),
    noParse
});

const monadDo = function (input) {
    const keys = Object.keys(input);
    return (function recurse(index = 0, args = {}) {
        if (index === keys.length - 1) {
            return input[keys[index]](args);
        }
        return input[keys[index]](args).chain(function (v) {
            args[keys[index]] = args[keys[index]] || v;
            return recurse(index + 1, args);
        });
    }());
};


const derivs = function (add, mult, prim, dec, chr) {
    return {
        dvAdditive: () => add.op(add.d),
        dvMultitive: () => mult.op(mult.d),
        dvPrimary: () => prim.op(prim.d),
        dvDecimal: () => dec.op(dec.d),
        dvChar: () => chr
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

// Additive ←  Multitive ‘+’ Additive | Multitive
const pAdditive = alt(
    monadDo({
        vl: () => parser((d) => d().dvMultitive()),
        plus: () => parser(symbol("+")),
        vr: () => parser((d) => d().dvAdditive()),
        result: function ({vl, vr}) {
            return parser((d) => parsed(vl + vr, d));
        }
    }),
    parser((d) => d().dvMultitive())
);

// Multitive ←  Primary ‘*’ Multitive | Primary
const pMultitive = alt(
    monadDo({
        vleft: () => parser((d) => d().dvPrimary()),
        times: () => parser(symbol("*")),
        vright: () => parser((d) => d().dvMultitive()),
        result: function ({vleft, vright}) {
            return parser((d) => parsed(vleft * vright, d));
        }
    }),
    parser((d) => d().dvPrimary())
);

// Primary ←  ‘(’ Additive ‘)’| Decimal
const pPrimary = alt(
    monadDo({
        lbrace: () => parser(symbol("(")),
        value: () => parser((d) => d().dvAdditive()),
        rbrace: () => parser(symbol(")")),
        result: function ({value}) {
            return parser((d) => parsed(value, d));
        }
    }),
    parser((d) => d().dvDecimal())
);

// Decimal ←  ‘0’|...|‘9’
const pDecimal = alt(
    parser(symbol("0")).chain(() => parser((d) => parsed(0, d))),
    parser(symbol("1")).chain(() => parser((d) => parsed(1, d))),
    parser(symbol("2")).chain(() => parser((d) => parsed(2, d))),
    parser(symbol("3")).chain(() => parser((d) => parsed(3, d))),
    parser(symbol("4")).chain(() => parser((d) => parsed(4, d))),
    parser(symbol("5")).chain(() => parser((d) => parsed(5, d))),
    parser(symbol("6")).chain(() => parser((d) => parsed(6, d))),
    parser(symbol("7")).chain(() => parser((d) => parsed(7, d))),
    parser(symbol("8")).chain(() => parser((d) => parsed(8, d))),
    parser(symbol("9")).chain(() => parser((d) => parsed(9, d)))
);

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


const parseChar = function (s) {
    if (s.length === 0) {
        return noParse();
    }
    const head = s[0];
    const tail = s.substr(1);
    return parsed(head, recursiveParse(tail));
};

const recursiveParse = function (input) {
    const d = lazy(() => derivs(
        {op: pAdditive, d},
        {op: pMultitive, d},
        {op: pPrimary, d},
        {op: pDecimal, d},
        parseChar(input)
    ));

    return d;
};

const parse = function (input) {
    const derivation = recursiveParse(input);
    return derivation().dvAdditive().match({
        parsed: (v) => v,
        noParse: function () {
            throw new Error("Parse error");
        }
    });
};

export default Object.freeze(parse);
export {parse};
