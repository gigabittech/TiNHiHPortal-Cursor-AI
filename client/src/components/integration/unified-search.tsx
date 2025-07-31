import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  User, 
  Calendar, 
  FileText, 
  CreditCard,
  X
} from "lucide-react";
import { useIntegration } from "@/hooks/use-integration";
import { Link } from "wouter";
import { debounce } from "lodash";

interface UnifiedSearchProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
}

export function UnifiedSearch({ placeholder = "Search across all modules...", className, onClose }: UnifiedSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const { useCrossModuleSearch } = useIntegration();
  const { data: searchResults, isLoading } = useCrossModuleSearch(query);

  // Debounced search to avoid too many API calls
  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => {
      setQuery(value);
      setIsOpen(value.length > 0);
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSetQuery(value);
  };

  const handleClose = () => {
    setQuery("");
    setIsOpen(false);
    onClose?.();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'patients': return <User className="w-4 h-4" />;
      case 'appointments': return <Calendar className="w-4 h-4" />;
      case 'notes': return <FileText className="w-4 h-4" />;
      case 'invoices': return <CreditCard className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getResultLink = (type: string, item: any) => {
    switch (type) {
      case 'patients': return `/patients?action=view&id=${item.id}`;
      case 'appointments': return `/calendar?appointment=${item.id}`;
      case 'notes': return `/clinical-notes?note=${item.id}`;
      case 'invoices': return `/billing?invoice=${item.id}`;
      default: return '#';
    }
  };

  const getResultTitle = (type: string, item: any) => {
    switch (type) {
      case 'patients': return `${item.user?.firstName} ${item.user?.lastName}`;
      case 'appointments': return item.title;
      case 'notes': return `Clinical Note - ${item.type}`;
      case 'invoices': return `Invoice #${item.invoiceNumber}`;
      default: return 'Search Result';
    }
  };

  const getResultDescription = (type: string, item: any) => {
    switch (type) {
      case 'patients': return item.user?.email || 'Patient';
      case 'appointments': return item.description || `${item.duration} min appointment`;
      case 'notes': return item.assessment || 'Clinical documentation';
      case 'invoices': return `$${item.amount} - ${item.status}`;
      default: return '';
    }
  };

  const hasResults = searchResults && Object.values(searchResults).some((results: any) => results.length > 0);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={placeholder}
          className="pl-10 pr-10"
          onChange={handleInputChange}
          onFocus={() => setIsOpen(query.length > 0)}
        />
        {isOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Searching...</span>
                </div>
              </div>
            ) : hasResults ? (
              <ScrollArea className="max-h-80">
                <div className="p-2">
                  {/* Patients */}
                  {searchResults.patients?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <User className="w-3 h-3" />
                        Patients
                      </div>
                      {searchResults.patients.map((patient: any) => (
                        <Link key={patient.id} href={getResultLink('patients', patient)}>
                          <div className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {getResultIcon('patients')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {getResultTitle('patients', patient)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {getResultDescription('patients', patient)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Appointments */}
                  {searchResults.appointments?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Appointments
                      </div>
                      {searchResults.appointments.map((appointment: any) => (
                        <Link key={appointment.id} href={getResultLink('appointments', appointment)}>
                          <div className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              {getResultIcon('appointments')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {getResultTitle('appointments', appointment)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {getResultDescription('appointments', appointment)}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {appointment.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Clinical Notes */}
                  {searchResults.notes?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        Clinical Notes
                      </div>
                      {searchResults.notes.map((note: any) => (
                        <Link key={note.id} href={getResultLink('notes', note)}>
                          <div className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              {getResultIcon('notes')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {getResultTitle('notes', note)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {getResultDescription('notes', note)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Invoices */}
                  {searchResults.invoices?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <CreditCard className="w-3 h-3" />
                        Invoices
                      </div>
                      {searchResults.invoices.map((invoice: any) => (
                        <Link key={invoice.id} href={getResultLink('invoices', invoice)}>
                          <div className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              {getResultIcon('invoices')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {getResultTitle('invoices', invoice)}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {getResultDescription('invoices', invoice)}
                              </div>
                            </div>
                            <Badge 
                              variant={invoice.status === 'paid' ? 'default' : 'destructive'} 
                              className="text-xs"
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : query.length > 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}