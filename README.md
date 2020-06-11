# Packrat Parser

The examples in Bryan Ford’s packrat parser paper written in JavaScript.

## The paper

Bryan Ford. 2002. Packrat parsing: simple, powerful, lazy,
linear time, functional pearl. SIGPLAN Not. 37, 9 (September 2002),
36–47. DOI:https://doi.org/10.1145/583852.581483

[https://bford.info/pub/lang/packrat-icfp02/](https://bford.info/pub/lang/packrat-icfp02/)

## This repository

For the pleasure of it, I wrote each of the five varieties of the
arithmetic expression parser Ford offers in his paper in JavaScript.
These are in the [src](src) directory and you can see them running by
cloning this repository and running `npm test`.

## The files

### [src/ArithRecurse.js](src/ArithRecurse.js)

Here Ford offers a standard top-down recursive parser to have something
to contrast his new technique against and to exemplify the backtracking
issue that his technique fixes.

To emulate the Haskell `Result` algebraic data type that is in the paper,
I used the visitor pattern:

    const parsed = function (v, d) {
        const match = function ({parsedArg}) {
            return parsedArg(v, d);
        };
        return {match};
    };
    const noParse = function () {
        const match = function ({noParseArg}) {
            return noParseArg();
        };
        return {match};
    };

The parser functions will return either a `parsed` or a `noParse` and when
you call `match()` on either of them you give it an argument of an object that
has a `parsed` property and a `noParse` property, each being the function
that will be called if the actual result was `parsed` or `noParse`. An example:

    pAdditive(d).match({
        parsed: (v, dd) => parsed("additive!", dd),
        noParse: () => noParse()
    })

Here `match` is called with an object that has different functions to run
when pAdditive returns either a `parsed` result or a `noParse` result.
Emulating Haskell’s sum types by using the visitor pattern.

### [src/ArithPackrat.js](src/ArithPackrat.js)

The packrat parser works elegantly because Haskell has lazy evaluation.
JavaScript, however, does not so I had to invoke some Jack The Ripper-style
butchery to emulate it.

There is a `lazy` function that wraps an argument function and only calls
it when it itself is called and caches its result for any subsequent calls.

The structure in the `recursiveParse` function that creates the derivs
objects has to pass an object to the `derivs` function that has a
function to call and the argument to it so that the client can actually
put them together and evaluate the function thus delaying evaluation in
a sort of poor-man’s-lazy JavaScript mechanism.

    const d = lazy(() => derivs(
        {op: pAdditive, d},
        {op: pMultitive, d},
        {op: pPrimary, d},
        {op: pDecimal, d},
        parseChar(input)
    ));

Note that `d` is being passed to `derivs` in the same statement where it is
declared: you can get away with this sort of nonsense pretty much only when
it is a property of an object in the argument of a function call in the body
of function expression which is the argument to another function — as it is
here.

The `derivs` function returns an object full of functions to call that
actually apply the `op`s to the `d`s:

    const derivs = function (add, mult, prim, dec, chr) {
        return {
            dvAdditive: () => add.op(add.d),
            dvMultitive: () => mult.op(mult.d),
            dvPrimary: () => prim.op(prim.d),
            dvDecimal: () => dec.op(dec.d),
            dvChar: () => chr
	};};

### [src/ArithLeft.js](src/ArithLeft.js)

This section of the paper demonstrates that the packrat parser technique
does not solve the issue that the recursive descent parser has with left
recursive grammars and that to solve it you rearrange the grammar itself
just as you would have to for the recursive descent parser.

### [src/ArithLex.js](src/ArithLex.js)

This section of the paper demonstrates that Packrat parsers do not need a
separate lexing step.

### [src/ArithMonad.js](src/ArithMonad.js)

This section of the paper demonstrates that you can tidy up your parsing
functions by combining them using monads. In Haskell this is a natural thing
to do but in JavaScript perhaps a little more heavy lifting is required
from the programmer.

The monad in this file is a function `parser` which wraps
a function from a `derivs` object to a `result` object:

    const parser = function (dToR) {
        return {
            parse: dToR,
            chain: (f) => parser(
                (d) => dToR(d).match({
                    parsed: (v, dd) => f(v).parse(dd),
                    noParse
	}))};};

Here you see the `chain` function that makes a monad a monad. You use it to
combine these `dToR` functions one after the other:

    const pAdditive = function (input) {
        const alt1 = parser((d) => d().dvMultitive()).chain((vl) =>
            parser(symbol("+")).chain((plus) =>
                parser((d) => d().dvAdditive()).chain((vr) =>
                    parser((d) => parsed(vl + vr, d))
    )))};

Haskell has a built-in syntax — the `do` keyword — that makes this sort
of composition much more palatable. JavaScript, of course, does not therefore
we must roll one by hand. Nature might rebel, but here we go:

    monadDo({
        vleft: () => parser((d) => d().dvMultitive()),
        plus: () => parser(symbol("+")),
        vright: () => parser((d) => d().dvAdditive()),
        result: function ({vleft, vright}) {
            return parser((d) => parsed(vleft + vright, d));
        }
    });

You will compare this to the Haskell version in the paper:

    do
        vleft <- Parser dvMultitive
        char ’+’
        vright <- Parser dvAdditive
        return (vleft + vright)

My version is much noisier but the overall shape is pretty close.

It is done with this function which loops through each key in the
object collecting the returned values from each parser and handing
this collection to each following function as it chains them in
turn.

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
	}());};


