"use client";
import { useUser } from "@clerk/nextjs";
import { Spinner } from "@/components/spinner";

export const DashboardAuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No autorizado</h2>
          <p className="text-gray-600">Por favor inicia sesión para continuar.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 