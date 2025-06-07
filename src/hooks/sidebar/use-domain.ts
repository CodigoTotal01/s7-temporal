"use client"

import { useToast } from "@/components/ui/use-toast";
import { AddDomainSchema } from "@/schemas/settings.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { UploadClient } from "@uploadcare/upload-client";
import { Upload } from "lucide-react";
import { usePathname } from "next/navigation";
import { Field, FieldValue, FieldValues, useForm } from "react-hook-form";

const upload = new UploadClient({
  publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
});

export const useDomain = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FieldValues>({
    resolver: zodResolver(AddDomainSchema),
  });

  const pathname = usePathname();
  const {toast} = useToast();
  const [loading, setLoading] = useState<boolean> (false);
    const [domain, setDomain] = useState<string | undefined> (undefined);
};
