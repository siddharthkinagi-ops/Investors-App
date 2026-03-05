import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { investorApi } from '@/lib/api';

export const AIExtractModal = ({ open, onOpenChange, onSuccess }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleExtract = async () => {
    if (!content.trim()) {
      toast.error('Please paste some content to extract from');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await investorApi.extract(content);
      setResult(response);
      
      if (response.investors.length > 0) {
        toast.success(`Successfully extracted ${response.investors.length} investor(s)`);
        onSuccess();
      } else {
        toast.info('No investors found in the provided content');
      }
    } catch (error) {
      console.error('AI extraction failed:', error);
      toast.error('Failed to extract investor information');
      setResult({ error: true, message: error.response?.data?.detail || 'Extraction failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="ai-extract-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <Sparkles className="h-5 w-5 text-orange-500" />
            AI-Powered Extraction
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Paste article content, news, or any text containing investor information. Our AI will extract and structure the data automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Paste Content
              </label>
              <span className="text-xs text-slate-400">
                From Inc42, YourStory, LinkedIn, X, Reddit, etc.
              </span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste article content here...

Example:
"Acme Ventures, led by John Smith (Managing Partner), announced a $50M fund focused on B2B SaaS startups in India and Southeast Asia. The fund typically invests $500K-$2M at Seed and Series A stages, taking 10-15% equity. Contact: john@acmeventures.com"

The AI will extract:
- Name, Title, Institution
- Investment focus (stage, size, sectors)
- Geographic preferences
- Contact information`}
              className="min-h-[200px] font-mono text-sm"
              disabled={loading}
              data-testid="ai-content-input"
            />
          </div>

          {/* Extract Button */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              {content.length > 0 && `${content.length} characters`}
            </p>
            <Button
              onClick={handleExtract}
              disabled={loading || !content.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white btn-lift"
              data-testid="extract-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract Investors
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-6 border-t pt-6">
              {result.error ? (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg" data-testid="extract-error">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-700">Extraction Failed</p>
                    <p className="text-sm text-rose-600 mt-1">{result.message}</p>
                  </div>
                </div>
              ) : result.investors.length > 0 ? (
                <div className="space-y-4" data-testid="extract-results">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <p className="font-medium text-slate-900">
                      Found {result.investors.length} investor(s)
                    </p>
                  </div>

                  <div className="space-y-3">
                    {result.investors.map((investor, index) => (
                      <div
                        key={investor.id || index}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{investor.name}</p>
                            {investor.title && investor.institution && (
                              <p className="text-sm text-slate-600">
                                {investor.title} at {investor.institution}
                              </p>
                            )}
                          </div>
                          {investor.stage && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                              {investor.stage}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          {investor.cheque_size && (
                            <div>
                              <span className="text-slate-500">Cheque Size:</span>{' '}
                              <span className="text-slate-700 font-medium">{investor.cheque_size}</span>
                            </div>
                          )}
                          {investor.shareholding && (
                            <div>
                              <span className="text-slate-500">Shareholding:</span>{' '}
                              <span className="text-slate-700 font-medium">{investor.shareholding}</span>
                            </div>
                          )}
                        </div>

                        {investor.sectors?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {investor.sectors.map(sector => (
                              <Badge key={sector} variant="secondary" className="text-xs">
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {investor.geographies?.length > 0 && (
                          <p className="mt-2 text-xs text-slate-500">
                            Geographies: {investor.geographies.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-sm text-emerald-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    All investors have been added to your database
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="extract-no-results">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700">No Investors Found</p>
                    <p className="text-sm text-amber-600 mt-1">
                      The AI couldn't find any investor information in the provided content. 
                      Try pasting more detailed content with names, fund details, and investment criteria.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
