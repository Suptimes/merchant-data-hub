
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, ListOrdered, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  product_count?: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      // Get product counts
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('category_id');
      
      if (productError) {
        throw productError;
      }

      // Count products for each category
      const productCounts: Record<string, number> = {};
      productData?.forEach(product => {
        if (product.category_id) {
          productCounts[product.category_id] = (productCounts[product.category_id] || 0) + 1;
        }
      });

      // Add product count to categories
      const categoriesWithProductCount = data?.map(category => ({
        ...category,
        product_count: productCounts[category.id] || 0
      })) || [];
      
      setCategories(categoriesWithProductCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      // Find max display order to place new category at the end
      const maxOrderCategory = categories.reduce(
        (max, cat) => cat.display_order > max.display_order ? cat : max,
        { display_order: -1 } as Category
      );
      const newDisplayOrder = maxOrderCategory.display_order + 1;

      const { data, error } = await supabase
        .from('categories')
        .insert([
          { 
            name: newCategoryName.trim(), 
            description: newCategoryDescription.trim() || null,
            display_order: newDisplayOrder
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Category added successfully");
      setNewCategoryName("");
      setNewCategoryDescription("");
      setIsAddingCategory(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          name: editingCategory.name.trim(),
          description: editingCategory.description?.trim() || null
        })
        .eq('id', editingCategory.id);

      if (error) {
        throw error;
      }

      toast.success("Category updated successfully");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      // Check if category has associated products
      const categoryToDeleteObj = categories.find(cat => cat.id === categoryToDelete);
      if (categoryToDeleteObj && categoryToDeleteObj.product_count && categoryToDeleteObj.product_count > 0) {
        toast.error(`Cannot delete: This category has ${categoryToDeleteObj.product_count} associated products`);
        setDeleteConfirmOpen(false);
        setCategoryToDelete(null);
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete);

      if (error) {
        throw error;
      }

      toast.success("Category deleted successfully");
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Failed to delete category");
    }
  };

  const openDeleteConfirm = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteConfirmOpen(true);
  };

  const editCategory = (category: Category) => {
    setEditingCategory({ ...category });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Input
              type="search"
              placeholder="Search categories..."
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={() => setIsAddingCategory(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* Add Category Form */}
      <div className={`border rounded-lg p-4 bg-white transition-all duration-300 ${isAddingCategory ? 'block' : 'hidden'}`}>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Add New Category</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium mb-1">
                Category Name*
              </label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label htmlFor="categoryDescription" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="categoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Enter category description (optional)"
                rows={3}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
            Cancel
          </Button>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={handleAddCategory}
          >
            Add Category
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            All Categories
          </CardTitle>
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
                    <th className="font-medium pb-3 pl-4">Category</th>
                    <th className="font-medium pb-3">Description</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-500">
                        {searchTerm ? 'No categories match your search.' : 'No categories found. Add your first category.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => (
                      <tr key={category.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pl-4">
                          <div className="flex items-center">
                            <div className="mr-3 bg-shopify-gray rounded p-1.5">
                              <ListOrdered className="h-5 w-5 text-shopify-light-text" />
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {category.description ? (
                            <span className="text-sm text-shopify-light-text">{category.description}</span>
                          ) : (
                            <span className="text-sm text-gray-400">No description</span>
                          )}
                        </td>
                        <td className="py-3 text-right pr-4">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => editCategory(category)}>
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteConfirm(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Edit Category Sheet */}
      <Sheet open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Category</SheetTitle>
          </SheetHeader>
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div>
                <label htmlFor="editCategoryName" className="block text-sm font-medium mb-1">
                  Category Name*
                </label>
                <Input
                  id="editCategoryName"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label htmlFor="editCategoryDescription" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="editCategoryDescription"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Enter category description (optional)"
                  rows={3}
                />
              </div>
            </div>
          )}
          <SheetFooter className="pt-4">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
            <Button 
              className="bg-shopify-blue hover:bg-shopify-dark-blue"
              onClick={handleUpdateCategory}
            >
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4">Are you sure you want to delete this category? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
