
import { useState } from "react";
import { addDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Tag, Search, Trash, Edit, Percent, DollarSign, CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DatePickerWithRange } from "@/components/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Discount {
  id: string;
  description: string;
  value: string;
  type: "percentage" | "fixed";
  status: "active" | "expired" | "scheduled";
  usage_count: number;
  starts_at?: string;
  expires_at?: string;
}

// Form schema for adding/editing discounts
const discountFormSchema = z.object({
  code: z.string().min(3, "Discount code must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  value: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Value must be a positive number",
  }),
  type: z.enum(["percentage", "fixed"]),
  status: z.enum(["active", "expired", "scheduled"]),
});

export default function Discounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<Discount | null>(null);
  const [addDateRange, setAddDateRange] = useState<DateRange | undefined>();
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for adding new discount
  const addForm = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: "",
      description: "",
      value: "",
      type: "percentage",
      status: "active"
    },
  });

  // Form for editing discount
  const editForm = useForm<z.infer<typeof discountFormSchema>>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: "",
      description: "",
      value: "",
      type: "percentage",
      status: "active"
    },
  });

  // Watch status changes to control date picker visibility
  const addFormStatus = addForm.watch("status");
  const editFormStatus = editForm.watch("status");

  // Fetch discounts
  const { data: discounts = [], isLoading, isError } = useQuery({
    queryKey: ["discounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discounts")
        .select("*");
      
      if (error) {
        throw error;
      }
      
      return data as Discount[];
    },
  });

  // Add discount mutation
  const addDiscountMutation = useMutation({
    mutationFn: async (values: z.infer<typeof discountFormSchema>) => {
      const { code, description, value, type, status } = values;
      
      // Create a properly structured object that matches what Supabase expects
      const discountData = {
        id: code, // Use code as the discount ID
        description: description, // Required field
        value: value, // Required field
        type: type, // Required field
        status: status, // Required field
        starts_at: status === "scheduled" && addDateRange?.from ? addDateRange.from.toISOString() : null,
        expires_at: status === "scheduled" && addDateRange?.to ? addDateRange.to.toISOString() : null,
      };
      
      const { data, error } = await supabase
        .from("discounts")
        .insert(discountData)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setIsAddSheetOpen(false);
      addForm.reset();
      setAddDateRange(undefined);
      toast({
        title: "Discount created",
        description: "Discount has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Edit discount mutation
  const editDiscountMutation = useMutation({
    mutationFn: async (values: z.infer<typeof discountFormSchema>) => {
      const { description, value, type, status } = values;
      
      if (!currentDiscount) {
        throw new Error("No discount selected for editing");
      }
      
      // Create a properly structured object for update
      const updateData = {
        description,
        value,
        type,
        status,
        starts_at: status === "scheduled" && editDateRange?.from ? editDateRange.from.toISOString() : null,
        expires_at: status === "scheduled" && editDateRange?.to ? editDateRange.to.toISOString() : null,
      };
      
      const { data, error } = await supabase
        .from("discounts")
        .update(updateData)
        .eq("id", currentDiscount.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      setIsEditSheetOpen(false);
      setCurrentDiscount(null);
      setEditDateRange(undefined);
      toast({
        title: "Discount updated",
        description: "Discount has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete discount mutation
  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("discounts")
        .delete()
        .eq("id", id);
      
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      toast({
        title: "Discount deleted",
        description: "Discount has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddSubmit = (values: z.infer<typeof discountFormSchema>) => {
    addDiscountMutation.mutate(values);
  };

  const handleEditSubmit = (values: z.infer<typeof discountFormSchema>) => {
    editDiscountMutation.mutate(values);
  };

  const handleDeleteDiscount = (id: string) => {
    deleteDiscountMutation.mutate(id);
  };

  const handleEditClick = (discount: Discount) => {
    setCurrentDiscount(discount);
    editForm.reset({
      code: discount.id,
      description: discount.description,
      value: discount.value,
      type: discount.type,
      status: discount.status,
    });
    
    // Set date range if available
    if (discount.starts_at || discount.expires_at) {
      setEditDateRange({
        from: discount.starts_at ? new Date(discount.starts_at) : undefined,
        to: discount.expires_at ? new Date(discount.expires_at) : undefined
      });
    } else {
      setEditDateRange(undefined);
    }
    
    setIsEditSheetOpen(true);
  };

  const filteredDiscounts = discounts.filter((discount) =>
    discount.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDiscount = (discount: Discount) => {
    if (discount.type === "percentage") {
      return `${discount.value}%`;
    } else {
      return `$${discount.value}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatScheduleDates = (discount: Discount) => {
    if (discount.status !== "scheduled") return null;
    
    if (discount.starts_at && discount.expires_at) {
      return (
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <CalendarRange className="h-3 w-3 mr-1" />
          {format(new Date(discount.starts_at), "MMM d, yyyy")} - {format(new Date(discount.expires_at), "MMM d, yyyy")}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Discount Codes</h2>
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
            onClick={() => setIsAddSheetOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Discount
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <p>Loading discounts...</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center py-6 text-red-500">
              <p>Error loading discounts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs border-b border-gray-200">
                    <th className="font-medium pb-3 pl-4">Discount Code</th>
                    <th className="font-medium pb-3">Description</th>
                    <th className="font-medium pb-3">Value</th>
                    <th className="font-medium pb-3">Status</th>
                    <th className="font-medium pb-3">Usage</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        {searchTerm ? 'No discounts match your search.' : 'No discounts found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDiscounts.map((discount) => (
                      <tr key={discount.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pl-4">
                          <div className="flex items-center">
                            <div className="mr-3 bg-shopify-gray rounded p-1.5">
                              <Tag className="h-5 w-5 text-shopify-light-text" />
                            </div>
                            <span className="font-medium">{discount.id}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            {discount.description}
                            {formatScheduleDates(discount)}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center">
                            {discount.type === "percentage" ? 
                              <Percent className="h-4 w-4 mr-1.5 text-gray-500" /> : 
                              <DollarSign className="h-4 w-4 mr-1.5 text-gray-500" />
                            }
                            <span className="font-medium">{formatDiscount(discount)}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className={getStatusColor(discount.status)}>
                            {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3">{discount.usage_count} uses</td>
                        <td className="py-3 text-right pr-4">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClick(discount)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Discount</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the discount code "{discount.id}"?
                                    {discount.status === "active" && (
                                      <p className="mt-2 text-red-500 font-medium">
                                        Warning: You cannot delete an active discount.
                                      </p>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={discount.status === "active"}
                                    onClick={() => handleDeleteDiscount(discount.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Discount Sheet */}
      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Discount</SheetTitle>
            <SheetDescription>
              Add a new discount code to your store
            </SheetDescription>
          </SheetHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4 pt-4">
              <FormField
                control={addForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Code</FormLabel>
                    <FormControl>
                      <Input placeholder="SUMMER20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer sale discount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {addFormStatus === "scheduled" && (
                <FormItem>
                  <FormLabel>Schedule Dates</FormLabel>
                  <DatePickerWithRange
                    dateRange={addDateRange}
                    onUpdate={setAddDateRange}
                  />
                  <FormMessage>
                    {!addDateRange?.from && "Start date is required for scheduled discounts"}
                    {!addDateRange?.to && addDateRange?.from && "End date is required for scheduled discounts"}
                  </FormMessage>
                </FormItem>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddSheetOpen(false);
                    addForm.reset();
                    setAddDateRange(undefined);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    addDiscountMutation.isPending || 
                    (addFormStatus === "scheduled" && (!addDateRange?.from || !addDateRange?.to))
                  }
                  className="bg-shopify-blue hover:bg-shopify-dark-blue"
                >
                  {addDiscountMutation.isPending ? "Creating..." : "Create Discount"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
      
      {/* Edit Discount Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={(open) => {
        if (!open) {
          setCurrentDiscount(null);
          setEditDateRange(undefined);
        }
        setIsEditSheetOpen(open);
      }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Discount</SheetTitle>
            <SheetDescription>
              Update the discount code "{currentDiscount?.id}"
            </SheetDescription>
          </SheetHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4 pt-4">
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {editFormStatus === "scheduled" && (
                <FormItem>
                  <FormLabel>Schedule Dates</FormLabel>
                  <DatePickerWithRange
                    dateRange={editDateRange}
                    onUpdate={setEditDateRange}
                  />
                  <FormMessage>
                    {!editDateRange?.from && "Start date is required for scheduled discounts"}
                    {!editDateRange?.to && editDateRange?.from && "End date is required for scheduled discounts"}
                  </FormMessage>
                </FormItem>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditSheetOpen(false);
                    setCurrentDiscount(null);
                    setEditDateRange(undefined);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    editDiscountMutation.isPending || 
                    (editFormStatus === "scheduled" && (!editDateRange?.from || !editDateRange?.to))
                  }
                  className="bg-shopify-blue hover:bg-shopify-dark-blue"
                >
                  {editDiscountMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
