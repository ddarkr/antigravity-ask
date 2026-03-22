"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cli_config_1 = require("./cli-config");
(0, vitest_1.describe)("cli-config", () => {
    (0, vitest_1.it)("uses the default bridge url with no overrides", () => {
        (0, vitest_1.expect)((0, cli_config_1.resolveCliConfig)(["ping"], {})).toEqual({
            args: ["ping"],
            baseUrl: "http://localhost:5820",
        });
    });
    (0, vitest_1.it)("uses AG_BRIDGE_URL when present", () => {
        (0, vitest_1.expect)((0, cli_config_1.resolveCliConfig)(["ping"], { AG_BRIDGE_URL: "http://127.0.0.1:6000/" })).toEqual({
            args: ["ping"],
            baseUrl: "http://127.0.0.1:6000",
        });
    });
    (0, vitest_1.it)("uses the explicit http port override", () => {
        (0, vitest_1.expect)((0, cli_config_1.resolveCliConfig)(["ping", "--http-port", "6000"], {})).toEqual({
            args: ["ping"],
            baseUrl: "http://localhost:6000",
        });
    });
    (0, vitest_1.it)("uses the explicit url override", () => {
        (0, vitest_1.expect)((0, cli_config_1.resolveCliConfig)(["--url", "http://127.0.0.1:7000/", "ping"], { AG_BRIDGE_URL: "http://localhost:6000" })).toEqual({
            args: ["ping"],
            baseUrl: "http://127.0.0.1:7000",
        });
    });
    (0, vitest_1.it)("prefers the explicit url override over http port", () => {
        (0, vitest_1.expect)((0, cli_config_1.resolveCliConfig)(["ping", "--url", "http://localhost:7000", "--http-port", "7001"], {})).toEqual({
            args: ["ping"],
            baseUrl: "http://localhost:7000",
        });
    });
    (0, vitest_1.it)("rejects an invalid port value", () => {
        (0, vitest_1.expect)(() => (0, cli_config_1.resolveCliConfig)(["ping", "--http-port", "abc"], {})).toThrow("Invalid --http-port value: abc");
    });
});
//# sourceMappingURL=cli-config.test.js.map