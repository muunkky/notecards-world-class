import { useState } from 'react'
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../providers/AuthProvider'
import type { Card } from '../types'

// TDD: Implementation driven by our comprehensive test suite

interface UseCardOperationsResult {
  createCard: (title: string, body?: string) => Promise<Card>
  updateCard: (cardId: string, updates: Partial<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'orderIndex'>>) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  reorderCards: (cardIds: string[]) => Promise<void>
  moveCardUp: (cardId: string, currentCards: Card[]) => Promise<void>
  moveCardDown: (cardId: string, currentCards: Card[]) => Promise<void>
  loading: boolean
  error: string | null
}

export const useCardOperations = (deckId: string): UseCardOperationsResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const createCard = async (title: string, body: string = ''): Promise<Card> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    if (!deckId) {
      throw new Error('Deck ID is required')
    }

    if (!title.trim()) {
      throw new Error('Card title is required')
    }

    setLoading(true)
    setError(null)

    try {
      // Get the current highest order index for this deck
      const cardsRef = collection(db, 'cards')
      const q = query(cardsRef, where('deckId', '==', deckId))
      const existingCards = await getDocs(q)
      const maxOrderIndex = existingCards.docs.reduce((max, doc) => {
        const orderIndex = doc.data().orderIndex || 0
        return Math.max(max, orderIndex)
      }, -1)

      // Create card in Firestore
      const cardData = {
        deckId,
        title: title.trim(),
        body: body.trim(),
        orderIndex: maxOrderIndex + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, 'cards'), cardData)
      
      // Also update the deck's card count and timestamp
      const deckRef = doc(db, 'decks', deckId)
      await updateDoc(deckRef, {
        cardCount: existingCards.docs.length + 1,
        updatedAt: serverTimestamp()
      })
      
      const newCard: Card = {
        id: docRef.id,
        deckId,
        title: title.trim(),
        body: body.trim(),
        orderIndex: maxOrderIndex + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      console.log('Created card in Firestore:', newCard)
      setLoading(false)
      setError(null)
      return newCard
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create card'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }

  const updateCard = async (cardId: string, updates: Partial<Omit<Card, 'id' | 'deckId' | 'createdAt' | 'orderIndex'>>): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    if (!cardId.trim()) {
      throw new Error('Card ID is required')
    }

    setLoading(true)
    setError(null)

    try {
      // Update card in Firestore
      const cardRef = doc(db, 'cards', cardId)
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      }

      await updateDoc(cardRef, updateData)
      
      // Also update the deck's timestamp
      const deckRef = doc(db, 'decks', deckId)
      await updateDoc(deckRef, {
        updatedAt: serverTimestamp()
      })
      
      console.log('Updated card in Firestore:', cardId, 'with', updates)
      
      setLoading(false)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update card'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }

  const deleteCard = async (cardId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    if (!cardId.trim()) {
      throw new Error('Card ID is required')
    }

    setLoading(true)
    setError(null)

    try {
      // Delete card from Firestore
      const cardRef = doc(db, 'cards', cardId)
      await deleteDoc(cardRef)
      
      // Update the deck's card count and timestamp
      const cardsRef = collection(db, 'cards')
      const q = query(cardsRef, where('deckId', '==', deckId))
      const remainingCards = await getDocs(q)
      
      const deckRef = doc(db, 'decks', deckId)
      await updateDoc(deckRef, {
        cardCount: remainingCards.docs.length,
        updatedAt: serverTimestamp()
      })
      
      console.log('Deleted card from Firestore:', cardId)
      
      setLoading(false)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete card'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }

  const reorderCards = async (cardIds: string[]): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    if (!cardIds.length) {
      throw new Error('Card IDs are required')
    }

    setLoading(true)
    setError(null)

    try {
      // Use a batch to update all card order indices atomically
      const batch = writeBatch(db)
      
      cardIds.forEach((cardId, index) => {
        const cardRef = doc(db, 'cards', cardId)
        batch.update(cardRef, {
          orderIndex: index,
          updatedAt: serverTimestamp()
        })
      })
      
      // Also update the deck's timestamp
      const deckRef = doc(db, 'decks', deckId)
      batch.update(deckRef, {
        updatedAt: serverTimestamp()
      })
      
      await batch.commit()
      
      console.log('Reordered cards in Firestore:', cardIds)
      
      setLoading(false)
      setError(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to reorder cards'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }

  const moveCardUp = async (cardId: string, currentCards: Card[]): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const cardIndex = currentCards.findIndex(card => card.id === cardId)
    if (cardIndex <= 0) {
      throw new Error('Card cannot be moved up')
    }

    setLoading(true)
    setError(null)

    try {
      // Create new order by swapping the card with the one above it
      const newCardOrder = [...currentCards]
      const cardToMove = newCardOrder[cardIndex]
      const cardAbove = newCardOrder[cardIndex - 1]
      
      // Swap positions
      newCardOrder[cardIndex - 1] = cardToMove
      newCardOrder[cardIndex] = cardAbove
      
      // Use the existing reorderCards function
      const cardIds = newCardOrder.map(card => card.id)
      await reorderCards(cardIds)
      
      console.log('Moved card up:', cardId)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to move card up'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }

  const moveCardDown = async (cardId: string, currentCards: Card[]): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const cardIndex = currentCards.findIndex(card => card.id === cardId)
    if (cardIndex >= currentCards.length - 1 || cardIndex === -1) {
      throw new Error('Card cannot be moved down')
    }

    setLoading(true)
    setError(null)

    try {
      // Create new order by swapping the card with the one below it
      const newCardOrder = [...currentCards]
      const cardToMove = newCardOrder[cardIndex]
      const cardBelow = newCardOrder[cardIndex + 1]
      
      // Swap positions
      newCardOrder[cardIndex + 1] = cardToMove
      newCardOrder[cardIndex] = cardBelow
      
      // Use the existing reorderCards function
      const cardIds = newCardOrder.map(card => card.id)
      await reorderCards(cardIds)
      
      console.log('Moved card down:', cardId)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to move card down'
      setError(errorMessage)
      setLoading(false)
      throw err
    }
  }

  return {
    createCard,
    updateCard,
    deleteCard,
    reorderCards,
    moveCardUp,
    moveCardDown,
    loading,
    error
  }
}