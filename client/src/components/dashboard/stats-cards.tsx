import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { ThemedCard, ThemedCardContent } from "@/components/ui/themed-card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

interface StatsCardsProps {
  className?: string;
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
}

export function StatsCards({ className }: StatsCardsProps) {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: insights } = useQuery<any>({
    queryKey: ["/api/dashboard/insights"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ThemedCard key={i} className="animate-pulse rounded-xl">
            <ThemedCardContent className="p-4 lg:p-6">
              <div 
                className="h-16 rounded"
                style={{ backgroundColor: `hsl(var(--muted))` }}
              ></div>
            </ThemedCardContent>
          </ThemedCard>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Patients",
      value: stats?.totalPatients || 0,
      change: insights?.patientsGrowth ? `${insights.patientsGrowth >= 0 ? '+' : ''}${insights.patientsGrowth.toFixed(1)}% from last month` : "+12% from last month",
      changeType: (insights?.patientsGrowth || 0) >= 0 ? "increase" as const : "decrease" as const,
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      onClick: () => setLocation("/patients"),
    },
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      subtitle: "appointments scheduled",
      icon: Calendar,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      onClick: () => setLocation("/calendar"),
    },
    {
      title: "Total Revenue",
      value: `$${Number(stats?.totalRevenue || 0).toFixed(2)}`,
      change: insights?.revenueGrowth ? `${insights.revenueGrowth >= 0 ? '+' : ''}${insights.revenueGrowth.toFixed(1)}% from last month` : "+8% from last month",
      changeType: (insights?.revenueGrowth || 0) >= 0 ? "increase" as const : "decrease" as const,
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      onClick: () => setLocation("/billing"),
    },
    {
      title: "Outstanding",
      value: `$${Number(stats?.outstandingRevenue || 0).toFixed(2)}`,
      subtitle: "pending payment",
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      onClick: () => setLocation("/billing?status=unpaid"),
    },
  ];

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
      {statsData.map((stat, index) => (
        <ThemedCard 
          key={index} 
          className="shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-xl"
          onClick={stat.onClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px -8px hsl(var(--primary) / 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <ThemedCardContent className="p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p 
                  className="text-xs lg:text-sm font-medium transition-colors duration-300"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                >
                  {stat.title}
                </p>
                <p 
                  className="text-2xl lg:text-3xl font-bold transition-colors duration-300"
                  style={{ color: `hsl(var(--foreground))` }}
                >
                  {stat.value}
                </p>
                {stat.change && (
                  <p className={`text-sm mt-1 ${
                    stat.changeType === "increase" ? "text-green-600" : "text-red-600"
                  }`}>
                    {stat.changeType === "increase" ? (
                      <TrendingUp className="inline w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="inline w-3 h-3 mr-1" />
                    )}
                    {stat.change}
                  </p>
                )}
                {stat.subtitle && (
                  <p 
                    className="text-sm mt-1 transition-colors duration-300"
                    style={{ color: `hsl(var(--muted-foreground))` }}
                  >
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}
              >
                <stat.icon 
                  className="w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300"
                  style={{ color: `hsl(var(--primary))` }}
                />
              </div>
            </div>
          </ThemedCardContent>
        </ThemedCard>
      ))}
    </div>
  );
}
