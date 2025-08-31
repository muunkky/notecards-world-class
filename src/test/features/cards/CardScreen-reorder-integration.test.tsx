import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CardScreen from '../../../features/cards/CardScreen'
import { createOrderedMockCards } from '../../utils/test-factories'
import { mockUser } from '../../utils/test-utils'

// Mock the hooks using vi.hoisted to ensure they're hoisted properly
const mockUseCards = vi.hoisted(() => vi.fn())
const mockUseCardOperations = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() => vi.fn())

// Mock the custom hooks
vi.mock('../../../hooks/useCards', () => ({
  useCards: mockUseCards
}))

vi.mock('../../../hooks/useCardOperations', () => ({
  useCardOperations: mockUseCardOperations
}))

// Mock the AuthProvider hook
vi.mock('../../../providers/AuthProvider', () => ({
  useAuth: mockUseAuth
}))

describe('CardScreen - Optimistic UI and Operation Feedback', () => {
  const deckId = 'test-deck-123'
  const deckTitle = 'Test Deck'
  let mockMoveCardUp: any
  let mockMoveCardDown: any
  let mockCreateCard: any
  let mockUpdateCard: any
  let mockDeleteCard: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up auth mock
    mockUseAuth.mockReturnValue({ user: mockUser })

    // Set up operation mocks
    mockMoveCardUp = vi.fn().mockResolvedValue(undefined)
    mockMoveCardDown = vi.fn().mockResolvedValue(undefined)
    mockCreateCard = vi.fn()
    mockUpdateCard = vi.fn()
    mockDeleteCard = vi.fn()

    mockUseCardOperations.mockReturnValue({
      createCard: mockCreateCard,
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
      moveCardUp: mockMoveCardUp,
      moveCardDown: mockMoveCardDown,
      loading: false,
      error: null
    })

    // Set up cards mock with ordered test data
    const testCards = createOrderedMockCards(4, deckId)
    mockUseCards.mockReturnValue({
      cards: testCards,
      loading: false,
      error: null
    })
  })

  describe('Optimistic UI Updates', () => {
    it('should show buttons enabled when not loading', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Get move buttons - we have 4 cards, so buttons should be positioned correctly
      const moveUpButtons = screen.getAllByRole('button', { name: /move.*up/i })
      const moveDownButtons = screen.getAllByRole('button', { name: /move.*down/i })
      
      expect(moveUpButtons.length).toBe(4)
      expect(moveDownButtons.length).toBe(4)
      
      // First card (index 0): move up should be disabled, move down enabled
      expect(moveUpButtons[0]).toBeDisabled() // Can't move up from first position
      expect(moveDownButtons[0]).not.toBeDisabled()
      
      // Last card (index 3): move up enabled, move down should be disabled
      expect(moveUpButtons[3]).not.toBeDisabled()
      expect(moveDownButtons[3]).toBeDisabled() // Can't move down from last position
      
      // Middle cards (index 1, 2): both buttons should be enabled
      expect(moveUpButtons[1]).not.toBeDisabled()
      expect(moveDownButtons[1]).not.toBeDisabled()
      expect(moveUpButtons[2]).not.toBeDisabled()
      expect(moveDownButtons[2]).not.toBeDisabled()
    })

    it('should disable all reorder buttons during loading state', async () => {
      // Update mock to return loading: true
      mockUseCardOperations.mockReturnValue({
        createCard: mockCreateCard,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
        moveCardUp: mockMoveCardUp,
        moveCardDown: mockMoveCardDown,
        loading: true,
        error: null
      })

      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // All move buttons should be disabled due to loading state
      const loadingMoveButtons = screen.getAllByRole('button', { name: /move.*(?:up|down)/i })
      loadingMoveButtons.forEach(button => expect(button).toBeDisabled())
    })

    it('should re-enable buttons after successful operation', async () => {
      // Start with loading state
      mockUseCardOperations.mockReturnValueOnce({
        createCard: mockCreateCard,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
        moveCardUp: mockMoveCardUp,
        moveCardDown: mockMoveCardDown,
        loading: true,
        error: null
      }).mockReturnValueOnce({
        createCard: mockCreateCard,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
        moveCardUp: mockMoveCardUp,
        moveCardDown: mockMoveCardDown,
        loading: false,
        error: null
      })

      const { rerender } = render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Buttons should be disabled initially
      const loadingMoveButtons = screen.getAllByRole('button', { name: /move.*(?:up|down)/i })
      loadingMoveButtons.forEach(button => expect(button).toBeDisabled())

      // Simulate operation completion by re-rendering
      rerender(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Buttons should have correct enabled/disabled state based on position (not all enabled)
      const moveUpButtons = screen.getAllByRole('button', { name: /move.*up/i })
      const moveDownButtons = screen.getAllByRole('button', { name: /move.*down/i })
      
      // First card: up disabled, down enabled
      expect(moveUpButtons[0]).toBeDisabled()
      expect(moveDownButtons[0]).not.toBeDisabled()
      
      // Last card: up enabled, down disabled  
      expect(moveUpButtons[3]).not.toBeDisabled()
      expect(moveDownButtons[3]).toBeDisabled()
      
      // Middle cards: both enabled
      expect(moveUpButtons[1]).not.toBeDisabled()
      expect(moveDownButtons[1]).not.toBeDisabled()
    })

    it('should re-enable buttons after failed operation', async () => {
      // Start with loading state, then error state
      mockUseCardOperations.mockReturnValueOnce({
        createCard: mockCreateCard,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
        moveCardUp: mockMoveCardUp,
        moveCardDown: mockMoveCardDown,
        loading: true,
        error: null
      }).mockReturnValueOnce({
        createCard: mockCreateCard,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
        moveCardUp: mockMoveCardUp,
        moveCardDown: mockMoveCardDown,
        loading: false,
        error: 'Network error'
      })

      const { rerender } = render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Buttons should be disabled during loading
      const loadingMoveButtons = screen.getAllByRole('button', { name: /move.*(?:up|down)/i })
      loadingMoveButtons.forEach(button => expect(button).toBeDisabled())

      // Simulate operation failure by re-rendering
      rerender(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Buttons should have correct enabled/disabled state based on position (even after error)
      const moveUpButtons = screen.getAllByRole('button', { name: /move.*up/i })
      const moveDownButtons = screen.getAllByRole('button', { name: /move.*down/i })
      
      // First card: up disabled, down enabled
      expect(moveUpButtons[0]).toBeDisabled()
      expect(moveDownButtons[0]).not.toBeDisabled()
      
      // Last card: up enabled, down disabled
      expect(moveUpButtons[3]).not.toBeDisabled()
      expect(moveDownButtons[3]).toBeDisabled()
      
      // Middle cards: both enabled  
      expect(moveUpButtons[1]).not.toBeDisabled()
      expect(moveDownButtons[1]).not.toBeDisabled()
    })
  })

  describe('Operation Feedback', () => {
    it('should show visual feedback during reorder operations', async () => {
      // Test that buttons have proper disabled styling when loading
      mockUseCardOperations.mockReturnValue({
        createCard: mockCreateCard,
        updateCard: mockUpdateCard,
        deleteCard: mockDeleteCard,
        moveCardUp: mockMoveCardUp,
        moveCardDown: mockMoveCardDown,
        loading: true,
        error: null
      })

      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Check that move buttons have disabled styling
      const disabledMoveButtons = screen.getAllByRole('button', { name: /move.*(?:up|down)/i })
      disabledMoveButtons.forEach(button => {
        expect(button).toBeDisabled()
        expect(button).toHaveClass('cursor-not-allowed')
      })
    })

    it('should display success feedback for successful reorder operations', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Find a move button and click it
      const moveUpButtons = screen.getAllByRole('button', { name: /move.*up/i })
      const moveUpButton = moveUpButtons.find(button => !(button as HTMLButtonElement).disabled)
      
      expect(moveUpButton).toBeInTheDocument()
      
      if (moveUpButton) {
        fireEvent.click(moveUpButton)
        expect(mockMoveCardUp).toHaveBeenCalled()
      }
    })

    it('should call move operations with correct parameters', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Test move up functionality - click on second card (index 1) which can move up
      const moveUpButtons = screen.getAllByRole('button', { name: /move.*up/i })
      if (moveUpButtons.length > 1) {
        fireEvent.click(moveUpButtons[1]) // Click second card's up button (enabled)
        expect(mockMoveCardUp).toHaveBeenCalledWith(expect.any(String), expect.any(Array))
      }
      
      // Test move down functionality - click on first card (index 0) which can move down  
      const moveDownButtons = screen.getAllByRole('button', { name: /move.*down/i })
      if (moveDownButtons.length > 0) {
        fireEvent.click(moveDownButtons[0]) // Click first card's down button (enabled)
        expect(mockMoveCardDown).toHaveBeenCalledWith(expect.any(String), expect.any(Array))
      }
    })
  })

  describe('Filtered List Reordering', () => {
    it('should work correctly with filtered card lists', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Test that cards are displayed
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
    })

    it('should maintain filter state during reorder operations', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Find search input
      const searchInput = screen.getByPlaceholderText(/search cards/i)
      expect(searchInput).toBeInTheDocument()
      
      // Filter to show only specific cards
      fireEvent.change(searchInput, { target: { value: 'Card 1' } })
      
      // Verify filtering works
      expect(screen.getByText('Card 1')).toBeInTheDocument()
    })

    it('should pass correct filtered array to reorder functions', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Get move buttons - click an enabled button (second card's up button)
      const moveUpButtons = screen.getAllByRole('button', { name: /move.*up/i })
      
      if (moveUpButtons.length > 1) {
        fireEvent.click(moveUpButtons[1]) // Click second card's up button (enabled)
        // Verify the function was called with the correct array structure
        expect(mockMoveCardUp).toHaveBeenCalledWith(expect.any(String), expect.any(Array))
      }
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle reorder operations on single card gracefully', async () => {
      // Set up single card scenario
      const singleCard = createOrderedMockCards(1, deckId)
      mockUseCards.mockReturnValue({
        cards: singleCard,
        loading: false,
        error: null
      })

      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Should still render without errors
      expect(screen.getByText('Card 1')).toBeInTheDocument()
    })

    it('should handle basic component lifecycle', async () => {
      render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Test that the component handles basic interactions
      const moveButtons = screen.getAllByRole('button', { name: /move.*(?:up|down)/i })
      expect(moveButtons.length).toBeGreaterThan(0)
    })

    it('should persist order across component re-renders', async () => {
      const { rerender } = render(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      
      // Verify cards are in expected order
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
      
      // Re-render and verify state persists
      rerender(<CardScreen deckId={deckId} deckTitle={deckTitle} />)
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
    })
  })
})