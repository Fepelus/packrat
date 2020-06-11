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

const tapToken = {
    type: {
        version: "VERSION",
        plan: "PLAN",
        testline: "TESTLINE",
        yaml: "YAML",
        bailout: "BAILOUT",
        diagnostic: "DIAGNOSTIC",
        unknown: "UNKNOWN"
    }
};

const trim = function (input) {
    return (
        typeof input === "string"
        ? input.trim()
        : input
    );
};

const newVersion = function (payload) {
    return {
        "type": tapToken.type.version,
        "payload": trim(payload)
    };
};

const newPlan = function (payload) {
    return {
        "type": tapToken.type.plan,
        "payload": trim(payload)
    };
};

const newTestLine = function (
    oknotok,
    number,
    description,
    todoDirective,
    skipReason
) {
    return {
        "type": tapToken.type.testline,
        oknotok,
        number,
        "description": trim(description),
        "todoDirective": trim(todoDirective),
        "skipReason": trim(skipReason)
    };
};

const newYaml = function (payload) {
    return {
        "type": tapToken.type.yaml,
        "payload": payload
    };
};

const newBailOut = function (payload) {
    return {
        "type": tapToken.type.bailout,
        "payload": trim(payload)
    };
};

const newDiagnostic = function (payload) {
    return {
        "type": tapToken.type.diagnostic,
        "payload": trim(payload)
    };
};

const newUnknown = function (payload) {
    return {
        "type": tapToken.type.unknown,
        "payload": payload
    };
};

export default Object.freeze({
    tapToken,
    newVersion,
    newPlan,
    newTestLine,
    newYaml,
    newBailOut,
    newDiagnostic,
    newUnknown
});
