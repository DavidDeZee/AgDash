import { Search, SlidersHorizontal, X, Info, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { useState } from 'react';

export function FilterPanel() {
  const {
    selectedStates,
    selectedLocations,
    croplandRange,
    farmsRange,
    searchQuery,

    setCroplandRange,
    setFarmsRange,
    setSearchQuery,
    resetFilters,
  } = useStore();

  const [showExamples, setShowExamples] = useState(false);
  const [queryInput, setQueryInput] = useState('');

  const exampleQueries = [
    'highest cropland in Oregon',
    'lowest farms in Washington',
    'most irrigated acres in California',
    'counties with over 500000 cropland acres',
    'compare Oregon and Washington',
    'highest farms in Nevada',
  ];

  const handleQuerySubmit = () => {
    if (queryInput.trim()) {
      setSearchQuery(queryInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuerySubmit();
    }
  };


  const hasActiveFilters =
    selectedStates.length > 0 ||
    selectedLocations.length > 0 ||
    croplandRange[0] !== null ||
    croplandRange[1] !== null ||
    farmsRange[0] !== null ||
    farmsRange[1] !== null;

  return (
    <div className="space-y-4 p-6">
      {/* Natural Language Query */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Ask a Question</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="h-7 w-7 p-0"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., highest cropland in Oregon"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleQuerySubmit} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {showExamples && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground">
                Example queries:
              </p>
              <div className="space-y-1">
                {exampleQueries.map((query) => (
                  <button
                    key={query}
                    onClick={() => {
                      setQueryInput(query);
                      setSearchQuery(query);
                      setShowExamples(false);
                    }}
                    className="block w-full text-left text-xs text-muted-foreground hover:text-primary hover:bg-accent px-2 py-1.5 rounded transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
          {searchQuery && (
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
              <p className="text-xs text-foreground">
                Query: <strong>{searchQuery}</strong>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setQueryInput('');
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Filters Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>



      {/* Cropland Acres */}
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Cropland Acres</h4>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={croplandRange[0] || ''}
              onChange={(e) =>
                setCroplandRange([
                  e.target.value ? Number(e.target.value) : null,
                  croplandRange[1],
                ])
              }
              className="w-full"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={croplandRange[1] || ''}
              onChange={(e) =>
                setCroplandRange([
                  croplandRange[0],
                  e.target.value ? Number(e.target.value) : null,
                ])
              }
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Farms */}
      <Card className="p-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Number of Farms</h4>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={farmsRange[0] || ''}
              onChange={(e) =>
                setFarmsRange([
                  e.target.value ? Number(e.target.value) : null,
                  farmsRange[1],
                ])
              }
              className="w-full"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={farmsRange[1] || ''}
              onChange={(e) =>
                setFarmsRange([
                  farmsRange[0],
                  e.target.value ? Number(e.target.value) : null,
                ])
              }
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}