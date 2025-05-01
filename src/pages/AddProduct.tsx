
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
}

export default function AddProduct() {
  const navigate = useNavigate();
  
  const [product, setProduct] = useState({
    name: "",
    sku: "",
    price: "",
    inventory: "0",
    category_id: "",
    description: "",
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories for the dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .order("display_order", { ascending: true });

        if (error) {
          throw error;
        }

        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setProduct({ ...product, category_id: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product.name || !product.sku || !product.price) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase.from("products").insert({
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price),
        inventory: parseInt(product.inventory),
        category_id: product.category_id || null,
        description: product.description || null,
      }).select();

      if (error) {
        throw error;
      }

      toast.success("Product added successfully!");
      navigate("/products");
    } catch (error: any) {
      console.error("Error adding product:", error);
      if (error.code === "23505") {
        toast.error("A product with this SKU already exists.");
      } else {
        toast.error("Failed to add product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/products")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-shopify-blue" />
            Add New Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter product name"
                  value={product.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  name="sku"
                  placeholder="Enter unique product code"
                  value={product.sku}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="price"
                    name="price"
                    className="pl-7"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory</Label>
                <Input
                  id="inventory"
                  name="inventory"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={product.inventory}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={product.category_id} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter product description"
                value={product.description}
                onChange={handleInputChange}
                className="min-h-32"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate("/products")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-shopify-blue hover:bg-shopify-dark-blue"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
