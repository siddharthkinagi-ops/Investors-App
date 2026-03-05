import { useState } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ExternalLink, 
  Mail, 
  Building2,
  MapPin,
  Briefcase,
  ArrowUpDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const InvestorTable = ({ investors, loading, onEdit, onDelete, highlightNew = false }) => {
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteId, setDeleteId] = useState(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvestors = [...investors].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    const comparison = aVal.toString().localeCompare(bVal.toString());
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden" data-testid="investor-table-loading">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Institution</TableHead>
              <TableHead className="font-semibold text-slate-700">Stage</TableHead>
              <TableHead className="font-semibold text-slate-700">Cheque Size</TableHead>
              <TableHead className="font-semibold text-slate-700">Sectors</TableHead>
              <TableHead className="font-semibold text-slate-700">Geography</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-12 text-center" data-testid="investor-table-empty">
        <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
          No investors found
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          {highlightNew 
            ? "No new investors added in the last 24 hours. Use AI Extract or Add Investor to populate your database."
            : "Start building your investor database by adding investors manually or using AI extraction."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-hidden" data-testid="investor-table">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Name
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <button
                  onClick={() => handleSort('institution')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Institution
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">Stage</TableHead>
              <TableHead className="font-semibold text-slate-700">Cheque Size</TableHead>
              <TableHead className="font-semibold text-slate-700">Sectors</TableHead>
              <TableHead className="font-semibold text-slate-700">Geography</TableHead>
              <TableHead className="font-semibold text-slate-700">Contact</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvestors.map((investor) => (
              <TableRow
                key={investor.id}
                className={`investor-row ${highlightNew ? 'new-investor-row' : ''}`}
                data-testid={`investor-row-${investor.id}`}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{investor.name}</p>
                    {investor.title && (
                      <p className="text-sm text-slate-500">{investor.title}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{investor.institution || '-'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {investor.stage ? (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {investor.stage}
                    </Badge>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-slate-700 font-medium">
                    {investor.cheque_size || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {investor.sectors?.slice(0, 2).map((sector) => (
                      <Badge key={sector} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                        {sector}
                      </Badge>
                    ))}
                    {investor.sectors?.length > 2 && (
                      <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-500">
                        +{investor.sectors.length - 2}
                      </Badge>
                    )}
                    {(!investor.sectors || investor.sectors.length === 0) && (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {investor.geographies?.length > 0 ? (
                      <>
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {investor.geographies.slice(0, 2).join(', ')}
                          {investor.geographies.length > 2 && ` +${investor.geographies.length - 2}`}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {investor.email && (
                      <a
                        href={`mailto:${investor.email}`}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title={investor.email}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                    {investor.website && (
                      <a
                        href={investor.website.startsWith('http') ? investor.website : `https://${investor.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title={investor.website}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {!investor.email && !investor.website && (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`investor-actions-${investor.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(investor)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(investor.id)}
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investor? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
