import parse from "../src/ArithLeft.js";
import suite from "../lib/suite.js";

suite("ArithLeft", function (test) {
    test({
        given: "2*(3+4)",
        should: "eval to 14",
        actual: parse("2*(3+4)"),
        expect: 14
    });
    test({
        given: "(4-1+2-1)*(9%5/3)",
        should: "eval to 4",
        actual: parse("(4-1+2-1)*(9%5/3)"),
        expect: 4
    });
    test({
        given: "7%4",
        should: "eval to 3",
        actual: parse("7%4"),
        expect: 3
    });
    test({
        given: "(4-2)*(6/2)",
        should: "eval to 6",
        actual: parse("(4-2)*(7/2)"),
        expect: 6
    });
});
