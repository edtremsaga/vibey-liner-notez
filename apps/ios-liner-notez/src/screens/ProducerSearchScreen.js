import React, { useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { resolveMusicBrainzProducerCandidates } from '../services/musicbrainzProducerSearch'

function formatLifeSpan(lifeSpan) {
  if (!lifeSpan?.begin && !lifeSpan?.end) {
    return null
  }

  return `${lifeSpan.begin ?? '?'}-${lifeSpan.end ?? ''}`
}

function formatCandidateDetails(candidate) {
  return [
    candidate.type,
    candidate.disambiguation,
    candidate.country,
    formatLifeSpan(candidate.lifeSpan)
  ].filter(Boolean).join(' · ')
}

function formatAliases(candidate) {
  const aliases = Array.isArray(candidate?.aliases) ? candidate.aliases.map((alias) => alias.name).filter(Boolean) : []
  return aliases.length > 0 ? aliases.join(', ') : null
}

function ProducerCandidateCard({ candidate, onSelectCandidate }) {
  const details = formatCandidateDetails(candidate)
  const aliases = formatAliases(candidate)

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Select producer candidate ${candidate.name}`}
      onPress={() => onSelectCandidate(candidate)}
      style={{
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#111827'
      }}
    >
      <Text style={{ color: '#e5e7eb', fontWeight: '600', fontSize: 16 }}>{candidate.name}</Text>
      {details ? (
        <Text style={{ color: '#9ca3af', marginTop: 3 }}>{details}</Text>
      ) : null}
      {aliases ? (
        <Text style={{ color: '#9ca3af', marginTop: 3, fontSize: 12 }}>Aliases: {aliases}</Text>
      ) : null}
      <Text style={{ color: '#6ee7b7', marginTop: 5, fontSize: 12 }}>
        MusicBrainz score: {candidate.score}
      </Text>
    </TouchableOpacity>
  )
}

function SelectedProducerPlaceholder({ producer }) {
  return (
    <View
      style={{
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#256d4f',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#10231d'
      }}
    >
      <Text style={{ color: '#d1fae5', fontWeight: '700' }}>Selected producer: {producer.name}</Text>
      <Text style={{ color: '#a7f3d0', marginTop: 6 }}>
        Album results will use documented MusicBrainz release-level producer credits. This step comes next.
      </Text>
      <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 12 }}>
        MusicBrainz artist MBID: {producer.id}
      </Text>
    </View>
  )
}

export function ProducerSearchScreen({ onBackToSearch }) {
  const [producerName, setProducerName] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [candidateResult, setCandidateResult] = useState(null)
  const [selectedProducer, setSelectedProducer] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const candidates = candidateResult?.candidates ?? []
  const showCandidateSelection = candidateResult?.status === 'select' && candidates.length > 0 && !selectedProducer
  const showNoCandidates = candidateResult?.status === 'none' && !selectedProducer

  async function handleResolveProducerCandidates() {
    const trimmedProducer = producerName.trim()

    if (!trimmedProducer) {
      setShowValidation(true)
      setCandidateResult(null)
      setSelectedProducer(null)
      setErrorMessage('')
      return
    }

    setShowValidation(false)
    setCandidateResult(null)
    setSelectedProducer(null)
    setErrorMessage('')
    setIsLoadingCandidates(true)

    try {
      const result = await resolveMusicBrainzProducerCandidates(trimmedProducer)
      setCandidateResult(result)

      if (result.status === 'auto' && result.selectedCandidate) {
        setSelectedProducer(result.selectedCandidate)
      }
    } catch (error) {
      setErrorMessage(error?.message || 'We could not load producer candidates from MusicBrainz.')
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  function handleSelectCandidate(candidate) {
    setSelectedProducer(candidate)
    setErrorMessage('')
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator
    >
      <View>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onBackToSearch}
        style={{
          borderWidth: 1,
          borderColor: '#4b5563',
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 10,
          alignSelf: 'flex-start',
          marginBottom: 14
        }}
      >
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>Back to Search</Text>
      </TouchableOpacity>

      <Text style={{ color: '#e5e7eb', fontSize: 20 }}>Producer Search</Text>
      <Text style={{ color: '#9ca3af', marginTop: 8 }}>
        Find albums with producer credits documented in MusicBrainz.
      </Text>

      <Text style={{ color: '#d1d5db', marginTop: 12 }}>Producer</Text>
      <TextInput
        accessibilityLabel="Producer search input"
        placeholder="e.g. Quincy Jones"
        placeholderTextColor="#9ca3af"
        value={producerName}
        editable={!isLoadingCandidates}
        onChangeText={(value) => {
          setProducerName(value)
          setCandidateResult(null)
          setSelectedProducer(null)
          setErrorMessage('')
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
        onPress={handleResolveProducerCandidates}
        disabled={isLoadingCandidates}
        style={{
          marginTop: 12,
          borderWidth: 1,
          borderColor: isLoadingCandidates ? '#374151' : '#4b5563',
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          alignSelf: 'flex-start',
          opacity: isLoadingCandidates ? 0.7 : 1
        }}
      >
        <Text style={{ color: '#f3f4f6', fontWeight: '600' }}>
          {isLoadingCandidates ? 'Checking MusicBrainz...' : 'Find Producer'}
        </Text>
      </TouchableOpacity>

      {isLoadingCandidates ? (
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
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Loading producer candidates...</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Searching MusicBrainz artist records.
          </Text>
        </View>
      ) : null}

      {errorMessage ? (
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
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Producer lookup error</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>{errorMessage}</Text>
        </View>
      ) : null}

      {showNoCandidates ? (
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
            No producer candidates found
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Try another spelling or a fuller producer name.
          </Text>
        </View>
      ) : null}

      {showCandidateSelection ? (
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
          <Text style={{ color: '#d1d5db', fontWeight: '700' }}>Choose the MusicBrainz artist you mean.</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Album results come next.
          </Text>
          {candidates.map((candidate) => (
            <ProducerCandidateCard
              candidate={candidate}
              key={candidate.id}
              onSelectCandidate={handleSelectCandidate}
            />
          ))}
        </View>
      ) : null}

      {selectedProducer ? (
        <SelectedProducerPlaceholder producer={selectedProducer} />
      ) : null}
      </View>
    </ScrollView>
  )
}
