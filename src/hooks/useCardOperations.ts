import { useState } from 'react'
import { Card } from '../types'
import { moveCardInDeck, createCardInDeck, updateCardInDeck, deleteCardFromDeck } from '../firebase/firestore'

export interface UseCardOperationsResult {
  createCard: (deckId: string, title: string, content: string) => Promise<void>
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>
  deleteCard: (cardId: string, deckId: string) => Promise<void>
  moveCardUp: (cardId: string, cards: Card[]) => Promise<void>
  moveCardDown: (cardId: string, cards: Card[]) => Promise<void>
  loading: boolean
  error: string | null
}

export function useCardOperations(): UseCardOperationsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCard = async (deckId: string, title: string, content: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await createCardInDeck(deckId, title, content)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create card'
      setError(errorMessage)
      console.error('Failed to create card:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCard = async (cardId: string, updates: Partial<Card>): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await updateCardInDeck(cardId, updates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update card'
      setError(errorMessage)
      console.error('Failed to update card:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCard = async (cardId: string, deckId: string): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      await deleteCardFromDeck(cardId, deckId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete card'
      setError(errorMessage)
      console.error('Failed to delete card:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const moveCardUp = async (cardId: string, cards: Card[]): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      console.log('Successfully moved card up:', cardId)
      await moveCardInDeck(cardId, cards, 'up')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move card up'
      setError(errorMessage)
      console.error('Failed to move card up:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const moveCardDown = async (cardId: string, cards: Card[]): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      console.log('Successfully moved card down:', cardId)
      await moveCardInDeck(cardId, cards, 'down')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move card down'
      setError(errorMessage)
      console.error('Failed to move card down:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createCard,
    updateCard,
    deleteCard,
    moveCardUp,
    moveCardDown,
    loading,
    error
  }
}