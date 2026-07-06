import { Header } from "@/components/Header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl overflow-x-hidden px-4 py-6 sm:py-8">{children}</main>
    </>
  );
}
