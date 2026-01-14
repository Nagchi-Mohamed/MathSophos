
import { Footer } from "@/components/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">

      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
