import { useState } from 'react';
import { Sparkles, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AIExtractModal = ({ open, onOpenChange, onSuccess }) => {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="ai-extract-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <Sparkles className="h-5 w-5 text-orange-500" />
            AI-Powered Extraction
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Extract investor information automatically from articles and news content.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Firebase Migration Notice</AlertTitle>
            <AlertDescription className="text-amber-700">
              AI extraction requires a secure backend to protect API keys. Since we've migrated to Firebase (client-side), 
              this feature needs Firebase Cloud Functions to be set up.
              <br /><br />
              <strong>For now, please add investors manually using the "Add Investor" button.</strong>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">To enable AI extraction:</h4>
            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
              <li>Set up Firebase Cloud Functions in your Firebase project</li>
              <li>Create a function that calls the OpenAI/Emergent API securely</li>
              <li>Update the extract function in <code className="bg-slate-200 px-1 rounded">src/lib/api.js</code></li>
            </ol>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-2">Manual Entry Tips:</h4>
            <p className="text-sm text-slate-600">
              When reading investor news from Inc42, YourStory, LinkedIn, etc., you can quickly add investors 
              by clicking "Add Investor" and filling in the details you find.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              handleClose();
              // Trigger the add investor modal via callback
              toast.info('Use the "Add Investor" button to add investors manually');
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Add Investor Manually
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
