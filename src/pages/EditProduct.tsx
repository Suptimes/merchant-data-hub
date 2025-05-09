
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, PackagePlus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
}

interface Occasion {
  id: string;
  name: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  sku: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  category_id: string | null;
  occasion_id: string | null;
  description: string | null;
  discount: number | null;
  color: string | null;
  size: string | null;
  image_url: string | null;
  care_instructions: string | null;
}

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [allProducts, setAllProducts] = useState<RelatedProduct[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [selectedRelatedProducts, setSelectedRelatedProducts] = useState<{ id: string; name: string }[]>([]);
  
  const form = useForm<Product>({
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      inventory: 0,
      category_id: "",
      occasion_id: "",
      discount: null,
      description: "",
      color: "",
      size: "",
      image_url: "",
      care_instructions: ""
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch product data
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("Product not found");

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name")
          .order("display_order", { ascending: true });

        if (categoriesError) throw categoriesError;

        // Fetch occasions
        const { data: occasionsData, error: occasionsError } = await supabase
          .from("occasions")
          .select("id, name")
          .order("display_order", { ascending: true });

        if (occasionsError) throw occasionsError;

        // Fetch all products for related products dropdown
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name, sku")
          .neq("id", id) // Exclude current product
          .order("name");

        if (productsError) throw productsError;

        // Fetch related products
        const { data: relatedProductsData, error: relatedProductsError } = await supabase
          .from("product_relationships")
          .select("related_product_id, products!product_relationships_related_product_id_fkey(id, name)")
          .eq("product_id", id);

        if (relatedProductsError) throw relatedProductsError;

        const relatedIds = relatedProductsData.map(item => item.related_product_id);
        const selectedProducts = relatedProductsData.map(item => ({
          id: item.related_product_id,
          name: item.products?.name || "Unknown Product"
        }));

        setCategories(categoriesData || []);
        setOccasions(occasionsData || []);
        setAllProducts(productsData || []);
        setRelatedProducts(relatedIds);
        setSelectedRelatedProducts(selectedProducts);

        // Set form values
        form.reset({
          ...productData,
          price: productData.price,
          inventory: productData.inventory,
          discount: productData.discount
        });

      } catch (error) {
        console.error('Error fetching product data:', error);
        toast.error("Failed to load product data");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, form, navigate]);

  const handleSubmit = async (data: Product) => {
    setSaving(true);
    try {
      // Parse discount to number or null
      let discountValue = data.discount;
      if (discountValue !== null && (discountValue < 0 || discountValue > 100)) {
        toast.error("Discount must be between 0 and 100");
        setSaving(false);
        return;
      }

      // Update product details
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: data.name,
          sku: data.sku,
          price: Number(data.price),
          inventory: Number(data.inventory),
          category_id: data.category_id || null,
          occasion_id: data.occasion_id || null,
          discount: discountValue,
          description: data.description || null,
          color: data.color || null,
          size: data.size || null,
          image_url: data.image_url || null,
          care_instructions: data.care_instructions || null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // Delete existing relationships
      const { error: deleteError } = await supabase
        .from("product_relationships")
        .delete()
        .eq("product_id", id);

      if (deleteError) throw deleteError;

      // Add new relationships
      if (relatedProducts.length > 0) {
        const relationshipsToInsert = relatedProducts.map(relatedId => ({
          product_id: id!,
          related_product_id: relatedId
        }));

        const { error: insertError } = await supabase
          .from("product_relationships")
          .insert(relationshipsToInsert);

        if (insertError) throw insertError;
      }

      toast.success("Product updated successfully");
      navigate("/products");
    } catch (error: any) {
      console.error("Error updating product:", error);
      if (error.code === "23505") {
        toast.error("A product with this SKU already exists");
      } else {
        toast.error("Failed to update product");
      }
    } finally {
      setSaving(false);
    }
  };

  const addRelatedProduct = (productId: string) => {
    if (relatedProducts.includes(productId)) return;
    
    const selectedProduct = allProducts.find(p => p.id === productId);
    if (selectedProduct) {
      setRelatedProducts([...relatedProducts, productId]);
      setSelectedRelatedProducts([
        ...selectedRelatedProducts, 
        { id: productId, name: selectedProduct.name }
      ]);
    }
  };

  const removeRelatedProduct = (productId: string) => {
    setRelatedProducts(relatedProducts.filter(id => id !== productId));
    setSelectedRelatedProducts(selectedRelatedProducts.filter(p => p.id !== productId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-shopify-blue"></div>
      </div>
    );
  }

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
            <Package className="h-6 w-6 text-shopify-blue" />
            Edit Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name", { required: true })}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    {...form.register("sku", { required: true })}
                    placeholder="Enter unique product code"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="price"
                      {...form.register("price", { required: true, min: 0 })}
                      className="pl-7"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    {...form.register("discount", { min: 0, max: 100 })}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter discount percentage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inventory">Inventory</Label>
                  <Input
                    id="inventory"
                    {...form.register("inventory", { min: 0 })}
                    type="number"
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={form.watch("category_id") || "none"} 
                    onValueChange={(value) => form.setValue("category_id", value === "none" ? "" : value)}
                  >
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

                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select 
                    value={form.watch("occasion_id") || "none"} 
                    onValueChange={(value) => form.setValue("occasion_id", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {occasions.map((occasion) => (
                        <SelectItem key={occasion.id} value={occasion.id}>
                          {occasion.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    {...form.register("image_url")}
                    placeholder="Enter image URL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    {...form.register("color")}
                    placeholder="Enter color"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    {...form.register("size")}
                    placeholder="Enter size"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Related Products</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedRelatedProducts.map(product => (
                    <div key={product.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{product.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="p-0 h-5 w-5 rounded-full hover:bg-gray-200"
                        onClick={() => removeRelatedProduct(product.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline">
                      Add Related Product
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-72 overflow-y-auto">
                    {allProducts
                      .filter(p => !relatedProducts.includes(p.id))
                      .map(product => (
                        <DropdownMenuItem 
                          key={product.id} 
                          onClick={() => addRelatedProduct(product.id)}
                        >
                          {product.name} ({product.sku})
                        </DropdownMenuItem>
                      ))
                    }
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label htmlFor="care_instructions">Care Instructions</Label>
                <Textarea
                  id="care_instructions"
                  {...form.register("care_instructions")}
                  placeholder="Enter care instructions"
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Enter product description"
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
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
