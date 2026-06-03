/**
 * Analytics State Components
 * Reusable loading, empty, and error state components for analytics dashboards
 */

import { Card, CardContent } from "../ui/card";
import { AlertCircle, BarChart3, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface AnalyticsLoadingProps {
  message?: string;
}

export function AnalyticsLoading({ message = "Loading analytics data..." }: AnalyticsLoadingProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

interface AnalyticsEmptyProps {
  title?: string;
  message?: string;
}

export function AnalyticsEmpty({
  title = "No Data Available",
  message = "There is no data to display at this time. Data will appear once records are created.",
}: AnalyticsEmptyProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </CardContent>
    </Card>
  );
}

interface AnalyticsErrorProps {
  title?: string;
  message?: string;
  error?: Error;
}

export function AnalyticsError({
  title = "Error Loading Data",
  message = "An error occurred while loading the analytics data. Please try again.",
  error,
}: AnalyticsErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {error && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer">Technical details</summary>
            <pre className="mt-1 p-2 bg-destructive/10 rounded">{error.message}</pre>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
}
