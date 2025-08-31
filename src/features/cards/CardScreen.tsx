import React, { useState } from 'react'
import { useCards } from '../../hooks/useCards'
import { useCardOperations } from '../../hooks/useCardOperations'
import type { Card } from '../../types'

// TDD: Connect our CardScreen to real Firestore data via useCards hook

interface CardListItemProps {
  card: Card
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
  isReordering: boolean
}

interface CardScreenProps {
  deckId: string
  deckTitle?: string | null
  onBack?: () => void
}

// TDD: Implement CardListItem component first
export const CardListItem: React.FC<CardListItemProps> = ({ 
  card, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  canMoveUp, 
  canMoveDown, 
  isReordering 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const truncateBody = (body: string, maxLength: number = 120) => {
    if (body.length <= maxLength) return body
    return body.substring(0, maxLength) + '...'
  }

  // Error handling wrapper for button actions
  const safeHandleClick = (callback: () => void) => {
    try {
      callback()
    } catch (error) {
      console.error('Button action failed:', error)
    }
  }

  // Keyboard event handler for accessibility
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      safeHandleClick(action)
    }
  }

  return (
    <div 
      data-testid={`card-item-${card.id}`}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight">
            {card.title}
          </h3>
          <div className="text-gray-700 leading-relaxed">
            {isExpanded ? (
              <div className="whitespace-pre-wrap">{card.body || 'No description'}</div>
            ) : (
              <div>
                {truncateBody(card.body || 'No description')}
                {!isExpanded && card.body && card.body.length > 120 && (
                  <span className="text-blue-600 font-medium ml-2">Click to expand...</span>
                )}
              </div>
            )}
          </div>
          {isExpanded && (
            <div className="mt-3 text-sm text-gray-500">
              Created: {card.createdAt.toLocaleDateString()}
              {card.updatedAt.getTime() !== card.createdAt.getTime() && (
                <span className="ml-4">
                  Updated: {card.updatedAt.toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {/* Reorder Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              safeHandleClick(() => onMoveUp(card.id))
            }}
            onKeyDown={(e) => handleKeyDown(e, () => onMoveUp(card.id))}
            disabled={!canMoveUp || isReordering}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              canMoveUp && !isReordering
                ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-100 active:bg-blue-200'
                : 'text-gray-200 cursor-not-allowed'
            } ${isReordering ? 'opacity-50' : ''}`}
            aria-label={`move "${card.title}" up`}
            aria-disabled={(!canMoveUp || isReordering) ? 'true' : undefined}
            title="Move card up"
          >
            <span className="text-lg">⬆️</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              safeHandleClick(() => onMoveDown(card.id))
            }}
            onKeyDown={(e) => handleKeyDown(e, () => onMoveDown(card.id))}
            disabled={!canMoveDown || isReordering}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              canMoveDown && !isReordering
                ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-100 active:bg-blue-200'
                : 'text-gray-200 cursor-not-allowed'
            } ${isReordering ? 'opacity-50' : ''}`}
            aria-label={`move "${card.title}" down`}
            aria-disabled={(!canMoveDown || isReordering) ? 'true' : undefined}
            title="Move card down"
          >
            <span className="text-lg">⬇️</span>
          </button>
          
          {/* Existing Edit/Delete Buttons - These should NOT be disabled during reordering */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              safeHandleClick(() => onEdit(card.id))
            }}
            onKeyDown={(e) => handleKeyDown(e, () => onEdit(card.id))}
            className="p-2 rounded-lg transition-colors duration-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            aria-label={`edit ${card.id}`}
            title="Edit card"
          >
            <span className="text-lg">✏️</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              safeHandleClick(() => onDelete(card.id))
            }}
            onKeyDown={(e) => handleKeyDown(e, () => onDelete(card.id))}
            className="p-2 rounded-lg transition-colors duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50"
            aria-label={`delete ${card.id}`}
            title="Delete card"
          >
            <span className="text-lg">🗑️</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// TDD: Implement CardScreen component to make tests pass
export default function CardScreen({ deckId, deckTitle, onBack }: CardScreenProps) {
  const { cards, loading, error } = useCards(deckId)
  const { 
    createCard, 
    updateCard, 
    deleteCard, 
    moveCardUp, 
    moveCardDown, 
    loading: operationLoading, 
    error: operationError 
  } = useCardOperations(deckId)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardBody, setNewCardBody] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  
  // TDD Phase 2A.1: Advanced Card Filtering State
  const [searchQuery, setSearchQuery] = useState('')

  // TDD Phase 2A.1: Filter cards based on search query
  const filteredCards = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return cards
    }
    
    const query = searchQuery.toLowerCase().trim()
    return cards.filter(card => 
      card.title.toLowerCase().includes(query) ||
      card.body.toLowerCase().includes(query)
    )
  }, [cards, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading cards...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error loading cards: {error}</div>
      </div>
    )
  }

  const handleCreateCard = async () => {
    if (newCardTitle.trim()) {
      try {
        await createCard(newCardTitle.trim(), newCardBody.trim())
        console.log('Successfully created card:', newCardTitle)
        setNewCardTitle('')
        setNewCardBody('')
        setShowCreateModal(false)
      } catch (error) {
        console.error('Failed to create card:', error)
      }
    }
  }

  const handleEditCard = async () => {
    if (selectedCard && editTitle.trim()) {
      try {
        await updateCard(selectedCard.id, { 
          title: editTitle.trim(),
          body: editBody.trim()
        })
        console.log('Successfully updated card:', selectedCard.id)
        setEditTitle('')
        setEditBody('')
        setShowEditModal(false)
        setSelectedCard(null)
      } catch (error) {
        console.error('Failed to update card:', error)
      }
    }
  }

  const handleDeleteCard = async () => {
    if (selectedCard) {
      try {
        await deleteCard(selectedCard.id)
        console.log('Successfully deleted card:', selectedCard.id)
        setShowDeleteModal(false)
        setSelectedCard(null)
      } catch (error) {
        console.error('Failed to delete card:', error)
      }
    }
  }

  const openEditModal = (card: Card) => {
    setSelectedCard(card)
    setEditTitle(card.title)
    setEditBody(card.body)
    setShowEditModal(true)
  }

  const openDeleteModal = (card: Card) => {
    setSelectedCard(card)
    setShowDeleteModal(true)
  }

  const handleCardEdit = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (card) {
      openEditModal(card)
    }
  }

  const handleCardDelete = (cardId: string) => {
    const card = cards.find(c => c.id === cardId)
    if (card) {
      openDeleteModal(card)
    }
  }

  const handleMoveCardUp = async (cardId: string) => {
    try {
      await moveCardUp(cardId, filteredCards)
      console.log('Successfully moved card up:', cardId)
    } catch (error) {
      console.error('Failed to move card up:', error)
    }
  }

  const handleMoveCardDown = async (cardId: string) => {
    try {
      await moveCardDown(cardId, filteredCards)
      console.log('Successfully moved card down:', cardId)
    } catch (error) {
      console.error('Failed to move card down:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Enhanced Breadcrumb Navigation */}
        <div className="flex items-center text-white mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-300 hover:text-blue-100 transition-colors duration-200"
          >
            <span className="mr-2 text-lg">←</span>
            <span className="hover:underline">All Decks</span>
          </button>
          <span className="mx-3 text-gray-400 text-lg">/</span>
          <span className="text-gray-300 font-medium">
            {deckTitle || 'Cards'}
          </span>
        </div>

        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {deckTitle ? `${deckTitle}` : 'Deck Cards'}
            </h1>
            <p className="text-gray-300">
              {filteredCards.length} {filteredCards.length === 1 ? 'card' : 'cards'}
              {searchQuery && (
                <span className="ml-2 text-blue-300">
                  {filteredCards.length !== cards.length && `(${cards.length} total)`}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Create New Card
          </button>
        </div>

        {/* TDD Phase 2A.1: Advanced Search/Filter Bar */}
        {cards.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="text-lg">✕</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Card List */}
        <div className="space-y-4">
          {cards.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📝</span>
              </div>
              <div className="text-white text-xl mb-4 font-medium">No cards yet</div>
              <div className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                Start building your {deckTitle || 'deck'} by creating your first card. Add questions, notes, or any content you want to study.
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Create Your First Card
              </button>
            </div>
          ) : filteredCards.length === 0 ? (
            // TDD Phase 2A.1: No search results state
            <div className="text-center py-16">
              <div className="bg-white/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <div className="text-white text-xl mb-4 font-medium">No cards match your search</div>
              <div className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                Try a different search term or{' '}
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-300 hover:text-blue-100 underline"
                >
                  clear your search
                </button>
                {' '}to see all cards.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.map((card, index) => (
                <div
                  key={card.id}
                  className="animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardListItem
                    card={card}
                    onEdit={handleCardEdit}
                    onDelete={handleCardDelete}
                    onMoveUp={handleMoveCardUp}
                    onMoveDown={handleMoveCardDown}
                    canMoveUp={index > 0}
                    canMoveDown={index < filteredCards.length - 1}
                    isReordering={operationLoading}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Create New Card</h2>
              <input
                type="text"
                placeholder="Card title"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <textarea
                placeholder="Card body (optional)"
                value={newCardBody}
                onChange={(e) => setNewCardBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewCardTitle('')
                    setNewCardBody('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCard}
                  disabled={!newCardTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Edit Card</h2>
              <input
                type="text"
                placeholder="Card title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <textarea
                placeholder="Card body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditTitle('')
                    setEditBody('')
                    setSelectedCard(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCard}
                  disabled={!editTitle.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Delete Card</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedCard.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedCard(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCard}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}