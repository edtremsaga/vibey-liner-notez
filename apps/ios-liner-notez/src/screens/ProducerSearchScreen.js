import React, { useEffect, useRef, useState } from 'react'
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

function mapProducerResultToAlbumResult(result) {
  return {
    id: result.releaseGroupId,
    releaseGroupId: result.releaseGroupId,
    title: result.releaseGroupTitle ?? result.title,
    artistCredit: result.releaseGroupArtistCredit ?? result.artistCredit,
    firstReleaseDate: result.firstReleaseDate,
    releaseYear: result.releaseYear,
    primaryType: result.primaryType,
    secondaryTypes: result.secondaryTypes,
    producerEvidence: result.producerEvidence
  }
}

function ProducerResultCard({ onOpenAlbumDetail, result }) {
  const evidence = result.producerEvidence ?? {}
  const secondaryTypes = formatSecondaryTypes(result.secondaryTypes)
  const attributes = formatAttributes(evidence.relationshipAttributes)

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open album detail for ${result.releaseGroupTitle}`}
      onPress={() => onOpenAlbumDetail(result)}
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
      <Text style={{ color: '#93c5fd', fontWeight: '600', marginTop: 10 }}>Open album detail</Text>
    </TouchableOpacity>
  )
}

function ProducerResultsContext({ producer }) {
  if (!producer) {
    return null
  }

  return (
    <View style={{ marginTop: 8, marginBottom: 4 }}>
      <Text style={{ color: '#e5e7eb', fontWeight: '700', fontSize: 16 }}>Producer: {producer.name}</Text>
      <Text style={{ color: '#9ca3af', marginTop: 4 }}>
        Showing the first albums found from MusicBrainz producer credits.
      </Text>
    </View>
  )
}

export function ProducerSearchScreen({
  onBackToSearch,
  onProducerSearchStateChange,
  onSelectAlbum,
  producerSearchState = {}
}) {
  const [producerName, setProducerName] = useState(producerSearchState.producerName ?? '')
  const [showValidation, setShowValidation] = useState(producerSearchState.showValidation ?? false)
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(producerSearchState.isLoadingCandidates ?? false)
  const [isLoadingProducerResults, setIsLoadingProducerResults] = useState(producerSearchState.isLoadingProducerResults ?? false)
  const [candidateResult, setCandidateResult] = useState(producerSearchState.candidateResult ?? null)
  const [selectedProducer, setSelectedProducer] = useState(producerSearchState.selectedProducer ?? null)
  const [producerResult, setProducerResult] = useState(producerSearchState.producerResult ?? null)
  const [producerResultError, setProducerResultError] = useState(producerSearchState.producerResultError ?? '')
  const [errorMessage, setErrorMessage] = useState(producerSearchState.errorMessage ?? '')
  const producerLookupRequestId = useRef(0)

  const candidates = candidateResult?.candidates ?? []
  const showCandidateSelection = candidateResult?.status === 'select' && candidates.length > 0 && !selectedProducer
  const showNoCandidates = candidateResult?.status === 'none' && !selectedProducer
  const producerResults = producerResult?.results ?? []
  const showNoProducerResults = selectedProducer && producerResult && producerResults.length === 0 && !isLoadingProducerResults

  useEffect(() => {
    onProducerSearchStateChange?.({
      producerName,
      showValidation,
      isLoadingCandidates,
      isLoadingProducerResults,
      candidateResult,
      selectedProducer,
      producerResult,
      producerResultError,
      errorMessage
    })
  }, [
    candidateResult,
    errorMessage,
    isLoadingCandidates,
    isLoadingProducerResults,
    onProducerSearchStateChange,
    producerName,
    producerResult,
    producerResultError,
    selectedProducer,
    showValidation
  ])

  function resetProducerSearchState() {
    producerLookupRequestId.current += 1
    setProducerName('')
    setShowValidation(false)
    setIsLoadingCandidates(false)
    setIsLoadingProducerResults(false)
    setCandidateResult(null)
    setSelectedProducer(null)
    setProducerResult(null)
    setProducerResultError('')
    setErrorMessage('')
  }

  async function loadProducerReleaseLevelResults(candidate) {
    const requestId = producerLookupRequestId.current + 1
    producerLookupRequestId.current = requestId
    setProducerResult(null)
    setProducerResultError('')
    setIsLoadingProducerResults(true)

    try {
      const result = await searchMusicBrainzAlbumsByProducer({
        producerMbid: candidate.id,
        producerName: candidate.name,
        limit: PRODUCER_RELEASE_LOOKUP_LIMIT
      })
      if (producerLookupRequestId.current !== requestId) {
        return
      }
      setProducerResult(result)
    } catch (error) {
      if (producerLookupRequestId.current !== requestId) {
        return
      }
      setProducerResultError(error?.message || 'We could not load producer album results from MusicBrainz.')
    } finally {
      if (producerLookupRequestId.current === requestId) {
        setIsLoadingProducerResults(false)
      }
    }
  }

  async function handleResolveProducerCandidates() {
    const trimmedProducer = producerName.trim()
    const requestId = producerLookupRequestId.current + 1

    if (!trimmedProducer) {
      producerLookupRequestId.current = requestId
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
    producerLookupRequestId.current = requestId

    try {
      const result = await resolveMusicBrainzProducerCandidates(trimmedProducer)
      if (producerLookupRequestId.current !== requestId) {
        return
      }
      setCandidateResult(result)

      if (result.status === 'auto' && result.selectedCandidate) {
        setSelectedProducer(result.selectedCandidate)
        setIsLoadingCandidates(false)
        await loadProducerReleaseLevelResults(result.selectedCandidate)
      }
    } catch (error) {
      if (producerLookupRequestId.current !== requestId) {
        return
      }
      setErrorMessage(error?.message || 'We could not load producer candidates from MusicBrainz.')
    } finally {
      if (producerLookupRequestId.current === requestId) {
        setIsLoadingCandidates(false)
      }
    }
  }

  async function handleSelectCandidate(candidate) {
    setSelectedProducer(candidate)
    setErrorMessage('')
    await loadProducerReleaseLevelResults(candidate)
  }

  function handleOpenAlbumDetail(result) {
    const releaseGroupId = result?.releaseGroupId ?? result?.id ?? null
    if (!releaseGroupId) {
      return
    }

    onSelectAlbum?.(releaseGroupId, mapProducerResultToAlbumResult(result), 'Producer Search')
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
      <View style={{ position: 'relative', marginTop: 8 }}>
        <TextInput
          accessibilityLabel="Producer search input"
          autoCapitalize="words"
          placeholder="e.g. Quincy Jones"
          placeholderTextColor="#9ca3af"
          value={producerName}
          editable={!isLoadingCandidates}
          onChangeText={(value) => {
            producerLookupRequestId.current += 1
            setProducerName(value)
            setIsLoadingCandidates(false)
            setIsLoadingProducerResults(false)
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
            borderWidth: 1,
            borderColor: '#4b5563',
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            paddingRight: 44,
            color: '#f3f4f6',
            width: '100%'
          }}
        />
        {!!producerName && (
          <TouchableOpacity
            accessibilityLabel="Clear producer name"
            accessibilityRole="button"
            onPress={resetProducerSearchState}
            style={{
              position: 'absolute',
              right: 4,
              top: 4,
              bottom: 4,
              width: 34,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 18, fontWeight: '700' }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

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
          <ProducerResultsContext producer={selectedProducer} />
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>
            Checking documented producer credits in MusicBrainz...
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Looking up the first albums found for this producer.
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
          <ProducerResultsContext producer={selectedProducer} />
          <Text style={{ color: '#d1d5db', fontWeight: '600' }}>
            No documented MusicBrainz producer credits found for this artist.
          </Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            MusicBrainz data may be incomplete, so some producer connections may be missing.
          </Text>
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
          <ProducerResultsContext producer={selectedProducer} />
          <Text style={{ color: '#d1d5db', fontWeight: '700' }}>Producer album results</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            Results are based on documented MusicBrainz producer credits.
          </Text>
          {producerResults.map((result) => (
            <ProducerResultCard
              key={result.releaseGroupId}
              onOpenAlbumDetail={handleOpenAlbumDetail}
              result={result}
            />
          ))}
        </View>
      ) : null}
      </View>
    </ScrollView>
  )
}
