// Runtime schema validation for album data
// Validates hardcoded album object against album.v1.json schema on app startup

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import albumSchema from '../../album.v1.json'
import { album } from '../data/album.js'
import { debugLog, debugWarn } from './debug'

// Configure AJV for draft-2020-12 schema
const ajv = new Ajv({ 
  allErrors: true, 
  strict: false,
  validateSchema: false // Disable schema validation to avoid meta-schema issues
})
addFormats(ajv)

// Remove $schema field that causes issues with AJV
const schemaToValidate = { ...albumSchema }
delete schemaToValidate.$schema

const validate = ajv.compile(schemaToValidate)

export function validateAlbumData() {
  try {
    debugLog('Validating album data...')
    debugLog('Album object:', album)
    debugLog('Schema loaded:', !!albumSchema)
    
    const valid = validate(album)
    
    if (!valid) {
      console.error('❌ Album data validation failed!')
      console.error('Validation errors:')
      validate.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error.instancePath || 'root'}: ${error.message}`)
        if (error.params) {
          console.error(`     Additional info:`, error.params)
        }
      })
      // Don't throw - just log for now
      debugWarn('⚠️ Validation failed but continuing...')
      return false
    }
    
    debugLog('✅ Album data validated successfully against album.v1.json schema')
    return true
  } catch (error) {
    console.error('Validation error:', error)
    console.error('Error stack:', error.stack)
    // Don't throw - just log
    debugWarn('⚠️ Validation error occurred but continuing...')
    return false
  }
}

