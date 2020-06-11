#!/usr/bin/env node

import {resolve} from "path";
import {readdirSync} from "fs";

const globSync = function (pattern) {
    const splitPattern = pattern.split("/");
    const directory = (
        splitPattern.length > 1
        ? splitPattern.slice(0, splitPattern.length - 1).join("/")
        : "."
    );
    try {
        return readdirSync(directory).filter(
            (name) => name.match(
                (splitPattern[splitPattern.length - 1]).replace("*", ".*")
            )
        ).map(
            (name) => [directory, name].join("/")
        );
    } catch {
        return [];
    }
};

const cwd = process.cwd();

process.argv.slice(2).forEach(function (arg) {
    const files = globSync(arg);
    files.forEach(function (file) {
        import(resolve(cwd, file));
    });
});
