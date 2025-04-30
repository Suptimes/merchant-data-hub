
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-shopify-gray">
      <Sidebar />
      <div className="lg:pl-64 min-h-screen">
        <main className="py-6 px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
