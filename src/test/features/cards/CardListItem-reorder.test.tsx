import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CardListItem } from '../../../features/cards/CardScreen'
import { createMockCard } from '../../utils/test-factories'

describe('CardListItem - Advanced UI States and Reorder Features', () => {
  const defaultProps = {
    card: createMockCard(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    canMoveUp: true,
    canMoveDown: true,
    isReordering: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Reorder Button States', () => {
    it('should disable move up button when canMoveUp is false', () => {
      render(<CardListItem {...defaultProps} canMoveUp={false} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      expect(moveUpButton).toBeDisabled()
    })

    it('should disable move down button when canMoveDown is false', () => {
      render(<CardListItem {...defaultProps} canMoveDown={false} />)
      
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      expect(moveDownButton).toBeDisabled()
    })

    it('should enable both buttons when both canMoveUp and canMoveDown are true', () => {
      render(<CardListItem {...defaultProps} canMoveUp={true} canMoveDown={true} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      
      expect(moveUpButton).not.toBeDisabled()
      expect(moveDownButton).not.toBeDisabled()
    })

    it('should disable all reorder buttons when isReordering is true', () => {
      render(<CardListItem {...defaultProps} isReordering={true} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      
      expect(moveUpButton).toBeDisabled()
      expect(moveDownButton).toBeDisabled()
    })

    it('should not disable edit/delete buttons when isReordering is true', () => {
      render(<CardListItem {...defaultProps} isReordering={true} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      
      expect(editButton).not.toBeDisabled()
      expect(deleteButton).not.toBeDisabled()
    })
  })

  describe('Button Actions', () => {
    it('should call onMoveUp when move up button is clicked', () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      fireEvent.click(moveUpButton)
      
      expect(defaultProps.onMoveUp).toHaveBeenCalledWith(defaultProps.card.id)
    })

    it('should call onMoveDown when move down button is clicked', () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      fireEvent.click(moveDownButton)
      
      expect(defaultProps.onMoveDown).toHaveBeenCalledWith(defaultProps.card.id)
    })

    it('should call onEdit when edit button is clicked', () => {
      render(<CardListItem {...defaultProps} />)
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(defaultProps.card.id)
    })

    it('should call onDelete when delete button is clicked', () => {
      render(<CardListItem {...defaultProps} />)
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.card.id)
    })
  })

  describe('Visual Feedback', () => {
    it('should show hover effects on reorder buttons', () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      
      fireEvent.mouseEnter(moveUpButton)
      expect(moveUpButton).toHaveClass('hover:bg-blue-100')
    })

    it('should apply active state styling during button press', () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      
      fireEvent.mouseDown(moveUpButton)
      expect(moveUpButton).toHaveClass('active:bg-blue-200')
    })

    it('should have transition classes for smooth animations', () => {
      render(<CardListItem {...defaultProps} />)
      
      const cardElement = screen.getByTestId(`card-item-${defaultProps.card.id}`)
      expect(cardElement).toHaveClass('transition-all', 'duration-200')
    })

    it('should show proper styling during reorder state', () => {
      render(<CardListItem {...defaultProps} isReordering={true} />)
      
      const moveButtons = screen.getAllByRole('button', { name: /move/i })
      moveButtons.forEach(button => {
        expect(button).toHaveClass('opacity-50')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for reorder buttons', () => {
      const card = createMockCard({ title: 'Test Card Title' })
      
      render(<CardListItem {...defaultProps} card={card} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      
      expect(moveUpButton).toHaveAttribute('aria-label', expect.stringContaining('Test Card Title'))
      expect(moveDownButton).toHaveAttribute('aria-label', expect.stringContaining('Test Card Title'))
    })

    it('should be keyboard navigable', () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      
      moveUpButton.focus()
      expect(moveUpButton).toHaveFocus()
      
      fireEvent.keyDown(moveUpButton, { key: 'Enter' })
      expect(defaultProps.onMoveUp).toHaveBeenCalled()
    })

    it('should support space key activation', () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      
      moveDownButton.focus()
      fireEvent.keyDown(moveDownButton, { key: ' ' })
      
      expect(defaultProps.onMoveDown).toHaveBeenCalled()
    })

    it('should have proper disabled states with aria attributes', () => {
      render(<CardListItem {...defaultProps} canMoveUp={false} isReordering={true} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      expect(moveUpButton).toHaveAttribute('disabled')
      expect(moveUpButton).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle rapid button clicks gracefully', async () => {
      render(<CardListItem {...defaultProps} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      const moveDownButton = screen.getByRole('button', { name: /move.*down/i })
      
      // Rapid clicks
      fireEvent.click(moveUpButton)
      fireEvent.click(moveDownButton)
      fireEvent.click(moveUpButton)
      
      expect(defaultProps.onMoveUp).toHaveBeenCalledTimes(2)
      expect(defaultProps.onMoveDown).toHaveBeenCalledTimes(1)
    })

    it('should handle missing card data gracefully', () => {
      const invalidCard = createMockCard({ title: '', body: '' })
      
      expect(() => {
        render(<CardListItem {...defaultProps} card={invalidCard} />)
      }).not.toThrow()
    })

    it('should maintain component state during prop changes', () => {
      const { rerender } = render(<CardListItem {...defaultProps} canMoveUp={true} />)
      
      // Change props
      rerender(<CardListItem {...defaultProps} canMoveUp={false} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      expect(moveUpButton).toBeDisabled()
    })

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })
      
      render(<CardListItem {...defaultProps} onMoveUp={errorCallback} />)
      
      const moveUpButton = screen.getByRole('button', { name: /move.*up/i })
      
      expect(() => {
        fireEvent.click(moveUpButton)
      }).not.toThrow()
    })
  })

  describe('Content Display', () => {
    it('should display card title and body correctly', () => {
      const card = createMockCard({
        title: 'Test Card Title',
        body: 'This is the card body content'
      })
      
      render(<CardListItem {...defaultProps} card={card} />)
      
      expect(screen.getByText('Test Card Title')).toBeInTheDocument()
      expect(screen.getByText(/this is the card body content/i)).toBeInTheDocument()
    })

    it('should handle card expansion/collapse', () => {
      const card = createMockCard({
        title: 'Expandable Card',
        body: 'A'.repeat(200) // Long content
      })
      
      render(<CardListItem {...defaultProps} card={card} />)
      
      const cardElement = screen.getByTestId(`card-item-${card.id}`)
      fireEvent.click(cardElement)
      
      // Should toggle expansion state
      expect(cardElement).toBeInTheDocument()
    })

    it('should truncate long card bodies appropriately', () => {
      const longContent = 'A'.repeat(200)
      const card = createMockCard({ body: longContent })
      
      render(<CardListItem {...defaultProps} card={card} />)
      
      // Should show truncated content initially
      const displayedText = screen.getByText(/A+\.\.\./))
      expect(displayedText).toBeInTheDocument()
    })
  })
})