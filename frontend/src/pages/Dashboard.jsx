import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Download, 
  Database, 
  Users, 
  Clock, 
  Filter,
  ChevronDown,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { investorApi } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { InvestorTable } from '@/components/InvestorTable';
import { AddInvestorModal } from '@/components/AddInvestorModal';
import { AIExtractModal } from '@/components/AIExtractModal';
import { StatsCards } from '@/components/StatsCards';

export default function Dashboard({ initialTab = "all" }) {
  const [investors, setInvestors] = useState([]);
  const [newInvestors, setNewInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    geography: '',
    sector: '',
    stage: '',
    cheque_size: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    geographies: [],
    sectors: [],
    stages: [],
    cheque_sizes: []
  });
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await investorApi.getAll(filters);
      setInvestors(data);
    } catch (error) {
      console.error('Failed to fetch investors:', error);
      toast.error('Failed to load investors');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchNewInvestors = useCallback(async () => {
    try {
      const data = await investorApi.getNew();
      setNewInvestors(data);
    } catch (error) {
      console.error('Failed to fetch new investors:', error);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const options = await investorApi.getFilters();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvestors();
    fetchNewInvestors();
    fetchFilterOptions();
  }, [fetchInvestors, fetchNewInvestors, fetchFilterOptions]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      geography: '',
      sector: '',
      stage: '',
      cheque_size: ''
    });
  };

  const handleExport = async () => {
    try {
      await investorApi.exportExcel(filters);
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const handleInvestorCreated = () => {
    fetchInvestors();
    fetchNewInvestors();
    fetchFilterOptions();
  };

  const handleDelete = async (id) => {
    try {
      await investorApi.delete(id);
      toast.success('Investor deleted');
      fetchInvestors();
      fetchNewInvestors();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete investor');
    }
  };

  const handleEdit = (investor) => {
    setEditingInvestor(investor);
    setShowAddModal(true);
  };

  const hasActiveFilters = filters.geography || filters.sector || filters.stage || filters.cheque_size;

  return (
    <div className="flex min-h-screen bg-white" data-testid="dashboard">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} newCount={newInvestors.length} />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  data-testid="search-input"
                  placeholder="Search investors, funds, or emails..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2">
                <FilterDropdown
                  label="Geography"
                  value={filters.geography}
                  options={filterOptions.geographies}
                  onChange={(v) => handleFilterChange('geography', v)}
                  testId="filter-geography"
                />
                <FilterDropdown
                  label="Sector"
                  value={filters.sector}
                  options={filterOptions.sectors}
                  onChange={(v) => handleFilterChange('sector', v)}
                  testId="filter-sector"
                />
                <FilterDropdown
                  label="Stage"
                  value={filters.stage}
                  options={filterOptions.stages}
                  onChange={(v) => handleFilterChange('stage', v)}
                  testId="filter-stage"
                />
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-slate-500 hover:text-slate-700"
                    data-testid="clear-filters-btn"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="border-slate-200 hover:bg-slate-50"
                data-testid="export-btn"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAIModal(true)}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                data-testid="ai-extract-btn"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Extract
              </Button>
              <Button
                onClick={() => {
                  setEditingInvestor(null);
                  setShowAddModal(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white btn-lift"
                data-testid="add-investor-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Investor
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <StatsCards investors={investors} newCount={newInvestors.length} />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                data-testid="tab-all"
              >
                <Database className="h-4 w-4 mr-2" />
                All Investors ({investors.length})
              </TabsTrigger>
              <TabsTrigger
                value="new"
                className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                data-testid="tab-new"
              >
                <Clock className="h-4 w-4 mr-2" />
                New Today ({newInvestors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <InvestorTable
                investors={investors}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="new" className="mt-6">
              <InvestorTable
                investors={newInvestors}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                highlightNew
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddInvestorModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleInvestorCreated}
        editingInvestor={editingInvestor}
      />

      <AIExtractModal
        open={showAIModal}
        onOpenChange={setShowAIModal}
        onSuccess={handleInvestorCreated}
      />
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange, testId }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-slate-200 ${value ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}`}
          data-testid={testId}
        >
          <Filter className="h-3 w-3 mr-1" />
          {value || label}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        <DropdownMenuItem onClick={() => onChange('')}>
          All {label}s
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => onChange(option)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
