import { Users, DollarSign, Globe, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const StatsCards = ({ investors, newCount }) => {
  // Calculate statistics
  const totalInvestors = investors.length;
  
  const uniqueGeographies = new Set();
  const uniqueSectors = new Set();
  const uniqueStages = new Set();
  
  investors.forEach(inv => {
    inv.geographies?.forEach(g => uniqueGeographies.add(g));
    inv.sectors?.forEach(s => uniqueSectors.add(s));
    if (inv.stage) uniqueStages.add(inv.stage);
  });

  const stats = [
    {
      label: 'Total Investors',
      value: totalInvestors,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'New Today',
      value: newCount,
      icon: DollarSign,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      label: 'Geographies',
      value: uniqueGeographies.size,
      icon: Globe,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Sectors Covered',
      value: uniqueSectors.size,
      icon: Layers,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-cards">
      {stats.map((stat, index) => (
        <Card key={stat.label} className="border-slate-200 card-hover">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
