// AIExtractModal.jsx

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
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
  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const handleExtract = async () => {
    if (!content.trim()) {
      toast.error('Please paste article or investor content first');
      return;
    }

    try {
      setLoading(true);

      const result = await investorApi.extract({
        content,
        sourceUrl,
      });

      if (onSuccess) {
        onSuccess(result);
      }

      toast.success('Investor details extracted successfully');
      onOpenChange(false);
      setContent('');
      setSourceUrl('');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'AI extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="ai-extract-modal">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold flex items-center gap-2"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <Sparkles className="h-5 w-5 text-orange-500" />
            AI-Powered Extraction
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Paste article text, news content, or investor bio to extract investor information automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Source URL (optional)
            </label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Article / Investor Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste article text, LinkedIn bio, news snippet, or investor description here..."
              rows={12}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none resize-none focus:border-orange-500"
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">Tips for better extraction:</h4>
            <p className="text-sm text-slate-600">
              Paste full article paragraphs instead of only headlines. Include details like firm name,
              designation, sectors, geography, and investment stage whenever available.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Close
          </Button>

          <Button
            onClick={handleExtract}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Investor'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};