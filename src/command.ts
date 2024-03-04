import {
  EmitterContext,
  codeExport as exporter,
  ExportFlexCommandShape,
  ExportCommandShape,
  PrebuildEmitter,
  ProcessedCommandEmitter,
  ScriptShape,
} from "side-code-export";
import { CommandShape } from "@seleniumhq/side-model";
import location from "./location";
import selection from "./selection";
import { generateLoggerCommands, processEnvVariable } from "./utils";

const variableSetter = (varName: string, value: string) =>
  varName ? `vars["${varName}"] = ${value}` : "";

const emitStoreWindowHandle = async (
  varName: string,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: variableSetter(varName, "await $webDriver.getWindowHandle()"),
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Store window handle ${varName}`,
    commands,
    context
  );

  return Promise.resolve({ commands: withLogger });
};

const emitWaitForWindow = async () => {
  const generateMethodDeclaration = (name: string) => {
    return {
      body: `async function ${name}(timeout = 2) {`,
      terminatingKeyword: "}",
    };
  };
  const commands = [
    { level: 0, statement: "await $webDriver.sleep(timeout)" },
    { level: 0, statement: 'const handlesThen = vars["windowHandles"]' },
    {
      level: 0,
      statement: "const handlesNow = await $webDriver.getAllWindowHandles()",
    },
    { level: 0, statement: "if (handlesNow.length > handlesThen.length) {" },
    {
      level: 1,
      statement:
        "return handlesNow.find(handle => (!handlesThen.includes(handle)))",
    },
    { level: 0, statement: "}" },
    {
      level: 0,
      statement: 'throw new Error("New window did not appear before timeout")',
    },
  ];
  return Promise.resolve({
    name: "waitForWindow",
    commands,
    generateMethodDeclaration,
  });
};

const emitNewWindowHandling = async (
  command: CommandShape,
  emittedCommand: ExportFlexCommandShape,
  context: EmitterContext
) => {
  let commandString = "";
  if (typeof emittedCommand === "string") {
    commandString = `${emittedCommand.replace(/\n/g, "\n")}`;
    // @ts-ignore
  } else if (emittedCommand.commands) {
    // @ts-ignore
    commandString = emittedCommand.commands
      .map(
        (cmd: ExportCommandShape) =>
          // @ts-ignore
          `${cmd.statement.replace(/\n/g, "\n")}`
      )
      .join("\n");
  }

  const cmd = `vars["windowHandles"] = await $webDriver.getAllWindowHandles()\n${await commandString}\nvars["${
    command.windowHandleName
  }"] = await waitForWindow(${command.windowTimeout})`;

  const withLogger = await generateLoggerCommands(
    `Emit New Window on ${command.command}`,
    [{ level: 1, statement: cmd }],
    context
  );

  return Promise.resolve({ commands: withLogger });
};

const emitAssert = async (
  varName: string,
  value: string,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `assert(vars["${varName}"].toString() == "${value}")`,
    },
  ];
  const withLogger = await generateLoggerCommands(
    `Assert ${varName} equals ${value}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitAssertAlert = async (
  alertText: string,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `assert(await $webDriver.switchTo().alert().getText() == "${alertText}")`,
    },
  ];
  const withLogger = await generateLoggerCommands(
    `Assert alert text equals ${alertText}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitAnswerOnNextPrompt = async (
  answer: string,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: "const alert = await $webDriver.switchTo().alert()",
    },
    { level: 0, statement: `await alert().sendKeys("${answer}")` },
    { level: 0, statement: "await alert().accept()" },
  ];

  const withLogger = await generateLoggerCommands(
    `Answer on next prompt ${answer}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitCheck = async (
  locator: string,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        locator
      )}), TIMEOUT)`,
    },
    {
      level: 0,
      statement: `if(!await element.isSelected()) await element.click()`,
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Check ${locator}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitChooseCancelOnNextConfirmation = async (
  _: unknown,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    { level: 0, statement: `await $webDriver.switchTo().alert().dismiss()` },
  ];

  const withLogger = await generateLoggerCommands(
    `Choose cancel on next confirmation`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitChooseOkOnNextConfirmation = async (
  _: unknown,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    { level: 0, statement: `await $webDriver.switchTo().alert().accept()` },
  ];

  const withLogger = await generateLoggerCommands(
    `Choose OK on next confirmation`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitClick = async (
  target: string,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `await $webDriver.wait(until.elementLocated(${await location.emit(
        target
      )}), TIMEOUT).click()`,
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Click ${target}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitClose = async (
  _: unknown,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [{ level: 0, statement: `await $webDriver.close()` }];

  const withLogger = await generateLoggerCommands(`Close`, commands, context);
  return Promise.resolve({ commands: withLogger });
};

const emitDoubleClick = async (
  target: string,
  _value: unknown,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        target
      )}), TIMEOUT)`,
    },
    {
      level: 0,
      statement:
        "await $webDriver.actions({ bridge: true }).doubleClick(element).perform()",
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Double click ${target}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitDragAndDrop = async (
  dragged: string,
  dropped: string,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `const dragged = await $webDriver.wait(until.elementLocated(${await location.emit(
        dragged
      )}), TIMEOUT)`,
    },
    {
      level: 0,
      statement: `const dropped = await $webDriver.wait(until.elementLocated(${await location.emit(
        dropped
      )}), TIMEOUT)`,
    },
    {
      level: 0,
      statement:
        "await $webDriver.actions().dragAndDrop(dragged, dropped).perform()",
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Drag and drop from ${dragged} to ${dropped}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitEcho = async (
  message: string,
  _value: unknown,
  context: EmitterContext
) => {
  const _message = message.startsWith("vars[") ? message : `"${message}"`;
  const commands = [{ level: 0, statement: `console.log(${_message})` }];

  const withLogger = await generateLoggerCommands(
    `Echo ${message}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitEditContent = async (
  locator: string,
  content: string,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        locator
      )}), TIMEOUT)`,
    },
    {
      level: 0,
      statement: `await $webDriver.executeScript("if(arguments[0].contentEditable === 'true') { arguments[0].innerText = '${content}'; }", element)`,
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Edit content ${locator}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const generateScriptArguments = (script: ScriptShape) =>
  `${script.argv.length ? ", " : ""}${script.argv
    .map((varName) => `vars["${varName}"]`)
    .join(",")}`;

const emitExecuteScript = async (
  script: ScriptShape,
  varName: string,
  context: EmitterContext
) => {
  const scriptString = script.script.replace(/`/g, "\\`");
  const command = {
    level: 0,
    statement: `await $webDriver.wait($webDriver.executeScript("${scriptString}"${generateScriptArguments(
      script
    )}), TIMEOUT)`,
  };

  const variableSetCommand = {
    level: 0,
    statement: variableSetter(varName, command.statement),
  };

  const withLogger = await generateLoggerCommands(
    `Execute script ${varName}`,
    [variableSetCommand],
    context
  );

  return Promise.resolve({ commands: withLogger });
};

