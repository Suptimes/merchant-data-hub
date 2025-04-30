
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListOrdered, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Category {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

function SortableRow({ category }: { category: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="border-b border-gray-100 last:border-0 cursor-move"
      {...attributes}
      {...listeners}
    >
      <td className="py-3 pl-4">
        <div className="flex items-center">
          <div className="mr-3 bg-shopify-gray rounded p-1.5">
            <ListOrdered className="h-5 w-5 text-shopify-light-text" />
          </div>
          <span className="font-medium">{category.name}</span>
        </div>
      </td>
      <td className="py-3">{category.products}</td>
      <td className="py-3 text-sm text-shopify-light-text">{category.description}</td>
      <td className="py-3 pr-4 text-right">
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </td>
    </tr>
  );
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      
      setCategories(data || []);
      
      // Fetch product counts
      const { data: products } = await supabase.from('products').select('category_id');
      
      const counts: Record<string, number> = {};
      products?.forEach(product => {
        if (product.category_id) {
          counts[product.category_id] = (counts[product.category_id] || 0) + 1;
        }
      });
      
      setProductCounts(counts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Find the indexes
    const oldIndex = categories.findIndex(cat => cat.id === active.id);
    const newIndex = categories.findIndex(cat => cat.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      // Update the local state first for immediate visual feedback
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);
      
      // Update the display order in the database
      try {
        const updates = newCategories.map((category, index) => ({
          id: category.id,
          display_order: index + 1
        }));
        
        for (const update of updates) {
          const { error } = await supabase
            .from('categories')
            .update({ display_order: update.display_order })
            .eq('id', update.id);
            
          if (error) throw error;
        }
        
        toast.success("Categories order updated successfully");
      } catch (error) {
        console.error('Error updating category order:', error);
        toast.error("Failed to update category order");
        // Revert to the original order if there was an error
        fetchCategories();
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search categories..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={() => {
              // This would open a modal to add a new category
              toast.info("Add category feature coming soon");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Categories</CardTitle>
          <p className="text-sm text-shopify-light-text">Drag and drop to reorder categories</p>
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
                    <th className="font-medium pb-3">Products</th>
                    <th className="font-medium pb-3">Description</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
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
                        <SortableRow 
                          key={category.id} 
                          category={{
                            ...category,
                            products: productCounts[category.id] || 0
                          } as any}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
