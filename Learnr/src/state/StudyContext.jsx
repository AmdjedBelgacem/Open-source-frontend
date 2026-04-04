import { createContext, useContext, useState } from 'react';

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);

  return (
    <StudyContext.Provider value={{ generatedCards, setGeneratedCards, selectedDeck, setSelectedDeck }}>
      {children}
    </StudyContext.Provider>
  );
}

export default function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be inside StudyProvider');
  return ctx;
}
