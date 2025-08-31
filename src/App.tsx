import { useState } from "react";
import { useAuth } from "./providers/AuthProvider";
import LoginScreen from "./features/auth/LoginScreen";
import DeckScreen from "./features/decks/DeckScreen";
import CardScreen from "./features/cards/CardScreen";

// Loading component for smooth transitions
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
    <div className="flex items-center space-x-3 text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <span className="text-lg font-medium">Loading...</span>
    </div>
  </div>
);

// Simple navigation state management
type Screen = 'decks' | 'cards'

interface AppState {
  currentScreen: Screen
  selectedDeckId: string | null
  selectedDeckTitle: string | null
  isTransitioning: boolean
}

function App() {
  const { user, loading } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'decks',
    selectedDeckId: null,
    selectedDeckTitle: null,
    isTransitioning: false
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Enhanced navigation with smooth transitions
  const navigateToCards = (deckId: string, deckTitle: string) => {
    setAppState(prev => ({ ...prev, isTransitioning: true }));
    
    setTimeout(() => {
      setAppState({
        currentScreen: 'cards',
        selectedDeckId: deckId,
        selectedDeckTitle: deckTitle,
        isTransitioning: false
      });
    }, 150); // Short transition delay
  };

  const navigateToDecks = () => {
    setAppState(prev => ({ ...prev, isTransitioning: true }));
    
    setTimeout(() => {
      setAppState({
        currentScreen: 'decks',
        selectedDeckId: null,
        selectedDeckTitle: null,
        isTransitioning: false
      });
    }, 150); // Short transition delay
  };

  // Show loading during transitions
  if (appState.isTransitioning) {
    return <LoadingSpinner />;
  }

  // Render appropriate screen based on state with transitions
  switch (appState.currentScreen) {
    case 'cards':
      return (
        <div className="animate-slideInFromRight">
          <CardScreen 
            deckId={appState.selectedDeckId!}
            deckTitle={appState.selectedDeckTitle}
            onBack={navigateToDecks}
          />
        </div>
      );
    case 'decks':
    default:
      return (
        <div className="animate-slideInFromLeft">
          <DeckScreen onSelectDeck={navigateToCards} />
        </div>
      );
  }
}

export default App;