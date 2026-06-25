import fs from 'fs/promises'
import path from 'path'
import {
  parseTlToEntries,
  parseFullTlSchema,
  generateReaderCodeForTlEntries,
  TL_PRIMITIVES,
} from '@mtcute/tl-utils'

const TYPES_TO_ADD = [
  'messages.messages',
  'messages.messagesSlice',
  'messages.channelMessages',

  'message',
  'messageService',
  'messageEmpty',
]
const schemaPath = path.resolve('generator/schemas')
const tlPath = path.resolve('src/tl')
await fs.mkdir(tlPath, { recursive: true })

const apiSchema = await fs.readFile(path.join(schemaPath, 'api.tl'), 'utf8').then(parseTlToEntries)

const schema = await parseFullTlSchema(apiSchema)

const unpackedSchema = {
  unions: {},
  classes: {},
}
for (const name in schema) {
  if (!unpackedSchema.unions[name]) continue
  unpackedSchema.unions[name].comment = schema.u[name]
}

const typesToAdd = new Set()

const processedTypes = new Set()
const queue = [...TYPES_TO_ADD]

while (queue.length) {
  const it = queue.pop()
  const entry = schema.classes[it]

  if (!processedTypes.has(it)) {
    typesToAdd.add(it)
  }

  processedTypes.add(it)

  for (const arg of entry.arguments) {
    const type = arg.type
    if (type in TL_PRIMITIVES || type === '#') continue

    const typeEntry = schema.unions[type]

    for (const { name } of typeEntry.classes) {
      if (!processedTypes.has(name)) {
        queue.push(name)
      }
    }
  }
}

const entries = []

for (const type of typesToAdd) {
  const entry = schema.classes[type]
  entries.push(entry)
}

console.log(`Parsed ${entries.length} entries in total`)
let readerCode = generateReaderCodeForTlEntries(entries, {
  includeFlags: true,
})
await fs.writeFile(
  path.join(tlPath, 'compactSchema.js'),
  readerCode.replace('var m=', 'export const m='),
  { flag: 'w' },
  'utf8',
)
