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
import tapTokens from "./tapTokens.js";
import {compose, runProp} from "../academie.js";

// This function returns a stream that accepts
// a string of TAP which it parses and emits as
// `tapTokens`

function readTap() {
    const freshYamlState = function () {
        return {
            inYaml: false,
            indent: "",
            lines: []
        };
    };
    let yamlState = freshYamlState();
    const output = new Transform({
        readableObjectMode: true,
        transform(chunk, ignore, callback) {
            const pushToken = function (input) {
                if (!Array.isArray(input)) {
                    input = [input];
                }
                input.forEach(output.push.bind(output));
            };
            const parseLineToToken = function (line) {
                const tokens = [];
                // handling YAML must be first
                if (yamlState.inYaml) {
                    if (!line.startsWith(yamlState.indent)) {
                        tokens.push(
                            tapTokens.newYaml(yamlState.lines.join("\n"))
                        );
                        yamlState = freshYamlState();
                        // fall through to match the unindented line below
                    } else if (line.startsWith(yamlState.indent + "...")) {
                        tokens.push(
                            tapTokens.newYaml(yamlState.lines.join("\n"))
                        );
                        yamlState = freshYamlState();
                        return tokens;
                    } else {
                        const indentedLine = line.substring(
                            yamlState.indent.length
                        );
                        yamlState.lines.push(indentedLine);
                        return [];
                    }
                } else {
                    const rxYaml = /^(\s+)---/;
                    const yamlMatch = line.match(rxYaml);
                    if (yamlMatch !== null) {
                        yamlState.inYaml = true;
                        yamlState.indent = yamlMatch[1];
                        return [];
                    }
                }

                // match a version
                if (line === "TAP version 13") {
                    tokens.push(tapTokens.newVersion(line));
                    return tokens;
                }

                // match a test plan
                const rxPlan = /^1\.\.(\d+)$/;
                const planMatch = line.match(rxPlan);
                if (planMatch !== null) {
                    tokens.push(tapTokens.newPlan(planMatch[1]));
                    return tokens;
                }

                // match a test line
                // Copy the regex into https://jex.im/regulex/ for a diagram
                const rxTestLine = /^((?:not\u0020)?ok)(?:\s+(\d+))?(?:\s+-)?\s+([^#]*)(?:(?:#\u0020[Tt][Oo][Dd][Oo](?:\s+(.*))?)|(?:#\u0020[Ss][Kk][Ii][Pp]\S*\s(.*)))?$/;
                const testLineMatch = line.match(rxTestLine);
                if (testLineMatch !== null) {
                    tokens.push(tapTokens.newTestLine(
                        testLineMatch[1],
                        testLineMatch[2],
                        testLineMatch[3],
                        testLineMatch[4],
                        testLineMatch[5]
                    ));
                    return tokens;
                }

                // match a bail out
                const rxBailout = /^Bail\u0020out!(?:\s+(.*))?$/;
                const bailoutMatch = line.match(rxBailout);
                if (bailoutMatch !== null) {
                    tokens.push(tapTokens.newBailOut(bailoutMatch[1]));
                    return tokens;
                }

                // match a diagnostic
                const rxDiagnostic = /^#(?:\s+(.*))?$/;
                const diagnosticMatch = line.match(rxDiagnostic);
                if (diagnosticMatch !== null) {
                    tokens.push(tapTokens.newDiagnostic(diagnosticMatch[1]));
                    return tokens;
                }

                // did not match any known TAP line
                tokens.push(tapTokens.newUnknown(line));
                return tokens;
            };
            compose(
                runProp("forEach", pushToken),
                runProp("map", parseLineToToken),
                runProp("filter", (line) => line !== ""),
                runProp("split", "\n"),
                runProp("toString")
            )(chunk);
            callback();
        }
    });

    return output;
}

export default Object.freeze(readTap);
