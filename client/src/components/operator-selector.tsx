import { useQuery } from "@tanstack/react-query";
import { useOperator } from "@/contexts/operator-context";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Operator } from "@shared/schema";

export function OperatorSelector() {
  const { selectedOperator, setSelectedOperator } = useOperator();
  
  const { data: operators, isLoading } = useQuery<Operator[]>({
    queryKey: [api.operators.getAll()],
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  return (
    <Select
      value={selectedOperator || operators?.[0] || "LUZ"}
      onValueChange={(value) => setSelectedOperator(value)}
    >
      <SelectTrigger 
        className="w-48" 
        data-testid="select-operator"
      >
        <SelectValue placeholder="Wybierz operatora" />
      </SelectTrigger>
      <SelectContent>
        {operators?.map((operator) => (
          <SelectItem 
            key={operator} 
            value={operator}
            data-testid={`option-operator-${operator}`}
          >
            {operator}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
