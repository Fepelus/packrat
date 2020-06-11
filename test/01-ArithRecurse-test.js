import parse from "../src/ArithRecurse.js";
import suite from "../lib/suite.js";

suite("ArithRecurse", function (test) {
    test({
        given: "2*(3+4)",
        should: "eval to 14",
        actual: parse("2*(3+4)"),
        expect: 14
    });
});
