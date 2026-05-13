import React, { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'

const MOCK_PRODUCER_RESULTS = [
  { title: "Life's Rich Pageant", artist: 'R.E.M.', year: '1986', label: 'Producer match' },
  { title: 'Document', artist: 'R.E.M.', year: '1987', label: 'Producer match' },
  { title: 'Automatic for the People', artist: 'R.E.M.', year: '1992', label: 'Producer match' }
]

export function ProducerSearchScreen() {
  const [producerName, setProducerName] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [mockState, setMockState] = useState('results')

  const showLoading = mockState === 'loading'
  const showResults = mockState === 'results'
  const showEmpty = mockState === 'empty'
  const showError = mockState === 'error'

  function handleSearchMockProducers() {
    if (!producerName.trim()) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setMockState('results')
  }

  return (
    <View>
      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Producer Search</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Mock-only producer search shell (no API calls).
      </Text>

      <Text style={{ color: '#d1d5db', marginTop: 12 }}>Producer (mock)</Text>
      <TextInput
        accessibilityLabel="Producer search input"
        placeholder="e.g. Butch Vig"
        placeholderTextColor="#9ca3af"
        value={producerName}
        onChangeText={(value) => {
          setProducerName(value)
          if (showValidation && value.trim()) {
            setShowValidation(false)
          }
        }}
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: '#4b5563',
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          color: '#f3f4f6'
        }}
      />

      {showValidation ? (
        <Text style={{ color: '#fca5a5', marginTop: 8 }}>
          Please enter a producer name to continue.
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={handleSearchMockProducers}
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: '#4b5563',
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignSelf: 'flex-start'
        }}
      >
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Search Mock Producers</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('loading')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'loading' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Loading</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('results')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'results' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('empty')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'empty' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Empty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setMockState('error')}
          style={{
            borderWidth: 1,
            borderColor: mockState === 'error' ? '#f3f4f6' : '#4b5563',
            borderRadius: 8,
            paddingVertical: 8,
            paddingHorizontal: 10
          }}
        >
          <Text style={{ color: '#f3f4f6', fontSize: 12 }}>Error</Text>
        </TouchableOpacity>
      </View>

      {showLoading ? (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading mock producer results...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Simulating producer lookup in the scaffold.
          </Text>
        </View>
      ) : null}

      {showError ? (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#7f1d1d',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#2a1215'
          }}
        >
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Mock producer error state</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>
            We could not load producer results. Please try again.
          </Text>
        </View>
      ) : null}

      {showEmpty ? (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>
            No producer results found (mock empty state)
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Try another producer name.
          </Text>
        </View>
      ) : null}

      {showResults ? (
        <View
          style={{
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#374151',
            borderRadius: 10,
            padding: 12,
            backgroundColor: '#181a1f'
          }}
        >
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Mock producer results</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Producer shell only. Real producer traversal is not implemented yet.
          </Text>
          {MOCK_PRODUCER_RESULTS.map((result) => (
            <View
              key={`${result.title}-${result.year}`}
              style={{
                marginTop: 10,
                borderWidth: 1,
                borderColor: '#374151',
                borderRadius: 8,
                padding: 10,
                backgroundColor: '#111827'
              }}
            >
              <Text style={{ color: '#e5e7eb', fontWeight: '600' }}>{result.title}</Text>
              <Text style={{ color: '#9ca3af', marginTop: 2 }}>
                {result.artist} · {result.year}
              </Text>
              <Text style={{ color: '#86efac', marginTop: 4, fontSize: 12 }}>{result.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
