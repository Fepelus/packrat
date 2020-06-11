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

import jslint from "./jslint.js";
import fs from "fs";
import path from "path";
import process from "process";
import {compose, flatMap, map, prop, reduce, runProp, tap} from "./academie.js";

/* Be warned that 'tap' refers to two different things in this source file:
 * a) the `tap` function from the academie module calls its function argument
 *    with whatever its own argument is and, disregarding what its function
 *    argument returns, it itself returns whatever its own argument is.
 *    It is used here to make calls that trigger side-effects during function
 *    composition.
 * b) TAP, the Test Anything Protocol (https://testanything.org/), is the
 *    output format that this program emits
 */

const lint = (function () {
    const getSourcefile = (name) => fs.readFileSync(name, {encoding: "UTF8"});

    const config = {
        es6: true,
        node: true
    };
    const globals = [];
    const runLint = (sourceCode) => jslint(sourceCode, config, globals);

    const fmt = function (warn) {
        return `    - (${warn.line + 1}:${warn.column + 1}) ${warn.message}`;
    };


    const formatWarnings = compose(
        runProp("join", "\n"),
        map(fmt),
        prop("warnings")
    );

    return function lint(filename) {
        const makeResult = function (result) {
            return {
                pass: result.warnings.length === 0,
                filename,
                msgs: formatWarnings(result)
            };
        };

        return compose(
            makeResult,
            runLint,
            getSourcefile
        )(filename);

    };
}());

function walk(directory, filepaths) {
    if (!Array.isArray(filepaths)) {
        return walk(directory, []);
    }
    if (directory.endsWith(".js")) {
        return directory;
    }
    const files = fs.readdirSync(directory);
    files.forEach(function (filename) {
        const filepath = path.join(directory, filename);
        if (fs.statSync(filepath).isDirectory()) {
            return walk(filepath, filepaths);
        }
        if (path.extname(filename) === ".js") {
            return filepaths.push(filepath);
        }
    });
    return filepaths;
}

const countFailures = compose(
    prop("length"),
    runProp("filter", compose(
        (b) => !b,
        prop("pass")
    ))
);

const printTap = (function () {
    const wrap = (content) => "  ---\n" + content + "\n  ...";
    const fmt = (result, idx) => (
        result.pass
        ? `ok ${idx + 1} ${result.filename}` + "\n"
        : `not ok ${idx + 1} ${result.filename}` + "\n" + wrap(result.msgs)
    );
    const header = "TAP version 13\n";
    const testplan = (results) => "1.." + results.length + "\n";
    const concat = (el, acc) => acc.concat(el);
    const reverse = function (list) {
        list.reverse();
        return list;
    };

    const gather = (results) => header.concat(
        testplan(results)
    ).concat(
        compose(
            reduce(concat),
            reverse,
            map(fmt)
        )(results)
    );

    return compose(console.log, gather);
}());

const lintdirs = compose(
    map(lint),
    flatMap(walk)
);

const slice = (n) => (arr) => arr.slice(n);
const getDirnamesFromCommandLine = slice(2);

const main = compose(
    countFailures,
    tap(printTap),
    lintdirs,
    getDirnamesFromCommandLine
);

// exit code is count of failed files which gives us 0 for success
process.exit(main(process.argv));
