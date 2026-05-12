import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { mockAlbumFixture } from '../src/fixtures/mockAlbumFixture.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemaPath = path.resolve(__dirname, '../schema/album.v1.json')
const schema = JSON.parse(await readFile(schemaPath, 'utf8'))

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)
const valid = validate(mockAlbumFixture)

assert.equal(valid, true, `Schema validation failed: ${JSON.stringify(validate.errors, null, 2)}`)
console.log('PASS album.v1.json contract validates sample album payload')