const emitExecuteAsyncScript = async (
  script: ScriptShape,
  varName: string,
  context: EmitterContext
) => {
  const command = {
    level: 0,
    statement: `await $webDriver.executeAsyncScript("const callback = arguments[arguments.length - 1]; ${
      script.script
    }.then(callback).catch(callback);"${generateScriptArguments(script)})`,
  };

  const variableSetCommand = {
    level: 0,
    statement: variableSetter(varName, command.statement),
  };

  const withLogger = await generateLoggerCommands(
    `Execute async script ${varName}`,
    [variableSetCommand],
    context
  );

  return Promise.resolve({ commands: withLogger });
};

const emitSetWindowSize = async (
  size: string,
  _value: unknown,
  context: EmitterContext
) => {
  const [width, height] = size.split("x");
  const commands = [
    {
      level: 0,
      statement: `await $webDriver.manage().window().setRect({ width: ${width}, height: ${height} })`,
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Set window size w:${width} h:${height}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitStoreText = async (
  locator: string,
  varName: string,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        locator
      )}), TIMEOUT)`,
    },
    {
      level: 0,
      statement: variableSetter(varName, `await element.getText()`),
    },
  ];

  const withLogger = await generateLoggerCommands(
    `Store text from ${locator} into ${varName}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitSelect = async (
  selectElement: string,
  option: string,
  context: EmitterContext
) => {
  const processedOption = processEnvVariable(option, variableLookup);

  const commands = [
    { level: 0, statement: `{` },
    {
      level: 1,
      statement: `const dropdown = await $webDriver.wait(until.elementLocated(${await location.emit(
        selectElement
      )}), TIMEOUT)`,
    },
    {
      level: 1,
      statement: `await dropdown.findElement(${await selection.emit(
        processedOption as string
      )}).click()`,
    },
    { level: 0, statement: `}` },
  ];

  const withLogger = await generateLoggerCommands(
    `Select ${processedOption} from ${selectElement}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitSelectFrame = async (
  frameLocation: string,
  _value: unknown,
  context: EmitterContext
) => {
  let commands = [];
  if (frameLocation === "relative=top" || frameLocation === "relative=parent") {
    commands = [
      { level: 0, statement: `await $webDriver.switchTo().defaultContent()` },
    ];
  } else if (/^index=/.test(frameLocation)) {
    commands = [
      {
        level: 0,
        statement: `await $webDriver.switchTo().frame(${Math.floor(
          Number(frameLocation.split("index=")?.[1])
        )})`,
      },
    ];
  } else {
    commands = [
      {
        level: 0,
        statement: `const frame = await $webDriver.wait(until.elementLocated(${await location.emit(
          frameLocation
        )}), TIMEOUT)`,
      },
      {
        level: 0,
        statement: `await $webDriver.switchTo().frame(frame)`,
      },
    ];
  }
  const withLogger = await generateLoggerCommands(
    `Select frame ${frameLocation}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitSelectWindow = async (
  windowLocation: string,
  _value: unknown,
  context: EmitterContext
) => {
  let commands = [];
  if (/^handle=/.test(windowLocation)) {
    commands = [
      {
        level: 0,
        statement: `await $webDriver.switchTo().window(${
          windowLocation.split("handle=")?.[1]
        })`,
      },
    ];
  } else if (/^name=/.test(windowLocation)) {
    commands = [
      {
        level: 0,
        statement: `await $webDriver.switchTo().window(${
          windowLocation.split("name=")?.[1]
        })`,
      },
    ];
  } else if (/^win_ser_/.test(windowLocation)) {
    if (windowLocation === "win_ser_local") {
      commands = [
        {
          level: 0,
          statement:
            "await $webDriver.switchTo().window(await $webDriver.getWindowHandle()[0])",
        },
      ];
    } else {
      const index = parseInt(windowLocation.substr("win_ser_".length));
      commands = [
        {
          level: 0,
          statement: `await $webDriver.switchTo().window(await $webDriver.getAllWindowHandles()[${index}])`,
        },
      ];
    }
  } else {
    return Promise.reject(
      new Error(`Can only emit "select window" for window handles`)
    );
  }
  const withLogger = await generateLoggerCommands(
    `Select window ${windowLocation}`.replace(
      /"([^"]+)"/,
      (_, group1) => group1
    ),
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const emitOpen = async (
  target: string,
  _value: unknown,
  context: EmitterContext
) => {
  const url = /^(file|http|https):\/\//.test(target)
    ? target
    : `${context.project.url}${target}`;
  const commands = [{ level: 0, statement: `await $webDriver.get("${url}")` }];
  const withLogger = await generateLoggerCommands(
    `Open ${url}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const generateSendKeysInput = (value: string | string[]) => {
  if (typeof value === "object") {
    return value
      .map((s) => {
        if (s.startsWith("vars[")) {
          return s;
        } else if (s.startsWith("Key[")) {
          const key = s.match(/\['(.*)'\]/)?.[1];
          return `Key.${key}`;
        } else {
          return `"${s}"`;
        }
      })
      .join(", ");
  } else {
    if (value.startsWith("vars[")) {
      return value;
    } else {
      return `"${value}"`;
    }
  }
};

const emitType = async (
  target: string,
  value: string,
  context: EmitterContext
) => {
  const commands = [
    {
      level: 0,
      statement: `await $webDriver.wait(until.elementLocated(${await location.emit(
        target
      )}), TIMEOUT).sendKeys(${generateSendKeysInput(value)})`,
    },
  ];
  const withLogger = await generateLoggerCommands(
    `Type ${value} into ${target}`,
    commands,
    context
  );
  return Promise.resolve({ commands: withLogger });
};

const variableLookup = (varName: string) => {
  return `vars["${varName}"]`;
};

function emit(command: CommandShape, context: EmitterContext) {
  return exporter.emit.command(command, emitters[command.command], {
    context,
    variableLookup,
    emitNewWindowHandling,
  });
}

const skip = async () => Promise.resolve("");

export const emitters: Record<string, ProcessedCommandEmitter> = {
  addSelection: emitSelect,
  assert: emitAssert,
  assertAlert: emitAssertAlert,
  check: emitCheck,
  chooseCancelOnNextConfirmation: skip,
  chooseCancelOnNextPrompt: skip,
  chooseOkOnNextConfirmation: skip,
  open: emitOpen,
  click: emitClick,
  clickAt: emitClick,
  close: emitClose,
  debugger: skip,
  doubleClick: emitDoubleClick,
  doubleClickAt: emitDoubleClick,
  dragAndDropToObject: emitDragAndDrop,
  echo: emitEcho,
  editContent: emitEditContent,
  else: skip,
  elseIf: skip,
  end: skip,
  executeScript: emitExecuteScript,
  executeAsyncScript: emitExecuteAsyncScript,
  removeSelection: emitSelect,
  select: emitSelect,
  selectFrame: emitSelectFrame,
  selectWindow: emitSelectWindow,
  setWindowSize: emitSetWindowSize,
  storeText: emitStoreText,
  storeWindowHandle: emitStoreWindowHandle,
  type: emitType,
  webdriverAnswerOnVisiblePrompt: emitAnswerOnNextPrompt,
  webdriverChooseCancelOnVisibleConfirmation:
    emitChooseCancelOnNextConfirmation,
  webdriverChooseOkOnVisibleConfirmation: emitChooseOkOnNextConfirmation,
};

exporter.register.preprocessors(emitters);

function register(command: string, emitter: PrebuildEmitter) {
  exporter.register.emitter({ command, emitter, emitters });
}

export default {
  emit,
  emitters,
  extras: { emitNewWindowHandling, emitWaitForWindow },
  register,
};
