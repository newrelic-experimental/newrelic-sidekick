import {
  EmitterContext,
  codeExport as exporter,
  ExportFlexCommandShape,
  PrebuildEmitter,
  ProcessedCommandEmitter,
  ScriptShape,
} from 'side-code-export'
import { CommandShape } from '@seleniumhq/side-model'
import location from './location'
import selection from './selection'

const variableSetter = (varName: string, value: string) =>
  varName ? `vars["${varName}"] = ${value}` : ''

const emitStoreWindowHandle = async (varName: string) =>
  Promise.resolve(variableSetter(varName, 'await $webDriver.getWindowHandle()'))

const emitWaitForWindow = async () => {
  const generateMethodDeclaration = (name: string) => {
    return {
      body: `async function ${name}(timeout = 2) {`,
      terminatingKeyword: '}',
    }
  }
  const commands = [
    { level: 0, statement: 'await $webDriver.sleep(timeout)' },
    { level: 0, statement: 'const handlesThen = vars["windowHandles"]' },
    {
      level: 0,
      statement: 'const handlesNow = await $webDriver.getAllWindowHandles()',
    },
    { level: 0, statement: 'if (handlesNow.length > handlesThen.length) {' },
    {
      level: 1,
      statement:
        'return handlesNow.find(handle => (!handlesThen.includes(handle)))',
    },
    { level: 0, statement: '}' },
    {
      level: 0,
      statement: 'throw new Error("New window did not appear before timeout")',
    },
  ]
  return Promise.resolve({
    name: 'waitForWindow',
    commands,
    generateMethodDeclaration,
  })
}

const emitNewWindowHandling = async (
  command: CommandShape,
  emittedCommand: ExportFlexCommandShape
) =>
  Promise.resolve(
    `vars["windowHandles"] = await $webDriver.getAllWindowHandles()\n${await emittedCommand}\nvars["${
      command.windowHandleName
    }"] = await waitForWindow(${command.windowTimeout})`
  )

const emitAssert = async (varName: string, value: string) =>
  Promise.resolve(`assert(vars["${varName}"].toString() == "${value}")`)

const emitAssertAlert = async (alertText: string) =>
  Promise.resolve(
    `assert(await $webDriver.switchTo().alert().getText() == "${alertText}")`
  )

const emitAnswerOnNextPrompt = async (answer: string) => {
  const commands = [
    {
      level: 0,
      statement: 'const alert = await $webDriver.switchTo().alert()',
    },
    { level: 0, statement: `await alert().sendKeys("${answer}")` },
    { level: 0, statement: 'await alert().accept()' },
  ]
  return Promise.resolve({ commands })
}

const emitCheck = async (locator: string) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        locator
      )}))`,
    },
    {
      level: 0,
      statement: `if(!await element.isSelected()) await element.click()`,
    },
  ]

  return Promise.resolve({ commands })
}

const emitChooseCancelOnNextConfirmation = async () =>
  Promise.resolve(`await $webDriver.switchTo().alert().dismiss()`)

const emitChooseOkOnNextConfirmation = async () =>
  Promise.resolve(`await $webDriver.switchTo().alert().accept()`)

const emitClick = async (target: string) =>
  Promise.resolve(
    `await $webDriver.wait(until.elementLocated(${await location.emit(
      target
    )})).click()`
  )

const emitClose = async () => Promise.resolve(`await $webDriver.close()`)

const emitDoubleClick = async (target: string) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        target
      )}))`,
    },
    {
      level: 0,
      statement:
        'await $webDriver.actions({ bridge: true }).doubleClick(element).perform()',
    },
  ]
  return Promise.resolve({ commands })
}

const emitDragAndDrop = async (dragged: string, dropped: string) => {
  const commands = [
    {
      level: 0,
      statement: `const dragged = await $webDriver.wait(until.elementLocated(${await location.emit(
        dragged
      )}))`,
    },
    {
      level: 0,
      statement: `const dropped = await $webDriver.wait(until.elementLocated(${await location.emit(
        dropped
      )}))`,
    },
    {
      level: 0,
      statement:
        'await $webDriver.actions().dragAndDrop(dragged, dropped).perform()',
    },
  ]
  return Promise.resolve({ commands })
}

const emitEcho = (message: string) => {
  const _message = message.startsWith('vars[') ? message : `"${message}"`
  return Promise.resolve(`console.log(${_message})`)
}

const emitEditContent = async (locator: string, content: string) => {
  const commands = [
    {
      level: 0,
      statement: `const element = await $webDriver.wait(until.elementLocated(${await location.emit(
        locator
      )}))`,
    },
    {
      level: 0,
      statement: `await $webDriver.executeScript("if(arguments[0].contentEditable === 'true') { arguments[0].innerText = '${content}'; }", element)`,
    },
  ]
  return Promise.resolve({ commands })
}

const generateScriptArguments = (script: ScriptShape) =>
  `${script.argv.length ? ', ' : ''}${script.argv
    .map((varName) => `vars["${varName}"]`)
    .join(',')}`

