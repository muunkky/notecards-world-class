// User model for Firebase Auth users
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

// Deck model - represents a collection of cards
export interface Deck {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  cardCount?: number; // Calculated field, not stored in Firestore
}

// Card model - represents individual notecards within a deck
export interface Card {
  id: string;
  deckId: string;
  title: string;
  body: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order Snapshot model - stores saved card orderings
export interface OrderSnapshot {
  id: string;
  deckId: string;
  name: string;
  cardOrder: string[]; // Array of card IDs in order
  createdAt: Date;
}

// Card reordering operation types
export interface CardReorderOperation {
  cardId: string;
  direction: 'up' | 'down';
  currentIndex: number;
  newIndex: number;
}

export interface BulkReorderOperation {
  deckId: string;
  cardUpdates: Array<{
    cardId: string;
    newOrderIndex: number;
  }>;
}

export enum ReorderDirection {
  UP = 'up',
  DOWN = 'down'
}

// Firestore document data types (without auto-generated fields)
export interface DeckData {
  title: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardData {
  title: string;
  body: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSnapshotData {
  name: string;
  cardOrder: string[];
  createdAt: Date;
}

export interface UserData {
  email: string;
  displayName: string;
  createdAt: Date;
}

// UI State types
export interface CardUIState {
  isExpanded: boolean;
  isEditing: boolean;
}

export interface DeckScreenState {
  selectedDeckId: string | null;
  isCreatingDeck: boolean;
  isRenamingDeck: string | null; // ID of deck being renamed
}

export interface CardScreenState {
  filterText: string;
  allExpanded: boolean;
  isShuffling: boolean;
  selectedSnapshot: string | null;
}

// API Response types
export interface FirestoreError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: FirestoreError;
}

// Hook return types
export interface UseDecksReturn {
  decks: Deck[];
  loading: boolean;
  error: FirestoreError | null;
  createDeck: (title: string) => Promise<string>;
  updateDeck: (id: string, updates: Partial<DeckData>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
}

export interface UseCardsReturn {
  cards: Card[];
  loading: boolean;
  error: FirestoreError | null;
  createCard: (title: string, body?: string) => Promise<string>;
  updateCard: (id: string, updates: Partial<CardData>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  reorderCards: (cardIds: string[]) => Promise<void>;
}

export interface UseOrderSnapshotsReturn {
  snapshots: OrderSnapshot[];
  loading: boolean;
  error: FirestoreError | null;
  saveSnapshot: (name: string, cardOrder: string[]) => Promise<string>;
  loadSnapshot: (snapshotId: string) => Promise<string[]>;
  deleteSnapshot: (snapshotId: string) => Promise<void>;
}

// Drag and Drop types (for react-beautiful-dnd)
export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  reason: 'DROP' | 'CANCEL';
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// Constants and Enums
export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export enum CardSortBy {
  ORDER_INDEX = 'orderIndex',
  TITLE = 'title',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

export enum DeckSortBy {
  TITLE = 'title',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CARD_COUNT = 'cardCount'
}