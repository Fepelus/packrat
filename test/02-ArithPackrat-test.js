import parse from "../src/ArithPackrat.js";
import suite from "../lib/suite.js";

suite("ArithPackrat", function (test) {
    test({
        given: "2*(3+4)",
        should: "eval to 14",
        actual: parse("2*(3+4)"),
        expect: 14
    });
    test({
        given: "(4+3)*2",
        should: "eval to 14",
        actual: parse("(4+3)*2"),
        expect: 14
    });
});
