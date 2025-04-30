
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListOrdered, Plus, Search, GripVertical } from "lucide-react";
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
import { CSS } from "@dnd-kit/utilities";

// Sortable item component for each category row
function SortableItem({ id, category }: { id: number, category: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 last:border-0">
      <td className="py-3 pl-4">
        <div className="flex items-center">
          <div 
            className="mr-2 cursor-grab text-gray-400 hover:text-gray-600" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
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
  const [categories, setCategories] = useState([
    { id: 1, name: "Electronics", products: 45, description: "Electronic devices and accessories" },
    { id: 2, name: "Clothing", products: 78, description: "Apparel and fashion items" },
    { id: 3, name: "Home & Kitchen", products: 56, description: "Items for home and kitchen use" },
    { id: 4, name: "Books", products: 34, description: "Books, e-books, and publications" },
    { id: 5, name: "Sports & Outdoors", products: 29, description: "Sporting goods and outdoor equipment" },
  ]);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle the end of a drag event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
            />
          </div>
          <Button className="bg-shopify-blue hover:bg-shopify-dark-blue">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
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
                  <SortableContext
                    items={categories.map(cat => cat.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map((category) => (
                      <SortableItem key={category.id} id={category.id} category={category} />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
