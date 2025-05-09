
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search, Percent, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  category_id: string | null;
  description: string | null;
  color: string | null;
  size: string | null;
  image_url: string | null;
  care_instructions: string | null;
  discount: number | null;
  occasion_id: string | null;
  occasions: {
    name: string;
  } | null;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, occasions(name)')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number, discount: number | null) => {
    if (discount) {
      const discountedPrice = price * (1 - discount / 100);
      return (
        <div className="flex flex-col">
          <span className="line-through text-gray-400 text-xs">${price.toFixed(2)}</span>
          <span className="text-red-500">${discountedPrice.toFixed(2)}</span>
        </div>
      );
    }
    return `$${price.toFixed(2)}`;
  };

  const handleEdit = (productId: string) => {
    navigate(`/products/edit/${productId}`);
  };

  const renderOccasionBadge = (product: Product) => {
    if (!product.occasions) return null;
    
    const getOccasionColor = (name: string) => {
      switch (name) {
        case 'New':
          return 'bg-blue-100 text-blue-700';
        case 'Discount':
          return 'bg-green-100 text-green-700';
        case 'Limited Edition':
          return 'bg-purple-100 text-purple-700';
        case 'Low Stock':
          return 'bg-orange-100 text-orange-700';
        case 'Hot':
          return 'bg-red-100 text-red-700';
        case "ELYSIAN's Choice":
          return 'bg-yellow-100 text-yellow-700';
        default:
          return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOccasionColor(product.occasions.name)}`}>
        {product.occasions.name}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to="/products/add">
            <Button 
              className="bg-shopify-blue hover:bg-shopify-dark-blue"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Products</CardTitle>
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
                    <th className="font-medium pb-3 pl-4">Product</th>
                    <th className="font-medium pb-3">SKU</th>
                    <th className="font-medium pb-3">Price</th>
                    <th className="font-medium pb-3">Inventory</th>
                    <th className="font-medium pb-3">Occasion</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        {searchTerm ? 'No products match your search.' : 'No products found. Add your first product.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pl-4">
                          <div className="flex items-center">
                            <div className="mr-3 bg-shopify-gray rounded p-1.5">
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name} 
                                  className="h-5 w-5 object-cover" 
                                />
                              ) : (
                                <Package className="h-5 w-5 text-shopify-light-text" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              {product.discount && (
                                <span className="text-xs flex items-center gap-1 text-green-600">
                                  <Percent className="h-3 w-3" /> {product.discount}% off
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-shopify-light-text">{product.sku}</td>
                        <td className="py-3">{formatPrice(product.price, product.discount)}</td>
                        <td className="py-3">{product.inventory}</td>
                        <td className="py-3">
                          {renderOccasionBadge(product)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(product.id)}
                          >
                            Edit
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
    </div>
  );
}
