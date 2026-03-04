"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderTransitForm } from "./order-transit-form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewOrderTransitDialog = ({ open, onOpenChange }: Props) => {
  const router = useRouter();

  return (
    <ResponsiveDialog
      title="Nouvelle ordre de transit"
      description="Creer un nouvelle ordre de transit"
      open={open}
      onOpenChange={onOpenChange}
    >
      <OrderTransitForm
        onSuccess={(id) => {
          onOpenChange(false);
          router.push(`/transit-orders/${id}`);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
