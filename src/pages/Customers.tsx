
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Edit, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface OrderSummary {
  customer_id: string;
  order_count: number;
  total_spent: number;
}

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderSummaries, setOrderSummaries] = useState<Record<string, OrderSummary>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const addForm = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (currentCustomer && isEditSheetOpen) {
      editForm.reset({
        name: currentCustomer.name,
        email: currentCustomer.email,
      });
    }
  }, [currentCustomer, isEditSheetOpen, editForm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch customers
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (customerError) {
        throw customerError;
      }
      
      setCustomers(customerData || []);
      
      // Fetch order summaries for each customer
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('customer_id, amount');
      
      if (orderError) {
        throw orderError;
      }
      
      // Process order data
      const summaries: Record<string, OrderSummary> = {};
      
      orderData?.forEach(order => {
        if (!summaries[order.customer_id]) {
          summaries[order.customer_id] = {
            customer_id: order.customer_id,
            order_count: 0,
            total_spent: 0
          };
        }
        
        summaries[order.customer_id].order_count += 1;
        summaries[order.customer_id].total_spent += Number(order.amount);
      });
      
      setOrderSummaries(summaries);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (data: z.infer<typeof customerFormSchema>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .insert([
          { name: data.name, email: data.email }
        ]);

      if (error) throw error;
      
      toast.success("Customer added successfully");
      addForm.reset();
      setIsAddFormOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      toast.error(error.message || "Failed to add customer");
    }
  };

  const handleEditCustomer = async (data: z.infer<typeof customerFormSchema>) => {
    if (!currentCustomer) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .update({ name: data.name, email: data.email })
        .eq('id', currentCustomer.id);

      if (error) throw error;
      
      toast.success("Customer updated successfully");
      setIsEditSheetOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(error.message || "Failed to update customer");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!currentCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', currentCustomer.id);

      if (error) {
        if (error.message.includes('Cannot delete customer with existing orders')) {
          throw new Error('Cannot delete a customer with existing orders');
        }
        throw error;
      }
      
      toast.success("Customer deleted successfully");
      setIsDeleteConfirmOpen(false);
      setIsEditSheetOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.message || "Failed to delete customer");
      setIsDeleteConfirmOpen(false);
    }
  };

  const openEditSheet = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsEditSheetOpen(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={() => setIsAddFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* Add Customer Form */}
      {isAddFormOpen && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Add New Customer</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsAddFormOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(handleAddCustomer)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddFormOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-shopify-blue hover:bg-shopify-dark-blue"
                  >
                    Add Customer
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Customers</CardTitle>
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
                    <th className="font-medium pb-3 pl-4">Customer</th>
                    <th className="font-medium pb-3">Email</th>
                    <th className="font-medium pb-3">Orders</th>
                    <th className="font-medium pb-3">Total Spent</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        {searchTerm ? 'No customers match your search.' : 'No customers found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pl-4">
                          <div className="flex items-center">
                            <div className="mr-3 h-8 w-8 rounded-full bg-shopify-gray flex items-center justify-center">
                              <span className="text-shopify-blue font-medium">
                                {customer.name[0]}
                              </span>
                            </div>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm">{customer.email}</td>
                        <td className="py-3">{orderSummaries[customer.id]?.order_count || 0}</td>
                        <td className="py-3">
                          {orderSummaries[customer.id] 
                            ? formatCurrency(orderSummaries[customer.id].total_spent) 
                            : "$0.00"}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditSheet(customer)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Side Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Customer</SheetTitle>
            <SheetDescription>
              Make changes to the customer information.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditCustomer)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between mt-6">
                  <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the customer
                          {orderSummaries[currentCustomer?.id || ""] && 
                            orderSummaries[currentCustomer?.id || ""].order_count > 0 && 
                            " and may affect linked data"}
                          .
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCustomer}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button 
                    type="submit" 
                    className="bg-shopify-blue hover:bg-shopify-dark-blue"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
