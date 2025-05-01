
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, ListOrdered, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  product_count?: number;
}

interface SortableItemProps {
  id: string;
  category: Category;
}

const SortableItem = ({ category }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 last:border-0">
      <td className="py-3 pl-4">
        <div className="flex items-center">
          <div className="mr-3 cursor-move" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 text-shopify-light-text" />
          </div>
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
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </td>
    </tr>
  );
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
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

    fetchCategories();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setCategories(prevCategories => {
      const oldIndex = prevCategories.findIndex(cat => cat.id === active.id);
      const newIndex = prevCategories.findIndex(cat => cat.id === over.id);
      
      return arrayMove(prevCategories, oldIndex, newIndex);
    });
    
    // Update display order in database
    try {
      const updatedCategories = categories.map((cat, index) => ({
        id: cat.id,
        display_order: index
      }));
      
      const { error } = await supabase
        .from('categories')
        .upsert(updatedCategories, { onConflict: 'id' });
        
      if (error) {
        throw error;
      }
      
      toast.success("Category order updated");
    } catch (error) {
      console.error("Error updating category order:", error);
      toast.error("Failed to update category order");
    }
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
            onClick={() => {
              toast.info("Add category feature coming soon");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            All Categories
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Drag to reorder)
            </span>
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
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={filteredCategories.map(cat => cat.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredCategories.map((category) => (
                          <SortableItem 
                            key={category.id} 
                            id={category.id} 
                            category={category} 
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
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
