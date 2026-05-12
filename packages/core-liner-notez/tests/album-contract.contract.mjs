import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemaPath = path.resolve(__dirname, '../schema/album.v1.json')
const schema = JSON.parse(await readFile(schemaPath, 'utf8'))

const sampleAlbum = {
  albumId: '8b6b2628-7bd4-3fed-9d65-cf4e5dc45939',
  title: "Life's Rich Pageant",
  artistName: 'R.E.M.',
  releaseYear: 1986,
  albumType: 'album',
  coverArtUrl: null,
  editions: [
    {
      editionId: 'c70cf4dc-8f6d-4f91-bf62-25d1fc6df4d2',
      status: 'Official',
      country: 'US',
      date: '1986-07-28',
      label: 'I.R.S. Records',
      catalogNumber: null,
      barcode: null,
      formatSummary: 'Vinyl',
      packaging: null
    }
  ],
  tracks: [
    {
      trackId: 'f2f184f2-6f6f-4fca-a8a6-1a67ec2ce944',
      position: '1',
      title: 'Begin the Begin',
      durationMs: 192000,
      songwriting: null,
      publishing: null
    }
  ],
  credits: {
    albumCredits: [
      {
        personName: 'Don Gehman',
        role: 'producer',
        instrument: null,
        notes: null
      }
    ],
    trackCredits: {
      'f2f184f2-6f6f-4fca-a8a6-1a67ec2ce944': [
        {
          personName: 'R.E.M.',
          role: 'performer',
          instrument: null,
          notes: null
        }
      ]
    }
  },
  recordingInfo: null,
  externalLinks: {
    musicbrainzReleaseGroupUrl: 'https://musicbrainz.org/release-group/8b6b2628-7bd4-3fed-9d65-cf4e5dc45939',
    musicbrainzSelectedReleaseUrl: 'https://musicbrainz.org/release/c70cf4dc-8f6d-4f91-bf62-25d1fc6df4d2',
    wikidataUrl: null,
    discogsUrl: null
  },
  sources: [
    {
      sourceName: 'MusicBrainz',
      license: 'CC0',
      retrievedAt: '2026-05-12T00:00:00.000Z'
    }
  ],
  dataNotes: null
}

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)
const valid = validate(sampleAlbum)

assert.equal(valid, true, `Schema validation failed: ${JSON.stringify(validate.errors, null, 2)}`)
console.log('PASS album.v1.json contract validates sample album payload')
