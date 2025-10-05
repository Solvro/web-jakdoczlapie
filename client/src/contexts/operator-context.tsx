import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Operator } from "@shared/schema";

interface OperatorContextType {
  selectedOperators: Operator[];
  setSelectedOperators: (operators: Operator[]) => void;
  toggleOperator: (operator: Operator) => void;
  selectedOperator: Operator | null;
  setSelectedOperator: (operator: Operator | null) => void;
}

const OperatorContext = createContext<OperatorContextType | undefined>(undefined);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [selectedOperators, setSelectedOperators] = useState<Operator[]>(() => {
    const stored = localStorage.getItem("selectedOperators");
    return stored ? JSON.parse(stored) : ["LUZ"];
  });

  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(() => {
    const stored = localStorage.getItem("selectedOperator");
    return stored || "LUZ";
  });

  useEffect(() => {
    if (selectedOperators.length > 0) {
      localStorage.setItem("selectedOperators", JSON.stringify(selectedOperators));
    } else {
      localStorage.removeItem("selectedOperators");
    }
  }, [selectedOperators]);

  useEffect(() => {
    if (selectedOperator) {
      localStorage.setItem("selectedOperator", selectedOperator);
    } else {
      localStorage.removeItem("selectedOperator");
    }
  }, [selectedOperator]);

  const toggleOperator = (operator: Operator) => {
    setSelectedOperators(prev => {
      if (prev.includes(operator)) {
        const filtered = prev.filter(op => op !== operator);
        return filtered.length > 0 ? filtered : prev;
      } else {
        return [...prev, operator];
      }
    });
  };

  return (
    <OperatorContext.Provider value={{ 
      selectedOperators, 
      setSelectedOperators, 
      toggleOperator,
      selectedOperator,
      setSelectedOperator
    }}>
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (context === undefined) {
    throw new Error("useOperator must be used within an OperatorProvider");
  }
  return context;
}
