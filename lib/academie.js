/*
Copyright (C) 2020 Patrick Borgeest

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA
OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
*/

const curry = function (f) {
    const arity = f.length;
    return function $curry(...args) {
        if (args.length < arity) {
            return $curry.bind(null, ...args);
        }
        return f(...args);
    };
};

const compose = (...fs) => (x) => fs.reduceRight((y, f) => f(y), x);
const runProp = (f, ...args) => (o) => o[f].apply(o, args);
const map = (f) => runProp("map", f);
const flatMap = (f) => runProp("flatMap", f);
const reduce = (f) => runProp("reduce", f);
const prop = curry((p, o) => o[p]);
const indent = (n) => (s) => " ".repeat(n) + s;
const indentLines = (width) => compose(
    runProp("join", "\n"),
    map(indent(width)),
    runProp("split", "\n")
);
const seq = (i) => [...(new Array(i)).keys()];
const tap = curry(function (f, x) {
    f(x);
    return x;
});

export {
    compose,
    curry,
    flatMap,
    indentLines,
    map,
    prop,
    reduce,
    runProp,
    seq,
    tap
};
