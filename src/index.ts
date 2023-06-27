import {
  codeExport as exporter,
  generateHooks,
  LanguageEmitterOpts,
  languageFromOpts,
} from "side-code-export";
import emitter from "./command";
import location from "./location";
import hooks from "./hook";
import { logger, terminateSuite, testSummary } from "./utils";

export const withLogger = true;
export const displayName = "JavaScript New Relic Synthetics";

export const opts: LanguageEmitterOpts = {
  // @ts-ignore
  emitter: emitter,
  displayName,
  name: "javascript-newrelic-synthetics",
  hooks: generateHooks(hooks),
  fileExtension: ".js",
  commandPrefixPadding: "  ",
  terminatingKeyword: testSummary(withLogger),
  testCompletion: "// test completion",
  suiteCompletion: terminateSuite(withLogger),
  commentPrefix: "//",
  logger: withLogger,
  generateMethodDeclaration: function generateMethodDeclaration() {
    return ``;
  },
  // Create generators for dynamic string creation of primary entities (e.g., filename, methods, test, and suite)
  generateTestDeclaration: function generateTestDeclaration(name: string) {
    return `// test ${name}`;
  },
  generateSuiteDeclaration: function generateSuiteDeclaration(name) {
    return `// suite ${name}
    ${logger(withLogger)}`;
  },
  generateFilename: function generateFilename(name: string) {
    return `${exporter.parsers.uncapitalize(
      exporter.parsers.sanitizeName(name)
    )}${opts.fileExtension}`;
  },
};

export default languageFromOpts(opts, location.emit);
