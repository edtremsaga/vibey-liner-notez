import React, { useState } from 'react'
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import {
  resolveMusicBrainzProducerCandidates,
  searchMusicBrainzAlbumsByProducer
} from '../services/musicbrainzProducerSearch'

const PRODUCER_RELEASE_LOOKUP_LIMIT = 10

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

function formatSecondaryTypes(secondaryTypes) {
  return Array.isArray(secondaryTypes) && secondaryTypes.length > 0 ? secondaryTypes.join(', ') : null
}

function formatAttributes(attributes) {
  const entries = Object.entries(attributes ?? {})
  if (entries.length === 0) {
    return null
  }

  return entries.map(([key, value]) => value === true ? key : `${key}: ${value}`).join(', ')
}

function ProducerResultCard({ result }) {
  const evidence = result.producerEvidence ?? {}
  const secondaryTypes = formatSecondaryTypes(result.secondaryTypes)
  const attributes = formatAttributes(evidence.relationshipAttributes)

  return (
    <View
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
      <Text style={{ color: '#e5e7eb', fontWeight: '700', fontSize: 16 }}>{result.releaseGroupTitle}</Text>
      <Text style={{ color: '#9ca3af', marginTop: 2 }}>
        {result.releaseGroupArtistCredit}{result.firstReleaseDate ? ` · ${result.firstReleaseDate}` : ''}
      </Text>
      {(result.primaryType || secondaryTypes) ? (
        <Text style={{ color: '#9ca3af', marginTop: 3, fontSize: 12 }}>
          {[result.primaryType, secondaryTypes].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      <Text style={{ color: '#a7f3d0', marginTop: 6, fontSize: 13 }}>
        {evidence.evidenceLabel}
      </Text>
      {attributes ? (
        <Text style={{ color: '#9ca3af', marginTop: 3, fontSize: 12 }}>
          Relationship attributes: {attributes}
        </Text>
      ) : null}
      <Text style={{ color: '#6b7280', marginTop: 5, fontSize: 11 }}>
        Source release MBID: {evidence.sourceReleaseId}
      </Text>
    </View>
  )
}

function ProducerResultsSummary({ producerResult }) {
  const metrics = producerResult?.metrics
  if (!metrics) {
    return null
  }

  return (
    <Text style={{ color: '#9ca3af', marginTop: 8, fontSize: 12 }}>
      Checked {metrics.releaseLookupsAttempted} documented release-level producer credits. {metrics.duplicateReleaseGroupsSkipped} duplicate release groups skipped.
    </Text>
  )
}

function SelectedProducerContext({ producer }) {
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
        Album results use documented MusicBrainz release-level producer credits.
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
  const [isLoadingProducerResults, setIsLoadingProducerResults] = useState(false)
  const [candidateResult, setCandidateResult] = useState(null)
  const [selectedProducer, setSelectedProducer] = useState(null)
  const [producerResult, setProducerResult] = useState(null)
  const [producerResultError, setProducerResultError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const candidates = candidateResult?.candidates ?? []
  const showCandidateSelection = candidateResult?.status === 'select' && candidates.length > 0 && !selectedProducer
  const showNoCandidates = candidateResult?.status === 'none' && !selectedProducer
  const producerResults = producerResult?.results ?? []
  const showNoProducerResults = selectedProducer && producerResult && producerResults.length === 0 && !isLoadingProducerResults

  async function loadProducerReleaseLevelResults(candidate) {
    setProducerResult(null)
    setProducerResultError('')
    setIsLoadingProducerResults(true)

    try {
      const result = await searchMusicBrainzAlbumsByProducer({
        producerMbid: candidate.id,
        producerName: candidate.name,
        limit: PRODUCER_RELEASE_LOOKUP_LIMIT
      })
      setProducerResult(result)
    } catch (error) {
      setProducerResultError(error?.message || 'We could not load producer album results from MusicBrainz.')
    } finally {
      setIsLoadingProducerResults(false)
    }
  }

  async function handleResolveProducerCandidates() {
    const trimmedProducer = producerName.trim()

    if (!trimmedProducer) {
      setShowValidation(true)
      setCandidateResult(null)
      setSelectedProducer(null)
      setProducerResult(null)
      setProducerResultError('')
      setErrorMessage('')
      return
    }

    setShowValidation(false)
    setCandidateResult(null)
    setSelectedProducer(null)
    setProducerResult(null)
    setProducerResultError('')
    setErrorMessage('')
    setIsLoadingCandidates(true)

    try {
      const result = await resolveMusicBrainzProducerCandidates(trimmedProducer)
      setCandidateResult(result)

      if (result.status === 'auto' && result.selectedCandidate) {
        setSelectedProducer(result.selectedCandidate)
        setIsLoadingCandidates(false)
        await loadProducerReleaseLevelResults(result.selectedCandidate)
      }
    } catch (error) {
      setErrorMessage(error?.message || 'We could not load producer candidates from MusicBrainz.')
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  async function handleSelectCandidate(candidate) {
    setSelectedProducer(candidate)
    setErrorMessage('')
    await loadProducerReleaseLevelResults(candidate)
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
          setProducerResult(null)
          setProducerResultError('')
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
        <SelectedProducerContext producer={selectedProducer} />
      ) : null}

      {isLoadingProducerResults ? (
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
            Checking documented release-level producer credits in MusicBrainz...
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Looking up the first {PRODUCER_RELEASE_LOOKUP_LIMIT} documented release credits for this producer.
          </Text>
        </View>
      ) : null}

      {producerResultError ? (
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
          <Text style={{ color: '#fecaca', fontWeight: '600' }}>Producer result lookup error</Text>
          <Text style={{ color: '#fca5a5', marginTop: 4 }}>{producerResultError}</Text>
        </View>
      ) : null}

      {showNoProducerResults ? (
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
            No documented release-level producer credits found for this MusicBrainz artist.
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            MusicBrainz data may be incomplete, and track-level producer credits are not searched yet.
          </Text>
          <ProducerResultsSummary producerResult={producerResult} />
        </View>
      ) : null}

      {producerResults.length > 0 ? (
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
          <Text style={{ color: '#d1d5db', fontWeight: '700' }}>Producer album results</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Bounded results from documented MusicBrainz release-level producer credits.
          </Text>
          <ProducerResultsSummary producerResult={producerResult} />
          {producerResults.map((result) => (
            <ProducerResultCard key={result.releaseGroupId} result={result} />
          ))}
        </View>
      ) : null}
      </View>
    </ScrollView>
  )
}
