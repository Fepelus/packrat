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

import {
    compose,
    indentLines,
    map,
    reduce,
    prop,
    runProp,
    tap
} from "./academie.js";

// Excuse me, node. I _do_ handle these rejections.
let lintbreaker = 0;
process.on("unhandledRejection", function () {
    lintbreaker += 1;
});
process.on("rejectionHandled", function () {
    lintbreaker += 1;
});

const isFunction = (x) => typeof x === "function";
const isPromise = (x) => x && isFunction(x.then);

const index = (function () {
    let idx = 0;
    return function () {
        idx += 1;
        return idx;
    };
}());

const stringify = function (input) {
    const specialCases = {
        "string": input,
        "undefined": "undefined"
    };
    return specialCases[typeof input] || JSON.stringify(input);
};

const suites = {};

const suite = function (suiteName, suiteBodyFn) {
    try {
        suiteBodyFn(testFactory(suiteName));
    } catch (e) {
        suites[suiteName].tests = [{
            given: `The body of '${suiteName}' suite`,
            should: "not raise an exception",
            actual: fmtError(e),
            expected: "No exception",
            stack: formatStack(e.stack)
        }];
    }
};

const first = (n) => (arr) => arr.slice(0, n);
const formatStack = compose(
    runProp("join", "\n"),
    first(6),
    runProp("split", "\n")
);

const testFactory = function (suiteName) {
    if (suites[suiteName] === undefined) {
        suites[suiteName] = {
            tests: []
        };
    }
    return function (testBody) {
        testBody.stack = formatStack((new Error()).stack);
        suites[suiteName].tests.push(testBody);
    };
};

const yamlString = function (input) {
    let stringed = stringify(input).replace(/\\n/g, "\n");
    return (
        stringed.indexOf("\n") < 0
        ? stringed
        : "|-\n" + indentLines(2)(stringed)
    );
};

const passTap = (g, s) => `ok {idx} - Given ${g}: should ${s}`;
const failTap = (g, s) => `not ${passTap(g, s)}`;
const skipTap = function (test) {
    const reason = (
        typeof test.skip === "string"
        ? `: ${test.skip}`
        : ""
    );
    return passTap(test.given, test.should) + " # SKIP" + reason;
};

const yamlTap = function (actual, test) {
    const wrapYaml = (s) => "\n---\n" + s + "\n...";
    const toYaml = (keys) => keys.map((key) => (
        key === "actual"
        ? `actual: ${yamlString(actual)}`
        : `${key}: ${yamlString(test[key])}`
    ));

    return compose(
        indentLines(2),
        wrapYaml,
        indentLines(2),
        runProp("join", "\n"),
        toYaml,
        Object.keys
    )(test);
};

const resultString = function (actual, test) {

    if (typeof test.skip === "string") {
        return skipTap(test);
    }

    const testPasses = stringify(actual) === stringify(test.expect);
    if (testPasses) {
        return passTap(test.given, test.should) + (
            typeof test.todo === "string"
            ? ` # TODO ${test.todo}`
            : ""
        );
    }
    return failTap(test.given, test.should) + (
        typeof test.todo === "string"
        ? ` # TODO ${test.todo}`
        : yamlTap(actual, test)
    );
};

const fmtError = (e) => (
    e.hasOwnProperty("message")
    ? "Error: " + e.message
    : "Error: " + e
);

const runTestOfFunction = function (test) {
    let actual;
    try {
        actual = test.actual();
    } catch (e) {
        actual = fmtError(e);
    }
    return resultString(actual, test);
};

const runTestOfPromise = function (test) {
    return new Promise(function (resolve) {
        test.actual.then(function (result) {
            resolve(resultString(result, test));
        }).catch(function (e) {
            resolve(resultString(fmtError(e), test));
        });
    });
};

const runTests = function (tests) {
    return tests.map(function (test) {
        if (test.skip !== undefined) {
            return Promise.resolve(resultString(test.expected, test));
        }
        if (isFunction(test.actual)) {
            return Promise.resolve(runTestOfFunction(test));
        }
        if (isPromise(test.actual)) {
            return runTestOfPromise(test);
        }
        return Promise.resolve(resultString(test.actual, test));
    });
};

const run = function () {
    const showVersion = tap((stdout) => stdout("TAP version 13"));
    const showPlan = tap(function (stdout) {
        const testCount = compose(
            reduce((acc, curr) => acc + curr),
            map(prop("length")),
            map(prop("tests")),
            map((suiteName) => suites[suiteName]),
            Object.keys
        )(suites);
        stdout(`1..${testCount}`);
    });
    const showTestlines = function (stdout) {
        Object.keys(suites).forEach(function (suiteName) {
            const printOnce = (function () {
                let done = false;
                return function (input) {
                    if (done) {
                        return;
                    }
                    stdout(input);
                    done = true;
                };
            }());
            Promise.all(
                runTests(suites[suiteName].tests)
            ).then((results) => results.forEach(function (output) {
                printOnce("# " + suiteName);
                stdout(output.replace("{idx}", index()));
            }));
        });
    };

    compose(
        showTestlines,
        showPlan,
        showVersion
    )(console.log.bind(console));
};

setTimeout(run, 1);

export default Object.freeze(suite);
export {suite};
