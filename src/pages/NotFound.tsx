
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-shopify-light-blue rounded-full p-4 mb-6">
        <AlertCircle className="h-12 w-12 text-shopify-blue" />
      </div>
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-shopify-light-text mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button
        className="bg-shopify-blue hover:bg-shopify-dark-blue"
        onClick={() => window.location.href = '/'}
      >
        Back to Dashboard
      </Button>
    </div>
  );
};

export default NotFound;
