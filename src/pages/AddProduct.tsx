
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, PackagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

export default function AddProduct() {
  const navigate = useNavigate();
  
  const [product, setProduct] = useState({
    name: "",
    sku: "",
    price: "",
    inventory: "0",
    category_id: "",
    occasion_id: "",
    description: "",
    discount: "",
    color: "",
    size: "",
    image_url: "",
    care_instructions: ""
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [allProducts, setAllProducts] = useState<RelatedProduct[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [selectedRelatedProducts, setSelectedRelatedProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories and products for the dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
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
          .order("name");

        if (productsError) throw productsError;

        setCategories(categoriesData || []);
        setOccasions(occasionsData || []);
        setAllProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load required data");
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setProduct({ ...product, [field]: value === "none" ? "" : value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product.name || !product.sku || !product.price) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);

    try {
      // Parse discount to number or null
      let discountValue = null;
      if (product.discount) {
        discountValue = parseFloat(product.discount);
        if (discountValue < 0 || discountValue > 100) {
          toast.error("Discount must be between 0 and 100");
          setLoading(false);
          return;
        }
      }

      // Insert the new product
      const { data, error } = await supabase.from("products").insert({
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price),
        inventory: parseInt(product.inventory),
        category_id: product.category_id || null,
        occasion_id: product.occasion_id || null,
        discount: discountValue,
        description: product.description || null,
        color: product.color || null,
        size: product.size || null,
        image_url: product.image_url || null,
        care_instructions: product.care_instructions || null,
      }).select();

      if (error) {
        throw error;
      }

      const newProductId = data[0].id;

      // Add related products if any
      if (relatedProducts.length > 0) {
        const relationshipsToInsert = relatedProducts.map(relatedId => ({
          product_id: newProductId,
          related_product_id: relatedId
        }));

        const { error: relatedError } = await supabase
          .from("product_relationships")
          .insert(relationshipsToInsert);

        if (relatedError) {
          console.error("Error adding related products:", relatedError);
          // Continue without failing the whole operation
        }
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
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Enter discount percentage"
                  value={product.discount}
                  onChange={handleInputChange}
                />
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
                <Select value={product.category_id || "none"} onValueChange={(value) => handleSelectChange("category_id", value)}>
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
                <Select value={product.occasion_id || "none"} onValueChange={(value) => handleSelectChange("occasion_id", value)}>
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
                  name="image_url"
                  placeholder="Enter image URL"
                  value={product.image_url || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  placeholder="Enter color"
                  value={product.color || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  name="size"
                  placeholder="Enter size"
                  value={product.size || ""}
                  onChange={handleInputChange}
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
                name="care_instructions"
                placeholder="Enter care instructions"
                value={product.care_instructions || ""}
                onChange={handleInputChange}
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter product description"
                value={product.description || ""}
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
