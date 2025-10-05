import { useQuery } from "@tanstack/react-query";
import { useOperator } from "@/contexts/operator-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check } from "lucide-react";
import type { Operator } from "@shared/schema";

export function MultiOperatorSelector() {
  const { selectedOperators, toggleOperator } = useOperator();
  
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
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-64 justify-between"
          data-testid="button-multi-operator-selector"
        >
          <span className="truncate">
            {selectedOperators.length === 0 
              ? "Wybierz operatorów" 
              : selectedOperators.length === 1 
              ? selectedOperators[0]
              : `Wybrano ${selectedOperators.length} operatorów`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {operators?.map((operator) => (
            <div
              key={operator}
              className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-pointer"
              onClick={() => toggleOperator(operator)}
              data-testid={`option-multi-operator-${operator}`}
            >
              <Checkbox
                checked={selectedOperators.includes(operator)}
                onCheckedChange={() => toggleOperator(operator)}
                data-testid={`checkbox-operator-${operator}`}
              />
              <label className="flex-1 text-sm cursor-pointer">
                {operator}
              </label>
              {selectedOperators.includes(operator) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