const emitExecuteScript = async (script: ScriptShape, varName: string) => {
  const scriptString = script.script.replace(/`/g, '\\`')
  const result = `await $webDriver.executeScript("${scriptString}"${generateScriptArguments(
    script
  )})`

  return Promise.resolve(variableSetter(varName, result))
}

const emitExecuteAsyncScript = async (script: ScriptShape, varName: string) => {
  const result = `await $webDriver.executeAsyncScript("const callback = arguments[arguments.length - 1]; ${
    script.script
  }.then(callback).catch(callback);"${generateScriptArguments(script)}")`

  return Promise.resolve(variableSetter(varName, result))
}

const emitSetWindowSize = async (size: string) => {
  const [width, height] = size.split('x')
  return Promise.resolve(
    `await $webDriver.manage().window().setRect({ width: ${width}, height: ${height} })`
  )
}

const emitSelect = async (selectElement: string, option: string) => {
  const commands = [
    { level: 0, statement: `{` },
    {
      level: 1,
      statement: `const dropdown = await $webDriver.wait(until.elementLocated(${await location.emit(
        selectElement
      )}))`,
    },
    {
      level: 1,
      statement: `await dropdown.findElement(${await selection.emit(
        option
      )}).click()`,
    },
    { level: 0, statement: `}` },
  ]
  return Promise.resolve({ commands })
}

const emitSelectFrame = async (frameLocation: string) => {
  if (frameLocation === 'relative=top' || frameLocation === 'relative=parent') {
    return Promise.resolve(`await $webDriver.switchTo().defaultContent()`)
  } else if (/^index=/.test(frameLocation)) {
    return Promise.resolve(
      `await $webDriver.switchTo().frame(${Math.floor(
        Number(frameLocation.split('index=')?.[1])
      )})`
    )
  } else {
    return Promise.resolve({
      commands: [
        {
          level: 0,
          statement: `const frame = await $webDriver.wait(until.elementLocated(${await location.emit(
            frameLocation
          )}))`,
        },
        {
          level: 0,
          statement: `await $webDriver.switchTo().frame(frame)`,
        },
      ],
    })
  }
}

const emitSelectWindow = async (windowLocation: string) => {
  if (/^handle=/.test(windowLocation)) {
    return Promise.resolve(
      `await $webDriver.switchTo().window(${
        windowLocation.split('handle=')?.[1]
      })`
    )
  } else if (/^name=/.test(windowLocation)) {
    return Promise.resolve(
      `await $webDriver.switchTo().window(${
        windowLocation.split('name=')?.[1]
      })`
    )
  } else if (/^win_ser_/.test(windowLocation)) {
    if (windowLocation === 'win_ser_local') {
      return Promise.resolve({
        commands: [
          {
            level: 0,
            statement:
              'await $webDriver.switchTo().window(await $webDriver.getWindowHandle()[0])',
          },
        ],
      })
    } else {
      const index = parseInt(windowLocation.substr('win_ser_'.length))
      return Promise.resolve({
        commands: [
          {
            level: 0,
            statement: `await $webDriver.switchTo().window(await $webDriver.getAllWindowHandles()[${index}])`,
          },
        ],
      })
    }
  } else {
    return Promise.reject(
      new Error(`Can only emit "select window" for window handles`)
    )
  }
}

const emitOpen = async (
  target: string,
  _value: unknown,
  context: EmitterContext
) => {
  const url = /^(file|http|https):\/\//.test(target)
    ? target
    : `${context.project.url}${target}`
  return Promise.resolve(`await $webDriver.get("${url}")`)
}

const generateSendKeysInput = (value: string | string[]) => {
  if (typeof value === 'object') {
    return value
      .map((s) => {
        if (s.startsWith('vars[')) {
          return s
        } else if (s.startsWith('Key[')) {
          const key = s.match(/\['(.*)'\]/)?.[1]
          return `Key.${key}`
        } else {
          return `"${s}"`
        }
      })
      .join(', ')
  } else {
    if (value.startsWith('vars[')) {
      return value
    } else {
      return `"${value}"`
    }
  }
}

const emitType = async (target: string, value: string) => {
  return Promise.resolve(
    `await $webDriver.wait(until.elementLocated(${await location.emit(
      target
    )})).sendKeys(${generateSendKeysInput(value)})`
  )
}

const variableLookup = (varName: string) => {
  return `vars["${varName}"]`
}

function emit(command: CommandShape, context: EmitterContext) {
  return exporter.emit.command(command, emitters[command.command], {
    context,
    variableLookup,
    emitNewWindowHandling,
  })
}

const skip = async () => Promise.resolve('')

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
  storeWindowHandle: emitStoreWindowHandle,
  type: emitType,
  webdriverAnswerOnVisiblePrompt: emitAnswerOnNextPrompt,
  webdriverChooseCancelOnVisibleConfirmation:
    emitChooseCancelOnNextConfirmation,
  webdriverChooseOkOnVisibleConfirmation: emitChooseOkOnNextConfirmation,
}

exporter.register.preprocessors(emitters)

function register(command: string, emitter: PrebuildEmitter) {
  exporter.register.emitter({ command, emitter, emitters })
}

export default {
  emit,
  emitters,
  extras: { emitNewWindowHandling, emitWaitForWindow },
  register,
}
