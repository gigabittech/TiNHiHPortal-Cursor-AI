import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, TrendingUp, Users, Calendar } from "lucide-react";

export default function Reports() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Reports & Analytics" 
        subtitle="View practice performance and insights"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Patient Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Comprehensive patient analytics and demographics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-secondary" />
                Appointment Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Appointment trends and scheduling insights</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Revenue Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Financial performance and billing analytics</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reports Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Advanced Reports & Analytics</h3>
              <p className="text-slate-600">
                Detailed reporting features will be available in the next update. 
                Track patient outcomes, practice efficiency, and financial performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
