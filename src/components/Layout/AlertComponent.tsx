import { Alert } from "@heroui/react";
import { useEffect } from "react";
import type { AlertData } from "../../types";

export default function AlertComponent({
  title,
  description,
  type,
  isOpen,
  onClose,
}: AlertData) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // 5 secondi

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  const getVariant = (type: "success" | "error" | "warning" | "info") => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
      default:
        return "default";
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 w-1/4">
      <Alert
        variant="faded"
        isVisible={isOpen}
        onClose={onClose}
        description={description}
        title={title}
        color={getVariant(type)}
      />
    </div>
  );
}
