import { EmitterContext, ExportCommandShape } from "side-code-export";

/* Utility functions */

const globalStartTime = Date.now();
enum STEP_TYPE {
  HARD = "HARD",
  SOFT = "SOFT",
  OPTIONAL = "OPTIONAL",
}
let STEP = 1; // A global indicator of number of steps
let CATEGORY_STEP: Record<string, number> = {}; //A counter of steps per category
let FAILED_STEPS: Array<{ failure: string; reason: string }> = []; //A record of failed soft steps
// @ts-ignore
let HARD_FAILURE = "";

interface StepFunction {
  (): Promise<void>;
}

/**
 *
 * timedStep()
 * Performs a step timing start and end and dealing with failure.
 *
 * @param {string} type
 * @param {string} description
 * @param {string} category
 * @param {StepFunction} stepFn
 * @returns Promise
 */

const timedStep = async (
  type: string,
  description: string,
  category: string,
  stepFn: StepFunction
): Promise<boolean> => {
  const thisStep = STEP++;
  if (!CATEGORY_STEP[category]) {
    CATEGORY_STEP[category] = 1;
  }
  const categoryStep = CATEGORY_STEP[category]++;
  const startTimestamp = Date.now() - globalStartTime;
  console.log(
    `START  Step ${thisStep}: [${category}:${categoryStep}] start: ${startTimestamp}ms -> ${description}`
  );

  try {
    await stepFn(); //runs the function for this step
    const endTimestamp = Date.now() - globalStartTime;
    const elapsed = endTimestamp - startTimestamp;
    console.log(
      `FINISH Step ${thisStep}: [${category}:${categoryStep}] ended: ${endTimestamp}ms, elapsed: ${elapsed}ms -> ${description}`
    );
    return Promise.resolve(true);
  } catch (err) {
    const error = err as Error;
    if (type == STEP_TYPE.HARD) {
      console.log(
        `ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚══> This is a HARD step error so processing of further steps will cease and the  journey will be failed.`
      );
      HARD_FAILURE = `Step ${thisStep}: [${category}:${categoryStep}] -> ${description}`;
      throw error;
    } else if (type == STEP_TYPE.SOFT) {
      console.log(
        `ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚═══> This is a SOFT step error so processing of further steps will continue but the journey will be failed.`
      );
      console.log(`\n${error.message}\n\n`);
      FAILED_STEPS.push({
        failure: `Step ${thisStep}: [${category}:${categoryStep}] - ${description}`,
        reason: error.message,
      });
      return Promise.resolve(true);
    } else {
      console.log(
        `ERROR! Step ${thisStep}: [${category}:${categoryStep}] -> ${description}\n ╚═══> This is an OPTIONAL step so this error will not fail the journey.`
      );
      console.log(`\n${error.message}\n\n`);
      return Promise.resolve(true);
    }
  }
};

export const logger = (withLogger: boolean) =>
  withLogger
    ? `
// A global start timer
const globalStartTime = Date.now();
// Step type definitions
const STEP_TYPE = { HARD: "HARD", SOFT: "SOFT", OPTIONAL: "OPTIONAL" };
// A global indicator of number of steps
let STEP = 1;
// A counter of steps per category
let CATEGORY_STEP = {};
// A record of failed soft steps
let FAILED_STEPS = [];
// A hard failure message
let HARD_FAILURE = "";

const stepLogger = ${timedStep.toString()}`
    : "";

export const testDeclaration = (withLogger: boolean) =>
  withLogger
    ? `
try {
`
    : "";

export const testSummary = (withLogger: boolean) =>
  withLogger
    ? `
if (FAILED_STEPS.length > 0) {
  console.log(
    \`========[ JOURNEY END ]========
    Journey failed: \${FAILED_STEPS.length} soft failures detected:\`
  );
  console.log(FAILED_STEPS);
  assert.fail(
    \`Journey failed: There were \${FAILED_STEPS.length} soft step failures.\`
  );
} else {
  console.log(
    \`========[ JOURNEY END ]========
    Journey completed successfully\`
  );
}
`
    : "";

export const terminateSuite = (withLogger: boolean) =>
  withLogger
    ? `
} catch (err) {
  console.log(err.message);
  console.log(
    \`========[ JOURNEY END ]========
    Journey failed: there was a hard step failure.\`
  );
  console.log(HARD_FAILURE);
  if (FAILED_STEPS.length > 0) {
    console.log(
      \`There were also \${FAILED_STEPS.length} soft step failures:\`
    );
    console.log(FAILED_STEPS);
  }
  assert.fail(
    \`Journey failed: There was a hard step failure and \${FAILED_STEPS.length} soft step failures.\`
  );
}
  `
    : "";

export const generateLoggerCommands = async (
  description: string,
  commands: ExportCommandShape[],
  context: EmitterContext
) => {
  // @ts-ignore
  if (!context.logger) {
    return commands;
  }

  const loggerCommands = [
    {
      level: 0,
      statement: "await stepLogger(",
    },
    {
      level: 1,
      statement: "STEP_TYPE.HARD,",
    },
    {
      level: 1,
      statement: `"${description}",`,
    },
    {
      level: 1,
      statement: `"New Relic Synthetics Journey",`,
    },
    {
      level: 1,
      statement: "async () => {",
    },
    ...commands
      .filter(
        (cmd): cmd is { level: number; statement: string } =>
          typeof cmd !== "string"
      )
      .map((cmd) => ({ ...cmd, level: cmd.level + 2 })),
    {
      level: 1,
      statement: "}",
    },
    {
      level: 0,
      statement: ")",
    },
  ];

  return loggerCommands;
};
