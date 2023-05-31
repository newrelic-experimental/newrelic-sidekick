import { codeExport as exporter } from 'side-code-export'

const emitId = (id: string) => {
  return Promise.resolve(`By.css("*[id='${id}']")`)
}

const emitValue = (value: string) => {
  return Promise.resolve(`By.css("*[value='${value}']")`)
}

const emitLabel = (label: string) => {
  return Promise.resolve(`By.xpath("//option[. = '${label}']")`)
}

const emitIndex = (index: string) => {
  return Promise.resolve(`By.css("*:nth-child(${index})")`)
}

const emitters = {
  id: emitId,
  value: emitValue,
  label: emitLabel,
  index: emitIndex,
}

export function emit(location: string) {
  return exporter.emit.selection(location, emitters)
}

export default {
  emit,
}
