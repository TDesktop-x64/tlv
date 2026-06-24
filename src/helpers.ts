import { base64 } from '@fuman/utils'
import { TlBinaryReader } from '@mtcute/tl-runtime'
import { m } from './tl/compactSchema'
import { useClipboard } from '@vueuse/core'

export interface deserializedObject {
  _: string
  messages: Array<unknown>
}

export async function deserializeObject(object: string): Promise<deserializedObject> {
  return TlBinaryReader.deserializeObject(m, base64.decode(object, true))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toJSON(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj

  if (obj instanceof BigInt) {
    return obj
  }

  if (obj instanceof Uint8Array) {
    return base64.encode(obj)
  }

  if (typeof obj.toJSON === 'function') {
    return toJSON(obj.toJSON())
  }

  if (Array.isArray(obj)) {
    return obj.map(toJSON)
  }

  const newObj: { [key: string]: object | string | number | bigint } = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const v = obj[key]
      if (v != undefined) {
        newObj[camelToSnake(key)] = toJSON(v)
      }
    }
  }

  return newObj
}

function camelToSnake(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

declare global {
  interface JSON {
    rawJSON: (value: string) => string
  }
}

function toFormattedJSON(object: object | null): string {
  return object
    ? JSON.stringify(
        object,
        (_key, value) => {
          if (typeof value === 'bigint') {
            return JSON.rawJSON(value.toString())
          }
          return value
        },
        2,
      )
    : ''
}

export function copyParsedJSON(object: object | null) {
  const json = toFormattedJSON(object)
  useClipboard({ legacy: true })
    .copy(json)
    .catch((error) => {
      console.log(`copy error: ${error}`)
    })
}
