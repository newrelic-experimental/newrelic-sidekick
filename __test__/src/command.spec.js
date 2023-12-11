import Command from "../../src/command";

let context;
beforeAll(() => {
  const project = {
    name: "test",
    url: "http://localhost:3000",
  };

  context = {
    project,
  };
});

describe("emitStoreWindowHandle", () => {
  it("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "storeWindowHandle",
      target: "handle",
      value: "",
    };

    const storeWindowHandleCommand = await emit(command, context);

    expect(storeWindowHandleCommand).toEqual({
      commands: [
        {
          level: 0,
          statement: 'vars["handle"] = await $webDriver.getWindowHandle()',
        },
      ],
    });
  });
});

describe("emitWaitForWindow", () => {
  it("should execute the script successfully", async () => {
    const { extras } = Command;

    const waitForWindowCommand = await extras.emitWaitForWindow();

    expect(waitForWindowCommand).toEqual({
      name: "waitForWindow",
      generateMethodDeclaration: expect.any(Function),
      commands: [
        { level: 0, statement: "await $webDriver.sleep(timeout)" },
        { level: 0, statement: 'const handlesThen = vars["windowHandles"]' },
        {
          level: 0,
          statement:
            "const handlesNow = await $webDriver.getAllWindowHandles()",
        },
        {
          level: 0,
          statement: "if (handlesNow.length > handlesThen.length) {",
        },
        {
          level: 1,
          statement:
            "return handlesNow.find(handle => (!handlesThen.includes(handle)))",
        },
        { level: 0, statement: "}" },
        {
          level: 0,
          statement:
            'throw new Error("New window did not appear before timeout")',
        },
      ],
    });
  });
});

describe("emitNewWindowHandling", () => {
  it("should execute the script successfully", async () => {
    const { extras } = Command;

    const command = {
      command: "newWindowHandling",
      windowHandleName: "handle",
      windowTimeout: 10000,
    };
    const emittedCommand = "test";

    const newWindowHandlingCommand = await extras.emitNewWindowHandling(
      command,
      emittedCommand,
      context
    );

    expect(newWindowHandlingCommand).toEqual({
      commands: [
        {
          level: 1,
          statement:
            'vars["windowHandles"] = await $webDriver.getAllWindowHandles()\ntest\nvars["handle"] = await waitForWindow(10000)',
        },
      ],
    });
  });
});

describe("emitAssert", () => {
  it("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "assert",
      target: "testTarget",
      value: "testValue",
    };

    const assertCommand = await emit(command, context);

    const expectedVarName = "testTarget";
    const expectedValue = "testValue";
    expect(assertCommand).toEqual({
      commands: [
        {
          level: 0,
          statement: `assert(vars["${expectedVarName}"].toString() == "${expectedValue}")`,
        },
      ],
    });
  });
});

describe("emitAssertAlert", () => {
  it("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "assertAlert",
      target: "testTarget",
    };

    const assertAlertCommand = await emit(command, context);

    const expectedTarget = "testTarget";
    expect(assertAlertCommand).toEqual({
      commands: [
        {
          level: 0,
          statement: `assert(await $webDriver.switchTo().alert().getText() == "${expectedTarget}")`,
        },
      ],
    });
  });
});

describe("emitAnswerOnNextPrompt", () => {
  // Test skipped because "answerOnNextPrompt" is not supported by Selenium WebDriver
  it.skip("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "answerOnNextPrompt",
      target: "testTarget",
    };

    const answerOnNextPromptCommand = await emit(command, context);

    const expectedTarget = "testTarget";
    expect(answerOnNextPromptCommand).toEqual({
      commands: [
        {
          level: 0,
          statement: "const alert = await $webDriver.switchTo().alert()",
        },
        { level: 0, statement: `await alert().sendKeys("${expectedTarget}")` },
        { level: 0, statement: "await alert().accept()" },
      ],
    });
  });
});

describe("emitCheck", () => {
  it.only("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "check",
      target: "css=testTarget",
    };

    const checkCommand = await emit(command, context);

    const expectedTarget = "testTarget";
    expect(checkCommand).toEqual({
      commands: [
        {
          level: 0,
          statement: `const element = await $webDriver.wait(until.elementLocated(By.css("${expectedTarget}")), TIMEOUT)`,
        },
        {
          level: 0,
          statement: "if(!await element.isSelected()) await element.click()",
        },
      ],
    });
  });
});

describe("emitChooseCancelOnNextConfirmation", () => {
  // Test skipped because "chooseCancelOnNextConfirmation" is not supported by Selenium WebDriver
  it.skip("should execute the script successfully", () => {});
});

describe("emitOpen", () => {
  it("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "open",
      target: "/",
      value: "",
    };

    const openCommand = await emit(command, context);

    expect(openCommand).toEqual({
      commands: [
        {
          level: 0,
          statement: 'await $webDriver.get("http://localhost:3000/")',
        },
      ],
    });
  });
});

describe("emitClick", () => {
  it("should execute the script successfully", async () => {
    const { emit } = Command;

    const command = {
      command: "click",
      target: "link=button",
      value: "",
    };

    const clickCommand = await emit(command, context);

    expect(clickCommand).toEqual({
      commands: [
        {
          level: 0,
          statement:
            'await $webDriver.wait(until.elementLocated(By.linkText("button")), TIMEOUT).click()',
        },
      ],
    });
  });
});
