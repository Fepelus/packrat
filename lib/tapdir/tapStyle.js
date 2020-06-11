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

import {Transform} from "stream";
import {compose, map, prop, reduce, indentLines} from "../academie.js";
import tapTokens from "./tapTokens.js";

const taptype = tapTokens.tapToken.type;

const stateMachine = function () {
    const tests = {
        passing: [],
        failing: [],
        skipped: [],
        todo: [],
        passedTodo: [] // also in passingTests
    };
    let plannedTests;

    const totalRun = function () {
        return compose(
            reduce((acc, curr) => acc + curr),
            map(prop("length")),
            map((key) => tests[key]),
            Object.keys
        )(tests) - tests.passedTodo.length;
    };

    const testPlanIsComplete = function () {
        return totalRun() === plannedTests;
    };

    const storePlan = function (token) {
        plannedTests = Number.parseInt(token.payload);
    };

    const padded = function (key, value) {
        const spaces = " ".repeat(
            13 - (key.length + value.toString().length)
        );
        return ` ${key}:${spaces}${value}`;
    };

    const formatSummary = function () {
        const output = [
            "",
            padded("total", totalRun())
        ];
        Object.keys(tests).forEach(function (key) {
            if (tests[key].length > 0) {
                output.push(padded(key, tests[key].length));
            }
        });
        return output.join("\n");
    };

    const storeTestLine = function (token) {
        if (token.skipReason !== undefined) {
            tests.skipped.push(token);
            return;
        }
        if (token.oknotok === "ok") {
            if (token.todoDirective !== undefined) {
                tests.passedTodo.push(token);
            }
            tests.passing.push(token);
            return;
        }
        if (token.todoDirective !== undefined) {
            tests.todo.push(token);
            return;
        }
        tests.failing.push(token);
    };

    const ansi = {
        reset: "\u001b[0m",
        fgGreen: "\u001b[32m",
        fgYellow: "\u001b[33m",
        fgBoldGreen: "\u001b[1;32m",
        fgBoldYellow: "\u001b[1;33m",
        fgBoldRed: "\u001b[1;31m"
    };

    const formatDiagnostic = function (token) {
        return [
            "\n  ",
            ansi.fgYellow,
            token.payload,
            ansi.reset
        ].join("");
    };

    const formatTestline = function (token) {
        if (token.todoDirective !== undefined) {
            if (token.oknotok === "ok") {
                return [
                    "    ",
                    ansi.fgBoldGreen,
                    "✔ ",
                    ansi.reset,
                    token.description,
                    " # TODO ",
                    token.todoDirective
                ].join("");
            } else {
                return [
                    "    ✘ ",
                    token.description,
                    " # TODO ",
                    token.todoDirective
                ].join("");
            }
        }
        if (token.skipReason !== undefined) {
            return [
                "      ",
                token.description,
                " # SKIP ",
                token.skipReason
            ].join("");
        }
        if (token.oknotok === "ok") {
            return [
                "    ",
                ansi.fgGreen,
                "✔ ",
                ansi.reset,
                token.description
            ].join("");
        } else {
            return [
                "    ",
                ansi.fgBoldRed,
                "✘ ",
                ansi.reset,
                token.description
            ].join("");
        }
    };

    const formatYaml = function (token) {
        return [
            ansi.fgBoldYellow,
            indentLines(6)(token.payload),
            ansi.reset
        ].join("");
    };

    const noVersion = {
        handle: function noVersionHandle(token) {
            if (token.type === taptype.version) {
                return {
                    next: foundVersion
                };
            }
            return {
                next: noVersion,
                output: token.payload
            };
        }
    };

    const foundVersion = {
        handle: function foundVersionHandle(token) {
            if (token.type === taptype.testline) {
                storeTestLine(token);
                return {
                    next: foundVersion,
                    output: formatTestline(token)
                };
            }
            if (token.type === taptype.yaml) {
                return {
                    next: foundVersion,
                    output: formatYaml(token)
                };
            }
            if (token.type === taptype.plan) {
                storePlan(token);
                if (testPlanIsComplete()) {
                    return {
                        output: "\n" + formatSummary()
                    };
                }
                return {
                    next: foundPlan
                };
            }
            if (token.type === taptype.diagnostic) {
                return {
                    next: foundVersion,
                    output: formatDiagnostic(token)
                };
            }
            return {
                next: foundVersion,
                output: token.payload
            };
        }
    };

    const foundPlanOutput = function (token) {
        if (token.type === taptype.diagnostic) {
            return {
                next: foundPlan,
                output: formatDiagnostic(token)
            };
        }
        if (token.type === taptype.yaml) {
            return {
                next: foundPlan,
                output: formatYaml(token)
            };
        }
        if (token.type !== taptype.testline) {
            return {
                next: foundPlan,
                output: token.payload
            };
        }
        storeTestLine(token);
        return {
            next: foundPlan,
            output: formatTestline(token)
        };
    };
    const foundPlan = {
        handle: function foundPlanHandle(token) {
            const output = foundPlanOutput(token);
            if (testPlanIsComplete()) {
                output.output = output.output + "\n" + formatSummary();
            }
            return output;
        }
    };

    let current = noVersion;
    return {
        handle: function (token) {
            const handled = current.handle(token);
            current = handled.next;
            return handled.output;
        }
    };
};

const tapStyle = function () {
    const machine = stateMachine();
    const output = new Transform({
        writableObjectMode: true,
        transform(chunk, ignore, callback) {
            const handled = machine.handle(chunk);
            if (handled !== undefined) {
                output.push(handled + "\n");
            }
            callback();
        }
    });

    return output;
};

export default Object.freeze(tapStyle);
