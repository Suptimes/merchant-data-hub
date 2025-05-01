
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Tag, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DiscountType = "fixed" | "percentage" | "shipping";
type DiscountStatus = "active" | "expired" | "scheduled";

interface Discount {
  id: string;
  description: string;
  type: DiscountType;
  value: string;
  status: DiscountStatus;
  usage_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchDiscounts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('discounts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Convert string types to our specific types
        const typedDiscounts = data?.map(discount => ({
          ...discount,
          type: discount.type as DiscountType,
          status: discount.status as DiscountStatus
        })) || [];
        
        setDiscounts(typedDiscounts);
      } catch (error) {
        console.error('Error fetching discounts:', error);
        toast.error("Failed to load discounts");
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const filteredDiscounts = discounts.filter(discount =>
    discount.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return "No expiration";
    
    const date = new Date(expiryDate);
    const now = new Date();
    
    if (date < now) {
      return `Expired on ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
    
    // For scheduled discounts
    if (discount => discount.status === "scheduled") {
      return `Starts ${date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Discounts</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search discounts..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={() => {
              toast.info("Create discount feature coming soon");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Discount
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-blue"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs border-b border-gray-200">
                    <th className="font-medium pb-3 pl-4">Code</th>
                    <th className="font-medium pb-3">Description</th>
                    <th className="font-medium pb-3">Value</th>
                    <th className="font-medium pb-3">Used</th>
                    <th className="font-medium pb-3">Status</th>
                    <th className="font-medium pb-3">Expires</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pl-4">
                        <div className="flex items-center">
                          <div className="mr-3 bg-shopify-gray rounded p-1.5">
                            <Percent className="h-5 w-5 text-shopify-light-text" />
                          </div>
                          <span className="font-medium">{discount.id}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm">{discount.description}</td>
                      <td className="py-3">{discount.value}</td>
                      <td className="py-3">{discount.usage_count}</td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={
                            discount.status === "active"
                              ? "border-green-500 text-green-500"
                              : discount.status === "expired"
                              ? "border-red-500 text-red-500"
                              : "border-amber-500 text-amber-500"
                          }
                        >
                          {discount.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-shopify-light-text">
                        {formatExpiry(discount.expires_at)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
