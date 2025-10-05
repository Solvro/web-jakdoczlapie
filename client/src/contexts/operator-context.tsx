import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Operator } from "@shared/schema";

interface OperatorContextType {
  selectedOperator: Operator | null;
  setSelectedOperator: (operator: Operator | null) => void;
}

const OperatorContext = createContext<OperatorContextType | undefined>(undefined);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(() => {
    const stored = localStorage.getItem("selectedOperator");
    return stored || "LUZ"; // Default to LUZ operator
  });

  useEffect(() => {
    if (selectedOperator) {
      localStorage.setItem("selectedOperator", selectedOperator);
    } else {
      localStorage.removeItem("selectedOperator");
    }
  }, [selectedOperator]);

  return (
    <OperatorContext.Provider value={{ selectedOperator, setSelectedOperator }}>
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
