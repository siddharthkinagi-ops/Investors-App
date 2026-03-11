// AIExtractModal.jsx

import { useState } from 'react';
import { Sparkles, Loader2, MapPin, Briefcase, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { investorApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export const AIExtractModal = ({ open, onOpenChange, onSuccess }) => {
  const [sector, setSector] = useState('');
  const [geography, setGeography] = useState('');
  const [stage, setStage] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [sources, setSources] = useState([]);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      resetModal();
    }
  };

  const resetModal = () => {
    setSector('');
    setGeography('');
    setStage('');
    setCount(5);
    setResults([]);
    setSources([]);
  };

  const handleDiscover = async () => {
    if (!sector.trim() && !geography.trim() && !stage.trim()) {
      toast.error('Please enter at least one filter like sector, geography, or stage');
      return;
    }

    try {
      setLoading(true);
      setResults([]);
      setSources([]);

      const result = await investorApi.discover({
        sector,
        geography,
        stage,
        count: Number(count) || 5,
      });

      const investors = result?.investors || [];
      const sourceLinks = result?.sources || [];

      setResults(investors);
      setSources(sourceLinks);

      if (!investors.length) {
        toast.error('No investors found. Try broader filters.');
        return;
      }

      toast.success(`${investors.length} investor suggestion(s) found`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Investor discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUseInvestor = (investor) => {
    if (onSuccess) {
      onSuccess(investor);
    }
    toast.success('Investor loaded into add form');
    onOpenChange(false);
    resetModal();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="ai-extract-modal">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold flex items-center gap-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <Sparkles className="h-5 w-5 text-orange-500" />
            AI-Powered Investor Discovery
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Discover relevant investors automatically using sector, geography, and stage filters.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Sector
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. SaaS, Fintech, Healthtech"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Geography
              </label>
              <input
                type="text"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                placeholder="e.g. India, UAE, Southeast Asia"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Stage
              </label>
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="e.g. Pre-Seed, Seed, Series A"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">
                Number of Investors
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">Tips for better discovery:</h4>
            <p className="text-sm text-slate-600">
              Use clear filters like sector, geography, and stage. Example:
              <span className="font-medium"> SaaS + India + Seed</span> or
              <span className="font-medium"> Healthtech + UAE + Series A</span>.
            </p>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900">
                  Suggested Investors ({results.length})
                </h4>
              </div>

              <div className="space-y-3">
                {results.map((investor, index) => (
                  <div
                    key={`${investor.name || 'investor'}-${index}`}
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div>
                          <h5 className="font-semibold text-slate-900 text-base">
                            {investor.name || 'Unknown Name'}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {investor.title || 'Role not found'}
                            {investor.institution ? ` · ${investor.institution}` : ''}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                          {investor.geographies?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{investor.geographies.join(', ')}</span>
                            </div>
                          )}

                          {investor.sectors?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              <span>{investor.sectors.join(', ')}</span>
                            </div>
                          )}

                          {investor.stage && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span>{investor.stage}</span>
                            </div>
                          )}
                        </div>

                        {investor.notes && (
                          <p className="text-sm text-slate-700">{investor.notes}</p>
                        )}

                        {investor.source && (
                          <a
                            href={investor.source}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-orange-600 hover:underline break-all"
                          >
                            {investor.source}
                          </a>
                        )}
                      </div>

                      <div className="shrink-0">
                        <Button
                          onClick={() => handleUseInvestor(investor)}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Use This Investor
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {sources.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Grounded Sources</h4>
                  <div className="space-y-1">
                    {sources.map((src, idx) => (
                      <a
                        key={`${src}-${idx}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-orange-600 hover:underline break-all"
                      >
                        {src}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Close
          </Button>

          <Button
            onClick={handleDiscover}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Discovering...
              </>
            ) : (
              'Discover Investors'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};