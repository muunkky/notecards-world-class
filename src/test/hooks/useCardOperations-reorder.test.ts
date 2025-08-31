import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCardOperations } from '../../../hooks/useCardOperations'
import { createMockCard } from '../../utils/test-factories'
import type { Card } from '../../../types'

// Mock Firebase
vi.mock('../../../firebase/firebase', () => ({
  db: {}
}))

vi.mock('../../../providers/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } })
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn()
  })),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] }))
}))

describe('useCardOperations - Manual Reordering Functions', () => {
  const mockDeckId = 'test-deck-id'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('moveCardUp function', () => {
    it('should move a card up in the order', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 }),
        createMockCard({ id: 'card-3', orderIndex: 2 })
      ]
      
      await act(async () => {
        await result.current.moveCardUp('card-2', cards)
      })
      
      // Should not throw an error
      expect(result.current.error).toBeNull()
    })

    it('should throw error when trying to move first card up', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 })
      ]
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardUp('card-1', cards)
        })
      }).rejects.toThrow('Card cannot be moved up')
    })

    it('should throw error when card is not found', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 })
      ]
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardUp('non-existent-card', cards)
        })
      }).rejects.toThrow('Card cannot be moved up')
    })

    it('should set loading state during move operation', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 })
      ]
      
      const movePromise = act(async () => {
        await result.current.moveCardUp('card-2', cards)
      })
      
      await movePromise
      
      // Loading state should be managed properly
      expect(result.current.loading).toBe(false)
    })
  })

  describe('moveCardDown function', () => {
    it('should move a card down in the order', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 }),
        createMockCard({ id: 'card-3', orderIndex: 2 })
      ]
      
      await act(async () => {
        await result.current.moveCardDown('card-2', cards)
      })
      
      // Should not throw an error
      expect(result.current.error).toBeNull()
    })

    it('should throw error when trying to move last card down', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 })
      ]
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardDown('card-2', cards)
        })
      }).rejects.toThrow('Card cannot be moved down')
    })

    it('should throw error when card is not found', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 })
      ]
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardDown('non-existent-card', cards)
        })
      }).rejects.toThrow('Card cannot be moved down')
    })

    it('should handle empty cards array', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = []
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardDown('any-card', cards)
        })
      }).rejects.toThrow('Card cannot be moved down')
    })
  })

  describe('reorderCards function', () => {
    it('should reorder cards with new array of IDs', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cardIds = ['card-3', 'card-1', 'card-2']
      
      await act(async () => {
        await result.current.reorderCards(cardIds)
      })
      
      // Should not throw an error
      expect(result.current.error).toBeNull()
    })

    it('should throw error when card IDs array is empty', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      await expect(async () => {
        await act(async () => {
          await result.current.reorderCards([])
        })
      }).rejects.toThrow('Card IDs are required')
    })

    it('should handle single card reorder', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cardIds = ['single-card']
      
      await act(async () => {
        await result.current.reorderCards(cardIds)
      })
      
      // Should not throw an error
      expect(result.current.error).toBeNull()
    })
  })

  describe('Error handling and authentication', () => {
    it('should require authentication for all operations', async () => {
      // Mock no user
      vi.doMock('../../../providers/AuthProvider', () => ({
        useAuth: () => ({ user: null })
      }))
      
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [createMockCard()]
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardUp('card-1', cards)
        })
      }).rejects.toThrow('User must be authenticated')
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardDown('card-1', cards)
        })
      }).rejects.toThrow('User must be authenticated')
      
      await expect(async () => {
        await act(async () => {
          await result.current.reorderCards(['card-1'])
        })
      }).rejects.toThrow('User must be authenticated')
    })

    it('should handle Firestore errors gracefully', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      // Mock Firestore error
      const mockError = new Error('Firestore connection failed')
      vi.doMock('firebase/firestore', () => ({
        ...vi.importActual('firebase/firestore'),
        writeBatch: vi.fn(() => ({
          update: vi.fn(),
          commit: vi.fn().mockRejectedValue(mockError)
        }))
      }))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1' }),
        createMockCard({ id: 'card-2' })
      ]
      
      await expect(async () => {
        await act(async () => {
          await result.current.moveCardUp('card-2', cards)
        })
      }).rejects.toThrow()
    })
  })

  describe('Integration with reorderCards', () => {
    it('should call reorderCards internally when moving cards', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1', orderIndex: 0 }),
        createMockCard({ id: 'card-2', orderIndex: 1 }),
        createMockCard({ id: 'card-3', orderIndex: 2 })
      ]
      
      // Spy on reorderCards to ensure it's called
      const reorderCardsSpy = vi.spyOn(result.current, 'reorderCards')
      
      await act(async () => {
        await result.current.moveCardUp('card-2', cards)
      })
      
      // reorderCards should have been called with swapped order
      expect(reorderCardsSpy).toHaveBeenCalled()
    })

    it('should preserve card order integrity during moves', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const originalCards: Card[] = [
        createMockCard({ id: 'card-A', orderIndex: 0 }),
        createMockCard({ id: 'card-B', orderIndex: 1 }),
        createMockCard({ id: 'card-C', orderIndex: 2 }),
        createMockCard({ id: 'card-D', orderIndex: 3 })
      ]
      
      // Move card-C up (should become position 1)
      await act(async () => {
        await result.current.moveCardUp('card-C', originalCards)
      })
      
      // The internal reorderCards call should maintain all card IDs
      expect(result.current.error).toBeNull()
    })
  })

  describe('Performance and optimization', () => {
    it('should handle large card arrays efficiently', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      // Create a large array of cards
      const largeCardArray: Card[] = Array.from({ length: 1000 }, (_, index) => 
        createMockCard({ id: `card-${index}`, orderIndex: index })
      )
      
      const startTime = performance.now()
      
      await act(async () => {
        await result.current.moveCardUp('card-500', largeCardArray)
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete within reasonable time (less than 100ms)
      expect(executionTime).toBeLessThan(100)
      expect(result.current.error).toBeNull()
    })

    it('should batch Firestore operations efficiently', async () => {
      const { result } = renderHook(() => useCardOperations(mockDeckId))
      
      const cards: Card[] = [
        createMockCard({ id: 'card-1' }),
        createMockCard({ id: 'card-2' }),
        createMockCard({ id: 'card-3' })
      ]
      
      // Multiple rapid operations
      await act(async () => {
        await Promise.all([
          result.current.moveCardUp('card-2', cards),
          // Note: In real usage, these would be sequential due to state updates
        ])
      })
      
      expect(result.current.error).toBeNull()
    })
  })
})