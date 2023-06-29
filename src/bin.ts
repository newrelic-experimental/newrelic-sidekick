#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ProjectShape } from "@seleniumhq/side-model";
import { correctPluginPaths, loadPlugins } from "@seleniumhq/side-runtime";
import { fileWriter } from "side-code-export";

interface Configuration {
  baseUrl: string;
  debug: boolean;
  filter: string;
  format: string;
  mode: "test" | "suite";
  outputDir: string;
  project: string;
}

const [, , ...args] = process.argv;

if (args.length < 1) {
  console.error("Error: No arguments provided.");
  console.log("Usage: sidekick <input.side> <output_directory>");
  process.exit(1); // Exit with a failure code
}

if (!args[0]) {
  console.error("Error: No input .side file provided.");
  console.log("You must provide an input .side file.");
  console.log("Usage: sidekick <input.side> <output_directory>");
  process.exit(1); // Exit with a failure code
}

if (path.extname(args[0]) !== ".side") {
  console.error("Error: Input file is not a .side file.");
  console.log("You must provide a .side file as input.");
  console.log("Usage: sidekick <input.side> <output_directory>");
  process.exit(1); // Exit with a failure code
}

if (!args[1]) {
  console.error("Error: No output directory provided.");
  console.log("You must provide an output directory.");
  console.log("Usage: sidekick <input.side> <output_directory>");
  process.exit(1); // Exit with a failure code
}

const formatPath = "./dist/index.js";
const projectPath = args[0];
const outputDir = args[1];

const configuration: Configuration = {
  baseUrl: "",
  debug: false,
  filter: ".*",
  format: path.isAbsolute(formatPath)
    ? formatPath
    : path.join(process.cwd(), formatPath),
  mode: "suite",
  outputDir: path.isAbsolute(outputDir)
    ? outputDir
    : path.join(process.cwd(), outputDir),
  project: path.isAbsolute(projectPath)
    ? projectPath
    : path.join(process.cwd(), projectPath),
};

const outputFormat = require(configuration.format).default;
const project = JSON.parse(
  fs.readFileSync(configuration.project, "utf8")
) as ProjectShape;

async function main() {
  await loadPlugins(correctPluginPaths(configuration.project, project.plugins));

  const emitter = fileWriter.emitSuite;
  const iteratee = project.suites;

  for (const item of iteratee) {
    if (new RegExp(configuration.filter).test(item.name)) {
      const { body, filename } = await emitter(
        outputFormat,
        project,
        item.name
      );
      fileWriter.writeFile(
        path.join(configuration.outputDir, filename),
        body,
        project.url
      );
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
