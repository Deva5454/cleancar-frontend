import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function WorkingHoursTest() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Working Hours Module - Test</h1>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Route is Working!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>If you see this, the route is accessible.</p>
          <p className="mt-2">Path: /workforce/working-hours</p>
        </CardContent>
      </Card>
    </div>
  );
}
