import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { investorApi } from '@/lib/api';

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Late Stage'];
const CHEQUE_SIZES = [
  '$10K-$50K',
  '$50K-$100K',
  '$100K-$500K',
  '$500K-$1M',
  '$1M-$5M',
  '$5M-$10M',
  '$10M-$25M',
  '$25M+',
  '₹10L-₹50L',
  '₹50L-₹1Cr',
  '₹1Cr-₹5Cr',
  '₹5Cr-₹10Cr',
  '₹10Cr+',
];

export const AddInvestorModal = ({ open, onOpenChange, onSuccess, editingInvestor }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    title: '',
    cheque_size: '',
    geographies: [],
    sectors: [],
    stage: '',
    shareholding: '',
    email: '',
    website: '',
    source: '',
    notes: '',
  });
  const [geoInput, setGeoInput] = useState('');
  const [sectorInput, setSectorInput] = useState('');

  useEffect(() => {
    if (editingInvestor) {
      setFormData({
        name: editingInvestor.name || '',
        institution: editingInvestor.institution || '',
        title: editingInvestor.title || '',
        cheque_size: editingInvestor.cheque_size || '',
        geographies: editingInvestor.geographies || [],
        sectors: editingInvestor.sectors || [],
        stage: editingInvestor.stage || '',
        shareholding: editingInvestor.shareholding || '',
        email: editingInvestor.email || '',
        website: editingInvestor.website || '',
        source: editingInvestor.source || '',
        notes: editingInvestor.notes || '',
      });
    } else {
      setFormData({
        name: '',
        institution: '',
        title: '',
        cheque_size: '',
        geographies: [],
        sectors: [],
        stage: '',
        shareholding: '',
        email: '',
        website: '',
        source: '',
        notes: '',
      });
    }
  }, [editingInvestor, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addGeography = () => {
    if (geoInput.trim() && !formData.geographies.includes(geoInput.trim())) {
      setFormData(prev => ({
        ...prev,
        geographies: [...prev.geographies, geoInput.trim()]
      }));
      setGeoInput('');
    }
  };

  const removeGeography = (geo) => {
    setFormData(prev => ({
      ...prev,
      geographies: prev.geographies.filter(g => g !== geo)
    }));
  };

  const addSector = () => {
    if (sectorInput.trim() && !formData.sectors.includes(sectorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sectors: [...prev.sectors, sectorInput.trim()]
      }));
      setSectorInput('');
    }
  };

  const removeSector = (sector) => {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sector)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      if (editingInvestor) {
        await investorApi.update(editingInvestor.id, formData);
        toast.success('Investor updated successfully');
      } else {
        await investorApi.create(formData);
        toast.success('Investor added successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save investor:', error);
      toast.error('Failed to save investor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-investor-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {editingInvestor ? 'Edit Investor' : 'Add New Investor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Doe"
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution / Fund</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => handleChange('institution', e.target.value)}
                placeholder="ABC Ventures"
                data-testid="input-institution"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title / Role</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Partner, Managing Director..."
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Investment Stage</Label>
              <Select value={formData.stage} onValueChange={(v) => handleChange('stage', v)}>
                <SelectTrigger data-testid="select-stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cheque_size">Average Cheque Size</Label>
              <Select value={formData.cheque_size} onValueChange={(v) => handleChange('cheque_size', v)}>
                <SelectTrigger data-testid="select-cheque-size">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {CHEQUE_SIZES.map(size => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shareholding">Typical Shareholding</Label>
              <Input
                id="shareholding"
                value={formData.shareholding}
                onChange={(e) => handleChange('shareholding', e.target.value)}
                placeholder="10-20%"
                data-testid="input-shareholding"
              />
            </div>
          </div>

          {/* Geographies */}
          <div className="space-y-2">
            <Label>Geographies of Investment</Label>
            <div className="flex gap-2">
              <Input
                value={geoInput}
                onChange={(e) => setGeoInput(e.target.value)}
                placeholder="Add geography (e.g., India, USA)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGeography())}
                data-testid="input-geography"
              />
              <Button type="button" variant="outline" onClick={addGeography}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.geographies.map((geo) => (
                <Badge key={geo} variant="secondary" className="gap-1 pl-2">
                  {geo}
                  <button
                    type="button"
                    onClick={() => removeGeography(geo)}
                    className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Sectors */}
          <div className="space-y-2">
            <Label>Sectors / Industries</Label>
            <div className="flex gap-2">
              <Input
                value={sectorInput}
                onChange={(e) => setSectorInput(e.target.value)}
                placeholder="Add sector (e.g., Fintech, SaaS)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSector())}
                data-testid="input-sector"
              />
              <Button type="button" variant="outline" onClick={addSector}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.sectors.map((sector) => (
                <Badge key={sector} variant="secondary" className="gap-1 pl-2">
                  {sector}
                  <button
                    type="button"
                    onClick={() => removeSector(sector)}
                    className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="investor@fund.com"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://fund.com"
                data-testid="input-website"
              />
            </div>
          </div>

          {/* Source & Notes */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              placeholder="Inc42, YourStory, LinkedIn..."
              data-testid="input-source"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional information about the investor..."
              rows={3}
              data-testid="input-notes"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white btn-lift"
              data-testid="submit-investor-btn"
            >
              {loading ? 'Saving...' : editingInvestor ? 'Update Investor' : 'Add Investor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
