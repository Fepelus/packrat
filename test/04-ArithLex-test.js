import parse from "../src/ArithLex.js";
import suite from "../lib/suite.js";

suite("ArithLex", function (test) {
    const spaces = "2 * (    3+  4) ";
    test({
        given: spaces,
        should: "ignore spaces",
        actual: parse(spaces),
        expect: 14
    });
    test({
        given: "14",
        should: "handle decimals",
        actual: parse("14"),
        expect: 14
    });
    test({
        given: "11 % 4",
        should: "handle mod",
        actual: parse("11 % 4"),
        expect: 3
    });
    test({
        given: "2 * (( + 3)",
        should: "return a partial result in the presence of error",
        actual: parse("2 * (( + 3)"),
        expect: 2
    });
});
