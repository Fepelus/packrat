#!/usr/bin/env node

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

import tapRead from "./tapdir/tapRead.js";
import tapStyle from "./tapdir/tapStyle.js";

let exitCode = 0;
process.stdin.pipe(
    tapRead()
).pipe(
    tapStyle()
).on(
    "data",
    function (chunk) {
        if (chunk.toString().indexOf("✘") > -1) {
            exitCode = 1;
        }
    }
).on(
    "end",
    function () {
        process.exitCode = exitCode;
    }
).pipe(
    process.stdout
);
