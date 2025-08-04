import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  ThemedDropdownMenu as DropdownMenu, 
  ThemedDropdownMenuContent as DropdownMenuContent, 
  ThemedDropdownMenuItem as DropdownMenuItem, 
  ThemedDropdownMenuTrigger as DropdownMenuTrigger 
} from '@/components/ui/themed-dropdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Link, 
  Copy, 
  ExternalLink, 
  Share2, 
  Calendar,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { BookingSettings } from './booking-settings';

interface BookingLinkProps {
  className?: string;
}

export function BookingLink({ className }: BookingLinkProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch current practitioner's booking link
  const { data: practitioner, isLoading, error: practitionerError } = useQuery({
    queryKey: ['/api/practitioner/me'],
    queryFn: async () => {
      const response = await api.get('/api/practitioner/me');
      return response;
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch booking settings to check if public booking is enabled
  const { data: bookingSettings } = useQuery({
    queryKey: ['booking-settings'],
    queryFn: async () => {
      const response = await api.get('/api/practitioner/booking-settings');
      return response;
    },
    enabled: !!user,
    retry: 1,
  });

  

  // Generate booking link mutation
  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/practitioner/generate-booking-link');
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Link Generated",
        description: "Your public booking link has been created successfully.",
      });
      // Refetch practitioner data to get the new link
      window.location.reload();
    },
    onError: (error: any) => {
      console.error('Generate booking link error:', error);
      toast({
        title: "Failed to Generate Link",
        description: error.message || "Failed to generate booking link. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Copy link to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link Copied",
        description: "Booking link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  // Share link
  const shareLink = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Book an Appointment',
          text: 'Book an appointment with me using this link:',
          url: url,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying
      copyToClipboard(url);
    }
  };

  const bookingUrl = practitioner?.bookingLink 
    ? `${window.location.origin}/book/${practitioner.bookingLink}`
    : null;

  const handleGenerateLink = () => {
    generateLinkMutation.mutate();
  };

  const handleCopyLink = () => {
    if (bookingUrl) {
      copyToClipboard(bookingUrl);
    }
  };

  const handleShareLink = () => {
    if (bookingUrl) {
      shareLink(bookingUrl);
    }
  };

  const handleViewLink = () => {
    if (bookingUrl) {
      window.open(bookingUrl, '_blank');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Calendar className="h-4 w-4 mr-2" />
            Booking
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="p-4">
            {practitionerError ? (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 mb-2">Failed to load practitioner data</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Public Booking Link</h4>
                  <Badge variant={
                    practitioner?.bookingLink && bookingSettings?.isPublicBookingEnabled 
                      ? "default" 
                      : "secondary"
                  }>
                    {practitioner?.bookingLink && bookingSettings?.isPublicBookingEnabled 
                      ? "Active" 
                      : bookingSettings?.isPublicBookingEnabled === false 
                        ? "Inactive" 
                        : "Not Set"
                    }
                  </Badge>
                </div>

            {practitioner?.bookingLink ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    value={showLink ? (bookingUrl || "") : "••••••••••••••••••••••••••••••••"}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLink(!showLink)}
                  >
                    {showLink ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareLink}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewLink}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Booking Page
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create a public booking link for patients to schedule appointments directly.
                </p>
                <Button
                  onClick={handleGenerateLink}
                  disabled={generateLinkMutation.isPending}
                  className="w-full"
                >
                  {generateLinkMutation.isPending ? "Generating..." : "Generate Booking Link"}
                </Button>
              </div>
            )}

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Professional Settings</span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Professional Booking Settings</DialogTitle>
                    <DialogDescription>
                      Configure your public booking experience for optimal patient engagement.
                    </DialogDescription>
                  </DialogHeader>
                  <BookingSettings onClose={() => setIsDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Detailed Booking Link Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="hidden">
            <Link className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Public Booking Link</DialogTitle>
            <DialogDescription>
              Share this link with patients to allow them to book appointments directly.
            </DialogDescription>
          </DialogHeader>

          {practitioner?.bookingLink ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Link className="h-5 w-5" />
                    <span>Your Booking Link</span>
                  </CardTitle>
                  <CardDescription>
                    Patients can use this link to schedule appointments with you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Public URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={bookingUrl || ""} readOnly />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={handleViewLink}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview Page
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShareLink}
                      className="w-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Link
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Statistics</CardTitle>
                  <CardDescription>
                    Track how your booking link is performing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">0</div>
                      <div className="text-sm text-muted-foreground">Total Views</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-muted-foreground">Appointments Booked</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">0%</div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Booking Link Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create a public booking link to allow patients to schedule appointments directly.
                </p>
                <Button
                  onClick={handleGenerateLink}
                  disabled={generateLinkMutation.isPending}
                  size="lg"
                >
                  {generateLinkMutation.isPending ? "Generating..." : "Create Booking Link"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 